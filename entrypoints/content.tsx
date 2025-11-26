import { createRoot } from 'react-dom/client';
import { VersionStatsApp } from './components/VersionStatsApp';
import { debugPageStructure } from './utils/debugUtils';
import './styles/content.css';

export default defineContentScript({
  matches: ['*://www.npmjs.com/package/*?activeTab=versions'],
  main() {
    console.log('🚀 NPM Version Stats Extension loaded');
    
    let retryCount = 0;
    const maxRetries = 10;
    const retryDelay = 1000; // 1 second
    
    const tryInjectStats = async () => {
      console.log(`🔄 Attempting to inject stats (attempt ${retryCount + 1}/${maxRetries})`);
      
      const currentTagsSection = findCurrentTagsSection();
      const versionsTable = findVersionsTable();
      
      console.log('📋 Current Tags Section:', currentTagsSection ? 'Found' : 'Not found');
      console.log('📊 Versions Table:', versionsTable ? 'Found' : 'Not found');
      
      if (currentTagsSection && versionsTable && !document.getElementById('npm-version-stats-root')) {
        console.log('✅ Both sections found, injecting stats...');
        await injectVersionStats();
        return true;
      }
      
      return false;
    };
    
    // Wait for the page to load and find the versions table
    const observer = new MutationObserver(() => {
      if (retryCount < maxRetries) {
        tryInjectStats();
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: false,
      characterData: false
    });

    // Retry logic with increasing delays
    const retryInjection = async () => {
      if (retryCount >= maxRetries) {
        console.log('❌ Max retries reached, giving up');
        return;
      }
      
      const success = await tryInjectStats();
      if (!success) {
        retryCount++;
        console.log(`⏳ Waiting ${retryDelay}ms before retry ${retryCount}/${maxRetries}`);
        setTimeout(retryInjection, retryDelay * retryCount); // Increasing delay
      }
    };
    
    // Start retry process
    setTimeout(retryInjection, 1000); // Initial 1 second delay
  },
});

function findCurrentTagsSection() {
  // Try multiple approaches to find the Current Tags section
  const headings = document.querySelectorAll('h3, h2, .h3, .h2');
  for (const heading of headings) {
    if (heading.textContent?.includes('Current Tags')) {
      return heading;
    }
  }
  
  // Fallback: look for any element with "Current Tags" text
  const allElements = document.querySelectorAll('*');
  for (const element of allElements) {
    if (element.textContent?.includes('Current Tags') && 
        (element.tagName === 'H3' || element.tagName === 'H2' || 
         element.classList.contains('h3') || element.classList.contains('h2'))) {
      return element;
    }
  }
  
  return null;
}

function findVersionsTable() {
  console.log('🔍 Searching for versions table...');
  
  // First, run comprehensive debug to understand the page structure
  debugPageStructure();
  
  // Look specifically for Version History table using aria-labelledby attribute
  let versionsTable = document.querySelector('table[aria-labelledby="version-history"]');
  
  if (versionsTable) {
    console.log('✅ Found Version History table by aria-labelledby attribute');
    return versionsTable;
  }
  
  console.log('⚠️ Version History table not found by aria-labelledby, falling back to table detection...');
  
  // Fallback: Find the table with the most rows that contains version data
  const allTables = document.querySelectorAll('table');
  console.log(`📊 Found ${allTables.length} tables on the page`);
  
  let bestTable = null;
  let maxRows = 0;
  
  allTables.forEach((table, index) => {
    const rows = table.querySelectorAll('tbody tr, tr');
    console.log(`📋 Table ${index}: ${rows.length} rows`);
    
    // Check if this table contains version data
    const tableText = table.textContent || '';
    const hasVersionPattern = /\d+\.\d+\.\d+/.test(tableText);
    const hasDownloadPattern = /[\d,]+/.test(tableText); // Look for comma-separated numbers (downloads)
    
    console.log(`📊 Table ${index} check: hasVersion=${hasVersionPattern}, hasDownloads=${hasDownloadPattern}`);
    
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
  console.log('🔄 Final fallback: searching for any table with version patterns...');
  for (const table of allTables) {
    const tableText = table.textContent || '';
    if (/\d+\.\d+\.\d+/.test(tableText) && /[\d,]+/.test(tableText)) {
      console.log(`✅ Found fallback versions table`);
      return table;
    }
  }
  
  console.log('❌ No versions table found');
  return null;
}

async function injectVersionStats() {
  const currentTagsSection = findCurrentTagsSection();
  if (!currentTagsSection || document.getElementById('npm-version-stats-root')) {
    return;
  }

  // Create container for our React app
  const statsContainer = document.createElement('div');
  statsContainer.id = 'npm-version-stats-root';
  
  // Insert before Current Tags section
  currentTagsSection.parentNode?.insertBefore(statsContainer, currentTagsSection);
  
  // Render React app
  const root = createRoot(statsContainer);
  root.render(<VersionStatsApp />);
}
