// ProjectContextBar.tsx
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
    <div className='sticky top-16 z-30 flex items-center justify-between px-3 sm:px-5 h-10 bg-zinc-900/90 backdrop-blur-sm border-b border-zinc-800/80 text-xs font-poppins gap-2 min-w-0'>
      {/* Left: project identity + stats */}
      <div className='flex items-center gap-2 sm:gap-3 min-w-0 overflow-hidden'>
        {/* Active project label */}
        <div className='flex items-center gap-1.5 min-w-0'>
          <FolderOpen size={13} className='text-[#1C93FF] flex-shrink-0' />
          <span className='hidden sm:inline text-[11px] font-black tracking-wider text-zinc-500 uppercase mr-1'>
            Project
          </span>
          <span className='text-[13px] font-bold text-zinc-100 max-w-[120px] sm:max-w-[200px] md:max-w-[260px] truncate'>
            {activeProject.name}
          </span>
        </div>

        {/* Divider */}
        <div className='w-px h-4 bg-zinc-800 flex-shrink-0' />

        {/* Device count chip */}
        <div className='flex items-center gap-1 sm:gap-1.5 px-1.5 sm:px-2 py-0.5 bg-zinc-800/60 border border-zinc-700/50 rounded-full flex-shrink-0'>
          <PlaneTakeoff size={10} className='text-zinc-500' />
          <span className='font-bold text-zinc-300 tabular-nums'>
            {activeProject.devices.length}
          </span>
          <span className='hidden sm:inline text-zinc-600'>
            {activeProject.devices.length === 1 ? 'device' : 'devices'}
          </span>
        </div>

        {/* Flight areas chip — hidden on very small screens */}
        <div className='hidden xs:flex items-center gap-1 sm:gap-1.5 px-1.5 sm:px-2 py-0.5 bg-zinc-800/60 border border-zinc-700/50 rounded-full flex-shrink-0'>
          <Layers size={10} className='text-zinc-500' />
          <span className='font-bold text-zinc-300 tabular-nums'>
            {activeProject.flight_areas.length}
          </span>
          <span className='hidden sm:inline text-zinc-600'>
            {activeProject.flight_areas.length === 1 ? 'flight area' : 'flight areas'}
          </span>
        </div>
      </div>

      {/* Right: switch project */}
      <button
        onClick={handleSwitch}
        className='flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1 text-[11px] font-bold text-zinc-400 border border-zinc-700 rounded-md hover:border-zinc-500 hover:text-zinc-200 hover:bg-zinc-800/50 transition-all duration-150 flex-shrink-0'
      >
        <ArrowLeftRight size={11} />
        <span className='hidden sm:inline'>Switch Project</span>
      </button>
    </div>
  );
}
