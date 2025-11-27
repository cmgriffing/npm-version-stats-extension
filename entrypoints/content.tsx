import { createRoot } from "react-dom/client";
import { VersionStatsApp } from "./components/VersionStatsApp";
import { debugPageStructure } from "./utils/debugUtils";
import "./styles/content.css";

export default defineContentScript({
  matches: ["*://www.npmjs.com/package/*"],
  main() {
    console.log("🚀 NPM Version Stats Extension loaded");

    let retryCount = 0;
    const maxRetries = 20; // Increased for tab navigation scenarios
    const retryDelay = 1000; // 1 second
    let isVersionsTabActive = false;
    let currentUrl = window.location.href;
    let injectionInProgress = false;

    // Check if we're currently on the versions tab
    function isOnVersionsTab(): boolean {
      return window.location.href.includes("activeTab=versions");
    }

    // Check if versions tab panel is visible
    function isVersionsPanelVisible(): boolean {
      const versionsPanel = document.getElementById("tabpanel-versions");
      if (!versionsPanel) {
        console.log("🔍 Versions panel (tabpanel-versions) not found in DOM");
        return false;
      }

      const ariaHidden = versionsPanel.getAttribute("aria-hidden");
      const isVisible = ariaHidden !== "true";
      const displayStyle = window.getComputedStyle(versionsPanel).display;
      const actuallyVisible = isVisible && displayStyle !== "none";

      console.log(
        `📊 Versions panel status: aria-hidden="${ariaHidden}", display="${displayStyle}", visible=${actuallyVisible}`
      );

      return actuallyVisible;
    }

    // Main injection logic
    const tryInjectStats = async () => {
      if (!isOnVersionsTab() || !isVersionsPanelVisible()) {
        console.log(
          "🔄 Not on versions tab or panel not visible, skipping injection"
        );
        return false;
      }

      if (injectionInProgress) {
        console.log("⏳ Injection already in progress, skipping");
        return false;
      }

      console.log(
        `🔄 Attempting to inject stats (attempt ${
          retryCount + 1
        }/${maxRetries})`
      );

      const currentTagsSection = findCurrentTagsSection();
      const versionsTable = findVersionsTable();

      console.log(
        "📋 Current Tags Section:",
        currentTagsSection ? "Found" : "Not found"
      );
      console.log("📊 Versions Table:", versionsTable ? "Found" : "Not found");

      if (
        currentTagsSection &&
        versionsTable &&
        !document.getElementById("npm-version-stats-root")
      ) {
        console.log("✅ Both sections found, injecting stats...");
        injectionInProgress = true;
        try {
          await injectVersionStats();
          isVersionsTabActive = true;
          return true;
        } finally {
          injectionInProgress = false;
        }
      }

      return false;
    };

    // URL change monitoring
    const urlObserver = new MutationObserver(() => {
      if (window.location.href !== currentUrl) {
        const oldUrl = currentUrl;
        currentUrl = window.location.href;
        console.log(`🔄 URL changed from ${oldUrl} to ${currentUrl}`);

        if (isOnVersionsTab() && !isVersionsTabActive) {
          console.log(
            "✅ Detected navigation to versions tab, resetting retry count"
          );
          retryCount = 0;
          isVersionsTabActive = false;
          setTimeout(tryInjectStats, 500); // Small delay for content to load
        }
      }
    });

    // Tab panel visibility monitoring
    const tabPanelObserver = new MutationObserver(() => {
      if (
        isOnVersionsTab() &&
        isVersionsPanelVisible() &&
        !isVersionsTabActive
      ) {
        console.log("✅ Detected versions tab panel became visible");
        retryCount = 0;
        setTimeout(tryInjectStats, 500);
      }
    });

    // Tab click monitoring
    function setupTabClickListeners() {
      // Look for version tabs using multiple selectors
      const versionTabSelectors = [
        'a[href*="activeTab=versions"]',
        'button[data-testid="versions-tab"]',
        '[role="tab"][data-tab="versions"]',
        'a[href*="tab=versions"]',
      ];

      for (const selector of versionTabSelectors) {
        const tabs = document.querySelectorAll(selector);
        tabs.forEach((tab) => {
          if (!tab.hasAttribute("data-extension-listener")) {
            tab.addEventListener("click", () => {
              console.log(
                `🖱️ Versions tab clicked (${selector}), preparing for injection`
              );
              isVersionsTabActive = false;
              retryCount = 0;
            });
            tab.setAttribute("data-extension-listener", "true");
            console.log(`✅ Added click listener to versions tab: ${selector}`);
          }
        });
      }
    }

    // History API monitoring for SPA navigation
    const originalPushState = history.pushState;
    const originalReplaceState = history.replaceState;

    history.pushState = function (...args) {
      const result = originalPushState.apply(this, args);
      setTimeout(() => {
        if (isOnVersionsTab() && !isVersionsTabActive) {
          console.log("📚 History pushState detected versions tab");
          retryCount = 0;
          tryInjectStats();
        }
      }, 100);
      return result;
    };

    history.replaceState = function (...args) {
      const result = originalReplaceState.apply(this, args);
      setTimeout(() => {
        if (isOnVersionsTab() && !isVersionsTabActive) {
          console.log("📚 History replaceState detected versions tab");
          retryCount = 0;
          tryInjectStats();
        }
      }, 100);
      return result;
    };

    // Start observers
    urlObserver.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: false,
      characterData: false,
    });

    tabPanelObserver.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["aria-hidden"],
    });

    // Retry logic with increasing delays
    const retryInjection = async () => {
      if (retryCount >= maxRetries) {
        console.log("❌ Max retries reached, giving up for now");
        // Don't give up permanently - reset after 30 seconds
        setTimeout(() => {
          if (isOnVersionsTab() && !isVersionsTabActive) {
            console.log("🔄 Resetting retry count after timeout");
            retryCount = 0;
            retryInjection();
          }
        }, 30000);
        return;
      }

      const success = await tryInjectStats();
      if (!success) {
        retryCount++;
        console.log(
          `⏳ Waiting ${retryDelay}ms before retry ${retryCount}/${maxRetries}`
        );
        setTimeout(retryInjection, retryDelay * Math.min(retryCount, 5)); // Cap delay at 5 seconds
      }
    };

    // Periodic check for tab listeners and version tab activation
    const setupPeriodicCheck = () => {
      setupTabClickListeners();

      // Check if we should be on versions tab but haven't injected yet
      if (isOnVersionsTab() && !isVersionsTabActive && !injectionInProgress) {
        console.log("🔄 Periodic check detected versions tab should be active");
        retryCount = 0;
        setTimeout(tryInjectStats, 500);
      }

      setTimeout(setupPeriodicCheck, 3000); // Check every 3 seconds
    };

    // Initial setup
    if (isOnVersionsTab()) {
      console.log("✅ Starting on versions tab");
      setTimeout(retryInjection, 1000); // Initial 1 second delay
    } else {
      console.log(
        "ℹ️ Not on versions tab initially, will monitor for navigation"
      );
    }

    setTimeout(setupPeriodicCheck, 1000);
  },
});

