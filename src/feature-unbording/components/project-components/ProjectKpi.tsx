'use client';

import React from 'react';
import { Plus } from 'lucide-react';

interface ProjectHeaderProps {
  onNewProject: () => void;
}

const ProjectHeader = ({ onNewProject }: ProjectHeaderProps) => {
  return (
    <div className='flex items-center justify-between'>
      <h1 className='text-lg font-bold text-foreground font-ui'></h1>
      <button
        onClick={onNewProject}
        className='flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-ui font-semibold bg-theme-accent text-white hover:bg-theme-accent/90 transition-colors'
      >
        <Plus size={14} />
        New Project
      </button>
    </div>
  );
};

export default ProjectHeader;
