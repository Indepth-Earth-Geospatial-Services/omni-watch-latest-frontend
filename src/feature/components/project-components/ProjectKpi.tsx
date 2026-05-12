'use client';

import React from 'react';
import KPIItem from '../layout/KpiItems';
import { Plus } from 'lucide-react';

const ProjectHeader = () => {
  return (
    <div className='flex items-center justify-between w-[calc(100%-4rem)] h-[70px] px-6 bg-[#1A1C20] backdrop-blur-md border border-[#424754] rounded-sm overflow-hidden my-2 mx-8'>
      {/* 1. Metrics Grid */}
      <div className='flex items-center'>
        <KPIItem label='Total Projects' value={8} valueClass='text-[#1C93FF]' />
        {/* <KPIItem label='Device Online' value={14} />
        <KPIItem label='Dock' value={3} /> */}
        {/* <KPIItem label='Active' value={2} valueClass='text-[#FF4D4D]' /> */}
        {/* <KPIItem label='Offline' value='4.2' unit='km²' valueClass='text-[#45F0CF]' /> */}
      </div>

      {/* 2. Live Indicator (Right-aligned) */}
      <button className='flex gap-2 justify-center items-center bg-[#518DFF] text-white py-2 px-4 rounded-sm hover:bg-[#1C93FF]/80 focus:outline-none focus:ring-2 focus:ring-blue-500'>
        <Plus size={14} />
        New Project
      </button>
    </div>
  );
};

export default ProjectHeader;
