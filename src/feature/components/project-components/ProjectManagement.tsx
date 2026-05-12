'use client';

import React, { useState } from 'react';
import ProjectTabs, { ProjectTabType } from './ProjectTabs';
import ProjectTable from './ProjectTable';

const ProjectManagement = () => {
  const [activeTab, setActiveTab] = useState<ProjectTabType>('All');
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <div className='flex flex-col gap-4 w-full'>
      <ProjectTabs
        activeTab={activeTab}
        onTabChange={(tab) => {
          setActiveTab(tab);
        }}
        onSearch={setSearchQuery}
      />
      <ProjectTable activeTab={activeTab} searchQuery={searchQuery} />
    </div>
  );
};

export default ProjectManagement;
