'use client';

import { useRouter } from 'next/navigation';
import { FolderOpen, PlaneTakeoff, Layers, ArrowLeftRight } from 'lucide-react';
import { useProject } from '@/providers/ProjectProvider';

export function ProjectContextBar() {
  const { activeProject, clearActiveProject } = useProject();
  const router = useRouter();

  if (!activeProject) return null;

  const handleSwitch = () => {
    clearActiveProject();
    router.replace('/projects');
  };

  return (
    <div className='sticky top-16 z-30 flex items-center justify-between px-5 h-10 bg-zinc-900/90 backdrop-blur-sm border-b border-zinc-800/80 text-xs font-poppins'>
      {/* Left: project identity + stats */}
      <div className='flex items-center gap-3'>
        {/* Active project label */}
        <div className='flex items-center gap-1.5'>
          <FolderOpen size={13} className='text-[#1C93FF] flex-shrink-0' />
          <span className='text-[11px] font-black tracking-wider text-zinc-500 uppercase mr-1'>
            Project
          </span>
          <span className='text-[13px] font-bold text-zinc-100 max-w-[260px] truncate'>
            {activeProject.name}
          </span>
        </div>

        {/* Divider */}
        <div className='w-px h-4 bg-zinc-800' />

        {/* Device count chip */}
        <div className='flex items-center gap-1.5 px-2 py-0.5 bg-zinc-800/60 border border-zinc-700/50 rounded-full'>
          <PlaneTakeoff size={10} className='text-zinc-500' />
          <span className='font-bold text-zinc-300 tabular-nums'>{activeProject.devices.length}</span>
          <span className='text-zinc-600'>
            {activeProject.devices.length === 1 ? 'device' : 'devices'}
          </span>
        </div>

        {/* Flight areas chip */}
        <div className='flex items-center gap-1.5 px-2 py-0.5 bg-zinc-800/60 border border-zinc-700/50 rounded-full'>
          <Layers size={10} className='text-zinc-500' />
          <span className='font-bold text-zinc-300 tabular-nums'>
            {activeProject.flight_areas.length}
          </span>
          <span className='text-zinc-600'>
            {activeProject.flight_areas.length === 1 ? 'flight area' : 'flight areas'}
          </span>
        </div>
      </div>

      {/* Right: switch project */}
      <button
        onClick={handleSwitch}
        className='flex items-center gap-1.5 px-3 py-1 text-[11px] font-bold text-zinc-400 border border-zinc-700 rounded-md hover:border-zinc-500 hover:text-zinc-200 hover:bg-zinc-800/50 transition-all duration-150'
      >
        <ArrowLeftRight size={11} />
        Switch Project
      </button>
    </div>
  );
}
