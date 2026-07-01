'use client';

import React from 'react';

export type ProjectTabType = 'All' | 'Active' | 'Offline' | 'Online';

interface ProjectTabsProps {
  activeTab: ProjectTabType;
  onTabChange: (tab: ProjectTabType) => void;
}

const tabs: ProjectTabType[] = ['All', 'Active', 'Online', 'Offline'];

const ProjectTabs = ({ activeTab, onTabChange }: ProjectTabsProps) => {
  return (
    <div className='flex items-center gap-1 border-b border-zinc-800/50'>
      {tabs.map((tab) => {
        const isActive = activeTab === tab;
        return (
          <button
            key={tab}
            onClick={() => onTabChange(tab)}
            className={`relative px-4 py-2.5 text-xs font-semibold font-ui transition-colors ${
              isActive
                ? 'text-theme-accent'
                : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            {tab}
            {isActive && (
              <span className='absolute bottom-0 left-0 w-full h-[2px] bg-theme-accent' />
            )}
          </button>
        );
      })}
    </div>
  );
};

export default ProjectTabs;
