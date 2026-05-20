'use client';

import { useState } from 'react';
import { Plus } from 'lucide-react';
import AssetManagement from '../components/assets-components/AssetManagement';
import FleetOverviewKPI from '../components/assets-components/FleetOverviewKPI';
import AddAssetModal from '../components/assets-components/AddAssetModal';
import { useDJIDevices } from '@/hooks/useDJIDevices';

/**
 * Fetches all devices bound to the workspace from:
 *   GET /manage/api/v1/devices/{workspace_id}/devices
 * and passes the result down to child components.
 */
export default function AssetsPage() {
  const [showAddModal, setShowAddModal] = useState(false);

  // Single fetch at page level — children receive devices as props
  const { data: devices = [], isLoading, error } = useDJIDevices();

  return (
    <div className='flex flex-col gap-4'>
      <FleetOverviewKPI devices={devices} isLoading={isLoading} />

      <div className='flex justify-between mx-4 items-center w-[calc(100%-2rem)]'>
        <h2 className='text-3xl font-bold text-[#E2E2E8]'>Assets Overview</h2>
        <button
          onClick={() => setShowAddModal(true)}
          className='flex items-center gap-2 bg-[#1C93FF] text-white py-2 px-4 rounded-md hover:bg-[#1C93FF]/80 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-semibold transition-colors'
        >
          <Plus size={14} />
          Add Asset
        </button>
      </div>

      <AssetManagement devices={devices} isLoading={isLoading} error={error} />

      <AddAssetModal open={showAddModal} onClose={() => setShowAddModal(false)} />
    </div>
  );
}
