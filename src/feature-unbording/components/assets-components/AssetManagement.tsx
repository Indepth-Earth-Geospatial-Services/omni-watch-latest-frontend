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

const isDrone = (d: { domain: string }) => d.domain === '0';
const isDock  = (d: { domain: string }) => d.domain === '1' || d.domain === '3';

const AssetManagement = ({ devices, isLoading, error }: AssetManagementProps) => {
  const [activeTab, setActiveTab] = useState<TabType>('All');

  const counts = {
    All:    devices.length,
    Drones: devices.filter(isDrone).length,
    Docks:  devices.filter(isDock).length,
  };

  return (
    <div className='flex flex-col gap-6 w-full p-2'>
      <div className='flex justify-start'>
        <AssetTabs activeTab={activeTab} onTabChange={setActiveTab} counts={counts} />
      </div>

      <AssetTable activeTab={activeTab} devices={devices} isLoading={isLoading} error={error} />
    </div>
  );
};

export default AssetManagement;
