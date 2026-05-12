'use client';

import React from 'react';
import { TabType } from './AssetManagement';

interface AssetTabsProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
}

const AssetTabs = ({ activeTab, onTabChange }: AssetTabsProps) => {
  const tabs: { label: TabType; count: string }[] = [
    { label: 'All', count: '22' },
    { label: 'Drones', count: '08' },
    { label: 'Docks', count: '14' },
  ];

  return (
    <div className='flex items-center justify-center ml-2 font-poppins'>
      <div className='flex bg-[#1A1C20] rounded-lg w-[300px] border border-zinc-800/30 p-3 gap-3'>
        {tabs.map((tab) => {
          const isActive = activeTab === tab.label;
          return (
            <button
              key={tab.label}
              onClick={() => onTabChange(tab.label)}
              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-md transition-all duration-200 outline-none select-none focus:outline-none focus:ring-0
                ${
                  isActive
                    ? 'bg-[#333539] border border-[#1C93FF4D] text-white shadow-sm ring-1 ring-white/5'
                    : 'text-zinc-500 hover:text-zinc-300 hover:bg-white/5'
                }`}
            >
              <span className='text-[10px] font-bold uppercase tracking-widest'>{tab.label}</span>
              <span
                className={`text-[9px] font-mono px-1 rounded-sm border leading-none py-0.5
                ${
                  isActive
                    ? 'border-[#1C93FF4D] text-[#1C93FF] bg-[#1C93FF]/10'
                    : 'border-zinc-700 text-zinc-600'
                }`}
              >
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default AssetTabs;
