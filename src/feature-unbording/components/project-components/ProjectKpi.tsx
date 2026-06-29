'use client';

import React from 'react';
import { Plus } from 'lucide-react';
import KPIItem from '../layout/KpiItems';
import { useProjects } from '@/hooks/useProjects';

interface ProjectHeaderProps {
  onNewProject: () => void;
}

const ProjectHeader = ({ onNewProject }: ProjectHeaderProps) => {
  const { data } = useProjects();

  const totalProjects = data?.pagination?.total ?? 0;
  const activeProjects = (data?.list ?? []).filter((p) => p.devices.length > 0).length;

  return (
    <div className='flex items-center justify-between w-[calc(100%-2rem)] h-[56px] sm:h-[70px] px-3 sm:px-4 md:px-6 bg-[#1A1C20] backdrop-blur-md border border-[#424754] rounded-sm overflow-hidden my-2 mx-4'>
      {/* Metrics */}
      <div className='flex items-center'>
        <KPIItem label='Total Projects' value={totalProjects} valueClass='text-[#1C93FF]' />
        <KPIItem label='With Devices' value={activeProjects} valueClass='text-emerald-400' />
      </div>

      {/* New Project button */}
      <button
        onClick={onNewProject}
        className='flex gap-1 sm:gap-2 justify-center items-center bg-[#518DFF] text-white py-1 px-2 sm:py-1.5 sm:px-3 md:py-2 md:px-4 rounded-sm hover:bg-[#1C93FF]/80 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors text-[10px] sm:text-xs md:text-sm font-semibold flex-shrink-0'
      >
        <Plus size={10} className='sm:w-3 sm:h-3 md:w-3.5 md:h-3.5' />
        New Project
      </button>
    </div>
  );
};

export default ProjectHeader;
