import { VersionData, VersionGroup } from '../types/version';

export function parseVersion(version: string): { major: number; minor: number; patch: number } {
  const cleanVersion = version.replace(/^v/, '');
  const parts = cleanVersion.split('.').map(part => parseInt(part, 10));
  
  return {
    major: parts[0] || 0,
    minor: parts[1] || 0,
    patch: parts[2] || 0
  };
}

export async function ensureDeprecatedVersionsShown(): Promise<boolean> {
  console.log('🔍 Checking for deprecated versions checkbox...');
  
  // Find checkbox by its ID or label text
  const checkbox = document.getElementById('fake_showDeprecated') as HTMLInputElement ||
                  document.querySelector('input[name="showDeprecated"]') as HTMLInputElement ||
                  Array.from(document.querySelectorAll('input[type="checkbox"]'))
                    .find(cb => cb.nextElementSibling?.textContent?.includes('show deprecated versions')) as HTMLInputElement;
  
  if (!checkbox) {
    console.log('⚠️ Deprecated versions checkbox not found');
    // Debug: log all checkboxes found
    const allCheckboxes = document.querySelectorAll('input[type="checkbox"]');
    console.log(`🔍 Found ${allCheckboxes.length} checkboxes total:`);
    allCheckboxes.forEach((cb, index) => {
      const checkbox = cb as HTMLInputElement;
      console.log(`  ${index}: id="${checkbox.id}", name="${checkbox.name}", label="${checkbox.nextElementSibling?.textContent}"`);
    });
    return false;
  }
  
  console.log(`📋 Deprecated checkbox found, currently: ${checkbox.checked ? 'checked' : 'unchecked'}`);
  
  if (!checkbox.checked) {
    console.log('✅ Checking deprecated versions checkbox to show all versions...');
    
    // Click the checkbox
    checkbox.click();
    
    // Wait for content to load - deprecated versions are loaded dynamically
    console.log('⏳ Waiting 2 seconds for deprecated versions to load...');
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Verify the checkbox is now checked
    console.log(`📋 Checkbox state after click: ${checkbox.checked ? 'checked' : 'unchecked'}`);
    
    console.log('✅ Deprecated versions checkbox checked, waited for content to load');
    return true;
  }
  
  console.log('✅ Deprecated versions already shown');
  return false;
}

export async function scrapeVersionData(): Promise<VersionData[]> {
  console.log('🔍 Starting version data scraping...');
  
  // First ensure deprecated versions are shown
  await ensureDeprecatedVersionsShown();
  
  // Look specifically for Version History table using aria-labelledby
  let versionsTable = document.querySelector('table[aria-labelledby="version-history"]') as HTMLTableElement;
  
  if (!versionsTable) {
    console.log('⚠️ Version History table not found by aria-labelledby, falling back to largest table...');
    
    // Fallback: find table with most rows (original logic)
    const allTables = document.querySelectorAll('table');
    console.log(`📊 Found ${allTables.length} tables on page`);
    
    let maxRows = 0;
    
    allTables.forEach((table, index) => {
      const rows = table.querySelectorAll('tbody tr, tr');
      console.log(`📋 Table ${index}: ${rows.length} rows`);
      
      if (rows.length > maxRows) {
        maxRows = rows.length;
        versionsTable = table as HTMLTableElement;
      }
    });
  }
  
  if (!versionsTable) {
    console.log('❌ No versions table found');
    return [];
  }
  
  console.log(`✅ Found versions table`);
  
  const versionData: VersionData[] = [];
  const rows = versionsTable.querySelectorAll('tbody tr, tr');
  const allDownloadCounts: number[] = [];
  const rowData: Array<{version: string, downloads: number, row: Element}> = [];
  
  console.log(`📊 Processing ${rows.length} rows from versions table`);
  
  // First pass: extract all data and collect download counts
  rows.forEach((row, index) => {
    const cells = row.querySelectorAll('td, th');
    if (cells.length >= 2) {
      const version = cells[0].textContent?.trim();
      const downloadsText = cells[1].textContent?.trim();
      
      console.log(`📝 Row ${index}: version="${version}", downloads="${downloadsText}"`);
      
      if (version && downloadsText) {
        // Parse download count (remove commas, convert to number)
        const downloadsMatch = downloadsText.match(/[\d,]+/);
        if (downloadsMatch) {
          const downloads = parseInt(downloadsMatch[0].replace(/,/g, ''), 10);
          
          if (!isNaN(downloads) && downloads > 0) {
            allDownloadCounts.push(downloads);
            rowData.push({ version, downloads, row });
          }
        } else {
          console.log(`⚠️ Could not parse downloads from: "${downloadsText}"`);
        }
      }
    }
  });
  
  // Calculate total downloads for percentage calculation
  const totalDownloads = allDownloadCounts.reduce((sum, count) => sum + count, 0);
  console.log(`📊 Total downloads: ${totalDownloads.toLocaleString()}`);
  
  // Second pass: calculate percentages and create version data
  rowData.forEach(({ version, downloads }) => {
    const usage = totalDownloads > 0 ? (downloads / totalDownloads) * 100 : 0;
    
    console.log(`📈 ${version}: ${downloads.toLocaleString()} downloads (${usage.toFixed(2)}%)`);
    
    // Skip versions with 0.0% usage
    if (usage > 0) {
      const { major, minor, patch } = parseVersion(version);
      versionData.push({
        version,
        usage,
        major,
        minor,
        patch
      });
    }
  });

  console.log(`📈 Final result: ${versionData.length} valid versions found`);
  
  return versionData.sort((a, b) => {
    if (a.major !== b.major) return b.major - a.major;
    if (a.minor !== b.minor) return b.minor - a.minor;
    return b.patch - a.patch;
  });
}

export function groupVersions(versions: VersionData[]): VersionGroup {
  const grouped: VersionGroup = {
    major: {},
    minor: {},
    patch: {}
  };

  versions.forEach(version => {
    // Group by major version
    const majorKey = `${version.major}.x.x`;
    if (!grouped.major[majorKey]) {
      grouped.major[majorKey] = [];
    }
    grouped.major[majorKey].push(version);

    // Group by minor version
    const minorKey = `${version.major}.${version.minor}.x`;
    if (!grouped.minor[minorKey]) {
      grouped.minor[minorKey] = [];
    }
    grouped.minor[minorKey].push(version);

    // Group by patch version (individual versions)
    const patchKey = version.version;
    if (!grouped.patch[patchKey]) {
      grouped.patch[patchKey] = [];
    }
    grouped.patch[patchKey].push(version);
  });

  // Sort groups by total usage
  Object.keys(grouped.major).forEach(key => {
    grouped.major[key].sort((a, b) => b.usage - a.usage);
  });

  Object.keys(grouped.minor).forEach(key => {
    grouped.minor[key].sort((a, b) => b.usage - a.usage);
  });

  Object.keys(grouped.patch).forEach(key => {
    grouped.patch[key].sort((a, b) => b.usage - a.usage);
  });

  return grouped;
}

export function calculateGroupUsage(versions: VersionData[]): number {
  return versions.reduce((sum, version) => sum + version.usage, 0);
}