'use client';

import AssetManagement from '../components/assets-components/AssetManagement';
import FleetOverviewKPI from '../components/assets-components/FleetOverviewKPI';

export default function AssetsPage() {
  return (
    <div className='flex flex-col gap-4'>
      <FleetOverviewKPI />
      <div className='flex justify-between mx-4 items-center w-[calc(100%-2rem)]'>
        <h2 className='text-3xl font-bold text-[#E2E2E8]'>Assets Overview</h2>
        <button className='bg-[#1C93FF] text-white py-2 px-4 rounded-md hover:bg-[#1C93FF]/80 focus:outline-none focus:ring-2 focus:ring-blue-500'>
          Add Asset
        </button>
      </div>
      <AssetManagement />
    </div>
  );
}
