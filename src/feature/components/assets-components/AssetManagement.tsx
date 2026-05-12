'use client';

import React, { useState } from 'react';
import AssetTabs from './AssetTabs';
import AssetTable from './AssetTable';

// Define a unified type to be used across all components
export type TabType = 'All' | 'Drones' | 'Docks';

const AssetManagement = () => {
  const [activeTab, setActiveTab] = useState<TabType>('All');

  return (
    <div className='flex flex-col gap-6 w-full p-2'>
      {/* Tab Control Section */}
      <div className='flex justify-start'>
        <AssetTabs activeTab={activeTab} onTabChange={setActiveTab} />
      </div>

      {/* Filtered Table Section */}
      <AssetTable activeTab={activeTab} />
    </div>
  );
};

export default AssetManagement;