function findCurrentTagsSection() {
  // Try multiple approaches to find the Current Tags section
  const headings = document.querySelectorAll("h3, h2, .h3, .h2");
  for (const heading of headings) {
    if (heading.textContent?.includes("Current Tags")) {
      return heading;
    }
  }

  // Fallback: look for any element with "Current Tags" text
  const allElements = document.querySelectorAll("*");
  for (const element of allElements) {
    if (
      element.textContent?.includes("Current Tags") &&
      (element.tagName === "H3" ||
        element.tagName === "H2" ||
        element.classList.contains("h3") ||
        element.classList.contains("h2"))
    ) {
      return element;
    }
  }

  return null;
}

function findVersionsTable() {
  console.log("🔍 Searching for versions table...");

  // First, run comprehensive debug to understand the page structure
  debugPageStructure();

  // Look specifically for Version History table using aria-labelledby attribute
  let versionsTable = document.querySelector(
    'table[aria-labelledby="version-history"]'
  );

  if (versionsTable) {
    console.log("✅ Found Version History table by aria-labelledby attribute");
    return versionsTable;
  }

  console.log(
    "⚠️ Version History table not found by aria-labelledby, falling back to table detection..."
  );

  // Fallback: Find the table with the most rows that contains version data
  const allTables = document.querySelectorAll("table");
  console.log(`📊 Found ${allTables.length} tables on the page`);

  let bestTable = null;
  let maxRows = 0;

  allTables.forEach((table, index) => {
    const rows = table.querySelectorAll("tbody tr, tr");
    console.log(`📋 Table ${index}: ${rows.length} rows`);

    // Check if this table contains version data
    const tableText = table.textContent || "";
    const hasVersionPattern = /\d+\.\d+\.\d+/.test(tableText);
    const hasDownloadPattern = /[\d,]+/.test(tableText); // Look for comma-separated numbers (downloads)

    console.log(
      `📊 Table ${index} check: hasVersion=${hasVersionPattern}, hasDownloads=${hasDownloadPattern}`
    );

    if (hasVersionPattern && hasDownloadPattern && rows.length > maxRows) {
      maxRows = rows.length;
      bestTable = table;
    }
  });

  if (bestTable) {
    console.log(`✅ Found versions table with ${maxRows} rows`);
    return bestTable;
  }

  // Final fallback: try any table with version patterns
  console.log(
    "🔄 Final fallback: searching for any table with version patterns..."
  );
  for (const table of allTables) {
    const tableText = table.textContent || "";
    if (/\d+\.\d+\.\d+/.test(tableText) && /[\d,]+/.test(tableText)) {
      console.log(`✅ Found fallback versions table`);
      return table;
    }
  }

  console.log("❌ No versions table found");
  return null;
}

async function injectVersionStats() {
  const currentTagsSection = findCurrentTagsSection();
  if (
    !currentTagsSection ||
    document.getElementById("npm-version-stats-root")
  ) {
    return;
  }

  // Create container for our React app
  const statsContainer = document.createElement("div");
  statsContainer.id = "npm-version-stats-root";

  // Insert before Current Tags section
  currentTagsSection.parentNode?.insertBefore(
    statsContainer,
    currentTagsSection
  );

  // Render React app
  const root = createRoot(statsContainer);
  root.render(<VersionStatsApp />);
}
