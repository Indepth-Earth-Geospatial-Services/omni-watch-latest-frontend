'use client';

import React, { useState } from 'react';
import { Search, ListFilter } from 'lucide-react';

export type ProjectTabType = 'All' | 'Active' | 'Offline' | 'Online';

interface ProjectTabsProps {
  activeTab: ProjectTabType;
  onTabChange: (tab: ProjectTabType) => void;
  onSearch?: (query: string) => void;
}

const tabs: ProjectTabType[] = ['All', 'Active', 'Online', 'Offline'];

const ProjectTabs = ({ activeTab, onTabChange, onSearch }: ProjectTabsProps) => {
  const [query, setQuery] = useState('');

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
    onSearch?.(e.target.value);
  };

  return (
    <div className='flex flex-col md:flex-row items-center justify-between w-[calc(100%-2rem)] mx-4 h-auto md:h-[52px] p-2 md:py-0 md:px-3 bg-[#1A1C20] border border-[#424754] rounded-sm font-poppins gap-2 md:gap-0'>
      {/* Left: Tab buttons */}
      <div className='flex items-center gap-1 w-full md:w-auto'>
        {tabs.map((tab) => {
          const isActive = activeTab === tab;
          return (
            <button
              key={tab}
              onClick={() => onTabChange(tab)}
              className={`flex-1 md:flex-initial px-2 md:px-4 py-1.5 text-[9px] sm:text-[11px] font-bold uppercase tracking-widest rounded transition-all duration-150 outline-none focus:outline-none focus:ring-0 select-none text-center
                ${
                  isActive
                    ? 'bg-[#1C93FF33] text-white border border-[#1C93FF4D]'
                    : 'text-zinc-400 hover:text-zinc-100 hover:bg-white/5'
                }`}
            >
              {tab}
            </button>
          );
        })}
      </div>

      {/* Right: Search + Filter */}
      <div className='flex items-center gap-2 w-full md:w-auto'>
        <div className='flex items-center gap-2 px-3 py-1.5 bg-zinc-900 border border-zinc-800 rounded-lg flex-1 md:w-[220px] md:flex-initial'>
          <Search size={13} className='text-zinc-500 flex-shrink-0' />
          <input
            type='text'
            value={query}
            onChange={handleSearch}
            placeholder='Search project...'
            className='bg-transparent text-[12px] text-zinc-300 placeholder:text-zinc-600 outline-none w-full'
          />
        </div>
        <button className='p-2 bg-zinc-900 border border-zinc-800 rounded-lg text-zinc-400 hover:text-zinc-100 hover:border-zinc-700 transition-colors flex-shrink-0'>
          <ListFilter size={14} />
        </button>
      </div>
    </div>
  );
};

export default ProjectTabs;
