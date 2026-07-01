'use client';

import { lazy, Suspense, useState } from 'react';
import { Search, Plus } from 'lucide-react';
import AssetManagement from '../components/assets-components/AssetManagement';
import FleetOverviewKPI from '../components/assets-components/FleetOverviewKPI';
import { useDJIDevices } from '@/hooks/useDJIDevices';

const AddAssetModal = lazy(() => import('../components/assets-components/AddAssetModal'));

export default function AssetsPage() {
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const { data: devices = [], isLoading, error } = useDJIDevices();

  return (
    <div className='flex flex-col gap-4 font-ui p-6'>
      <FleetOverviewKPI devices={devices} isLoading={isLoading} />

      <div className='flex items-center justify-between'>
        <div className='relative flex-1 max-w-sm'>
          <div className='absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none'>
            <Search size={12} className='text-zinc-500' />
          </div>
          <input
            type='text'
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder='Search devices...'
            className='w-full text-xs font-ui text-zinc-400 bg-zinc-900 border border-zinc-800 rounded-lg pl-9 pr-3 py-1.5 focus:outline-none focus:border-zinc-600'
          />
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className='flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-ui font-semibold bg-theme-accent/10 text-theme-accent border border-theme-accent/20 hover:bg-theme-accent/20 transition-colors'
        >
          <Plus size={13} />
          Add Asset
        </button>
      </div>

      <AssetManagement devices={devices} isLoading={isLoading} error={error} searchQuery={searchQuery} />

      {showAddModal && (
        <Suspense fallback={null}>
          <AddAssetModal open={true} onClose={() => setShowAddModal(false)} />
        </Suspense>
      )}
    </div>
  );
}
