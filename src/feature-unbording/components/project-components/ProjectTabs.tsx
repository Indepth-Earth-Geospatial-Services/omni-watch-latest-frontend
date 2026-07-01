'use client';

import React from 'react';

export type ProjectTabType = 'All' | 'Active' | 'Archived';

interface ProjectTabsProps {
  activeTab: ProjectTabType;
  onTabChange: (tab: ProjectTabType) => void;
  counts?: Record<ProjectTabType, number>;
}

const tabs: ProjectTabType[] = ['All', 'Active', 'Archived'];

const tabColors: Record<ProjectTabType, { active: string; badge: string; badgeActive: string }> = {
  All:      { active: 'text-foreground bg-secondary',       badge: 'bg-secondary text-muted-foreground',       badgeActive: 'bg-foreground/15 text-foreground' },
  Active:   { active: 'text-emerald-400 bg-emerald-500/10', badge: 'bg-emerald-500/10 text-emerald-500',     badgeActive: 'bg-emerald-500/20 text-emerald-400' },
  Archived: { active: 'text-amber-400 bg-amber-500/10',    badge: 'bg-amber-500/10 text-amber-500',         badgeActive: 'bg-amber-500/20 text-amber-400' },
};

const ProjectTabs = ({ activeTab, onTabChange, counts }: ProjectTabsProps) => {
  return (
    <div className='flex items-center gap-1'>
      {tabs.map((tab) => {
        const isActive = activeTab === tab;
        const count = counts?.[tab];
        const colors = tabColors[tab];
        return (
          <button
            key={tab}
            onClick={() => onTabChange(tab)}
            className={`relative px-3 py-1.5 text-xs font-semibold font-ui rounded-lg transition-colors ${
              isActive
                ? colors.active
                : 'text-muted-foreground hover:text-foreground hover:bg-secondary/50'
            }`}
          >
            <span className='flex items-center gap-1.5'>
              {tab}
              {count !== undefined && (
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${
                  isActive ? colors.badgeActive : colors.badge
                }`}>
                  {count}
                </span>
              )}
            </span>
          </button>
        );
      })}
    </div>
  );
};

export default ProjectTabs;
