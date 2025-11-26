import { useState, useEffect } from 'react';
import { VersionData, VersionGroup } from '../types/version';
import { scrapeVersionData, groupVersions } from '../utils/versionUtils';
import { debugPageStructure } from '../utils/debugUtils';
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
        console.log('🔄 Starting to load version data...');
        setLoading(true);
        setError(null);
        
        // Run debug first
        debugPageStructure();
        
        const data = scrapeVersionData();
        console.log(`📊 Scraped ${data.length} versions`);
        
        if (data.length === 0) {
          console.log('❌ No version data found');
          setError('No version data found. Check console for debugging info.');
          return;
        }
        
        console.log('✅ Version data loaded successfully:', data);
        setVersionData(data);
        
        const grouped = groupVersions(data);
        console.log('📋 Grouped data:', grouped);
        setGroupedData(grouped);
      } catch (err) {
        console.error('❌ Error loading version data:', err);
        setError(`Failed to load version data: ${err instanceof Error ? err.message : 'Unknown error'}`);
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