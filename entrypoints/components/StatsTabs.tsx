import { VersionGroup, TabData } from '../types/version';
import { calculateGroupUsage } from '../utils/versionUtils';

interface StatsTabsProps {
  groupedData: VersionGroup;
  activeTab: 'major' | 'minor' | 'patch';
  onTabChange: (tab: 'major' | 'minor' | 'patch') => void;
}

export function StatsTabs({ groupedData, activeTab, onTabChange }: StatsTabsProps) {
  const tabs: TabData[] = [
    { label: 'Major Versions', key: 'major', data: groupedData.major },
    { label: 'Minor Versions', key: 'minor', data: groupedData.minor },
    { label: 'Patch Versions', key: 'patch', data: groupedData.patch }
  ];

  const currentData = tabs.find(tab => tab.key === activeTab);

  return (
    <div className="npm-stats-tabs">
      <div className="npm-stats-tab-headers">
        {tabs.map(tab => (
          <button
            key={tab.key}
            className={`npm-stats-tab-header ${activeTab === tab.key ? 'active' : ''}`}
            onClick={() => onTabChange(tab.key)}
          >
            {tab.label}
            <span className="npm-stats-tab-count">
              ({Object.keys(tab.data).length})
            </span>
          </button>
        ))}
      </div>

      <div className="npm-stats-tab-content">
        {currentData && (
          <div className="npm-stats-grid">
            {Object.entries(currentData.data)
              .sort(([, a], [, b]) => calculateGroupUsage(b) - calculateGroupUsage(a))
              .map(([groupKey, versions]) => {
                const totalUsage = calculateGroupUsage(versions);
                return (
                  <div key={groupKey} className="npm-stats-card">
                    <div className="npm-stats-card-header">
                      <h4 className="npm-stats-group-name">{groupKey}</h4>
                      <span className="npm-stats-total-usage">{totalUsage.toFixed(1)}%</span>
                    </div>
                    <div className="npm-stats-versions-list">
                      {versions.slice(0, 5).map(version => (
                        <div key={version.version} className="npm-stats-version-item">
                          <span className="npm-stats-version">{version.version}</span>
                          <span className="npm-stats-usage">{version.usage.toFixed(1)}%</span>
                        </div>
                      ))}
                      {versions.length > 5 && (
                        <div className="npm-stats-more">
                          +{versions.length - 5} more versions
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
          </div>
        )}
      </div>
    </div>
  );
}