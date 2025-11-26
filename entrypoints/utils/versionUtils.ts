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
  // Try multiple possible selectors for the versions table
  let versionRows: NodeListOf<Element> | null = null;
  
  // Try the most specific selector first
  versionRows = document.querySelectorAll('table[data-testid="versions"] tbody tr');
  
  // Fallback to other possible selectors
  if (versionRows.length === 0) {
    versionRows = document.querySelectorAll('table.versions tbody tr');
  }
  
  if (versionRows.length === 0) {
    versionRows = document.querySelectorAll('table tbody tr');
  }

  const versionData: VersionData[] = [];

  versionRows.forEach((row) => {
    const cells = row.querySelectorAll('td');
    if (cells.length >= 2) {
      const versionCell = cells[0];
      const usageCell = cells[1];
      
      const version = versionCell.textContent?.trim();
      const usageText = usageCell.textContent?.trim();
      
      if (version && usageText) {
        const usageMatch = usageText.match(/([\d.]+)%/);
        if (usageMatch) {
          const usage = parseFloat(usageMatch[1]);
          
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
        }
      }
    }
  });

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