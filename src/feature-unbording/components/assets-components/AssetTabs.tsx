'use client';

import React from 'react';
import type { DJIDevice } from '@/lib/types';
import { TabType } from './AssetManagement';

interface AssetTabsProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
  devices?: DJIDevice[];
}

const AssetTabs = ({ activeTab, onTabChange, devices = [] }: AssetTabsProps) => {
  const droneCount = devices.filter((d) => d.domain === '0').length;
  const dockCount  = devices.filter((d) => d.domain === '1' || d.domain === '3').length;

  const tabs: { label: TabType; count: number }[] = [
    { label: 'All',    count: devices.length },
    { label: 'Drones', count: droneCount },
    { label: 'Docks',  count: dockCount },
  ];

  return (
    <div className='flex items-center gap-1 border-b border-zinc-800/50'>
      {tabs.map((tab) => {
        const isActive = activeTab === tab.label;
        return (
          <button
            key={tab.label}
            onClick={() => onTabChange(tab.label)}
            className={`relative px-4 py-2.5 text-xs font-semibold font-ui transition-colors ${
              isActive
                ? 'text-theme-accent'
                : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            {tab.label}
            <span className='ml-1.5 text-[10px] text-zinc-600'>({String(tab.count).padStart(2, '0')})</span>
            {isActive && (
              <span className='absolute bottom-0 left-0 w-full h-[2px] bg-theme-accent' />
            )}
          </button>
        );
      })}
    </div>
  );
};

export default AssetTabs;
