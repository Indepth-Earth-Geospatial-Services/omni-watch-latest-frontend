'use client';

import React from 'react';
import { FolderOpen, FolderPlus } from 'lucide-react';
import { useProjects } from '@/hooks/useProjects';

interface ProjectHeaderProps {
  onNewProject: () => void;
}

const ProjectHeader = ({ onNewProject }: ProjectHeaderProps) => {
  const { data } = useProjects();

  const totalProjects = data?.pagination?.total ?? 0;
  const activeProjects = (data?.list ?? []).filter((p) => p.devices.length > 0).length;

  const stats = [
    {
      label: 'Total',
      value: totalProjects,
      icon: <FolderOpen size={16} className='text-theme-accent' />,
    },
    {
      label: 'With Devices',
      value: activeProjects,
      icon: <FolderPlus size={16} className='text-emerald-400' />,
      colorClass: 'text-emerald-400',
    },
  ];

  return (
    <div className='relative flex items-center w-full h-16 bg-card border border-border rounded-lg overflow-hidden px-4'>
      <div className='flex w-full h-full items-center'>
        {stats.map((stat, index) => (
          <div
            key={stat.label}
            className={`flex flex-col items-center justify-center flex-1 gap-0.5 ${
              index !== stats.length - 1 ? 'border-r border-zinc-800/40' : ''
            }`}
          >
            <div className='mb-0.5'>{stat.icon}</div>
            <span
              className={`text-sm font-semibold font-ui leading-none text-white ${stat.colorClass ?? ''}`}
            >
              {stat.value}
            </span>
            <span className='text-[10px] font-normal font-ui text-muted-foreground uppercase tracking-wide'>
              {stat.label}
            </span>
          </div>
        ))}

        {/* New Project button */}
        <div className='flex items-center ml-auto pl-4'>
          <button
            onClick={onNewProject}
            className='flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-ui font-semibold bg-theme-accent/10 text-theme-accent border border-theme-accent/20 hover:bg-theme-accent/20 transition-colors'
          >
            <FolderOpen size={13} />
            New Project
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProjectHeader;
