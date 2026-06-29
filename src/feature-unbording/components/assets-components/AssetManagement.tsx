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
  searchQuery?: string;
}

const AssetManagement = ({ devices, isLoading, error, searchQuery = '' }: AssetManagementProps) => {
  const [activeTab, setActiveTab] = useState<TabType>('All');

  return (
    <div className='flex flex-col gap-4 w-full'>
      <AssetTabs activeTab={activeTab} onTabChange={setActiveTab} devices={devices} />
      <AssetTable activeTab={activeTab} devices={devices} isLoading={isLoading} error={error} searchQuery={searchQuery} />
    </div>
  );
};

export default AssetManagement;
