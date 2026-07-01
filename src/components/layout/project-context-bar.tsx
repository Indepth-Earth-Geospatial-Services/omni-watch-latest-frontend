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
    <div className='sticky top-16 z-30 flex items-center justify-between px-3 sm:px-5 h-10 bg-secondary/90 backdrop-blur-sm border-b border-border/80 text-xs font-ui gap-2 min-w-0'>
      {/* Left: project identity + stats */}
      <div className='flex items-center gap-2 sm:gap-3 min-w-0 overflow-hidden'>
        {/* Active project label */}
        <div className='flex items-center gap-1.5 min-w-0'>
          <FolderOpen size={13} className='text-theme-accent flex-shrink-0' />
          <span className='hidden sm:inline text-[11px] font-black tracking-wider text-muted-foreground uppercase mr-1'>
            Project
          </span>
          <span className='text-[13px] font-bold text-foreground max-w-[120px] sm:max-w-[200px] md:max-w-[260px] truncate'>
            {activeProject.name}
          </span>
        </div>

        {/* Divider */}
        <div className='w-px h-4 bg-secondary flex-shrink-0' />

        {/* Device count chip */}
        <div className='flex items-center gap-1 sm:gap-1.5 px-1.5 sm:px-2 py-0.5 bg-secondary/60 border border-border/50 rounded-full flex-shrink-0'>
          <PlaneTakeoff size={10} className='text-muted-foreground' />
          <span className='font-bold text-muted-foreground tabular-nums'>
            {activeProject.devices.length}
          </span>
          <span className='hidden sm:inline text-muted-foreground'>
            {activeProject.devices.length === 1 ? 'device' : 'devices'}
          </span>
        </div>

        {/* Flight areas chip — hidden on very small screens */}
        <div className='hidden xs:flex items-center gap-1 sm:gap-1.5 px-1.5 sm:px-2 py-0.5 bg-secondary/60 border border-border/50 rounded-full flex-shrink-0'>
          <Layers size={10} className='text-muted-foreground' />
          <span className='font-bold text-muted-foreground tabular-nums'>
            {activeProject.flight_areas.length}
          </span>
          <span className='hidden sm:inline text-muted-foreground'>
            {activeProject.flight_areas.length === 1 ? 'flight area' : 'flight areas'}
          </span>
        </div>
      </div>

      {/* Right: switch project */}
      <button
        onClick={handleSwitch}
        className='flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1 text-[11px] font-bold text-muted-foreground border border-border rounded-md hover:border-zinc-500 hover:text-foreground hover:bg-secondary/50 transition-all duration-150 flex-shrink-0'
      >
        <ArrowLeftRight size={11} />
        <span className='hidden sm:inline'>Switch Project</span>
      </button>
    </div>
  );
}
