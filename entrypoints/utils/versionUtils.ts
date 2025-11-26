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

export function scrapeVersionData(): VersionData[] {
  console.log('🔍 Starting version data scraping...');
  
  // Find versions table (should be the larger table with more rows)
  const allTables = document.querySelectorAll('table');
  console.log(`📊 Found ${allTables.length} tables on the page`);
  
  let versionsTable = null;
  let maxRows = 0;
  
  allTables.forEach((table, index) => {
    const rows = table.querySelectorAll('tbody tr, tr');
    console.log(`📋 Table ${index}: ${rows.length} rows`);
    
    if (rows.length > maxRows) {
      maxRows = rows.length;
      versionsTable = table;
    }
  });
  
  const versionData: VersionData[] = [];

  if (versionsTable) {
    console.log(`✅ Using versions table with ${maxRows} rows`);
    
    const rows = versionsTable.querySelectorAll('tbody tr, tr');
    const allDownloadCounts: number[] = [];
    const rowData: Array<{version: string, downloads: number, row: Element}> = [];
    
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
    
  } else {
    console.log('❌ No versions table found');
  }

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