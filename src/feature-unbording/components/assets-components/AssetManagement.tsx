'use client';

import React, { useState } from 'react';
import AssetTabs from './AssetTabs';
import AssetTable from './AssetTable';
import type { DJIDevice } from '@/lib/types';

export type TabType = 'All' | 'Drones' | 'Docks';

interface AssetManagementProps {
  devices: DJIDevice[];
  isLoading: boolean;
  error: Error | null;
}

const AssetManagement = ({ devices, isLoading, error }: AssetManagementProps) => {
  const [activeTab, setActiveTab] = useState<TabType>('All');

  return (
    <div className='flex flex-col gap-6 w-full p-2'>
      <div className='flex justify-start'>
        <AssetTabs activeTab={activeTab} onTabChange={setActiveTab} devices={devices} />
      </div>

      <AssetTable activeTab={activeTab} devices={devices} isLoading={isLoading} error={error} />
    </div>
  );
};

export default AssetManagement;
