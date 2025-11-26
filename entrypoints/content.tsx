import { createRoot } from 'react-dom/client';
import { VersionStatsApp } from './components/VersionStatsApp';
import './styles/content.css';

export default defineContentScript({
  matches: ['*://www.npmjs.com/package/*?activeTab=versions'],
  main() {
    console.log('NPM Version Stats Extension loaded');
    
    // Wait for the page to load and find the versions table
    const observer = new MutationObserver(() => {
      const currentTagsSection = findCurrentTagsSection();
      if (currentTagsSection && !document.getElementById('npm-version-stats-root')) {
        injectVersionStats();
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });

    // Initial check
    setTimeout(injectVersionStats, 1000);
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

function injectVersionStats() {
  const currentTagsSection = findCurrentTagsSection();
  if (!currentTagsSection || document.getElementById('npm-version-stats-root')) {
    return;
  }

  // Create container for our React app
  const statsContainer = document.createElement('div');
  statsContainer.id = 'npm-version-stats-root';
  
  // Insert before the Current Tags section
  currentTagsSection.parentNode?.insertBefore(statsContainer, currentTagsSection);
  
  // Render React app
  const root = createRoot(statsContainer);
  root.render(<VersionStatsApp />);
}
