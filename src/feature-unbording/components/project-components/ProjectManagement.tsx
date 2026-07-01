'use client';

import React, { useState } from 'react';
import ProjectTabs, { ProjectTabType } from './ProjectTabs';
import ProjectTable from './ProjectTable';
import type { Project } from '@/lib/types';

interface ProjectManagementProps {
  onEditProject: (project: Project) => void;
}

const ProjectManagement = ({ onEditProject }: ProjectManagementProps) => {
  const [activeTab, setActiveTab] = useState<ProjectTabType>('All');
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <div className='flex flex-col gap-4 w-full'>
      <ProjectTabs
        activeTab={activeTab}
        onTabChange={(tab) => setActiveTab(tab)}
      />
      <ProjectTable
        activeTab={activeTab}
        searchQuery={searchQuery}
        onEditProject={onEditProject}
      />
    </div>
  );
};

export default ProjectManagement;
