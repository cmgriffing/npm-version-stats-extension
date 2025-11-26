import { useState, useEffect } from 'react';
import { VersionData, VersionGroup } from '../types/version';
import { scrapeVersionData, groupVersions } from '../utils/versionUtils';
import { StatsTabs } from './StatsTabs';
import { LoadingSpinner } from './LoadingSpinner';

export function VersionStatsApp() {
  const [versionData, setVersionData] = useState<VersionData[]>([]);
  const [groupedData, setGroupedData] = useState<VersionGroup | null>(null);
  const [activeTab, setActiveTab] = useState<'major' | 'minor' | 'patch'>('major');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const data = scrapeVersionData();
        if (data.length === 0) {
          setError('No version data found');
          return;
        }
        setVersionData(data);
        const grouped = groupVersions(data);
        setGroupedData(grouped);
      } catch (err) {
        setError('Failed to load version data');
        console.error('Error loading version data:', err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  if (loading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return (
      <div className="npm-stats-error">
        <p>{error}</p>
      </div>
    );
  }

  if (!groupedData) {
    return null;
  }

  return (
    <div className="npm-version-stats">
      <div className="npm-stats-header">
        <h3>Version Usage Statistics</h3>
        <p className="npm-stats-subtitle">
          Analyzing {versionData.length} versions (excluding 0.0% usage)
        </p>
      </div>
      
      <StatsTabs
        groupedData={groupedData}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />
    </div>
  );
}