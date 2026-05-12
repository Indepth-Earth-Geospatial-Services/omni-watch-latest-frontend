'use client';

import React, { useState } from 'react';
import { Search, ListFilter } from 'lucide-react';

export type ProjectTabType = 'All' | 'Active' | 'Offline' | 'Archived';

interface ProjectTabsProps {
  activeTab: ProjectTabType;
  onTabChange: (tab: ProjectTabType) => void;
  onSearch?: (query: string) => void;
}

const tabs: ProjectTabType[] = ['All', 'Active', 'Offline', 'Archived'];

const ProjectTabs = ({ activeTab, onTabChange, onSearch }: ProjectTabsProps) => {
  const [query, setQuery] = useState('');

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
    onSearch?.(e.target.value);
  };

  return (
    <div className='flex items-center justify-between w-[calc(100%-2rem)] mx-4 h-[52px] px-3 bg-[#1A1C20] border border-[#424754] rounded-sm font-poppins'>
      {/* Left: Tab buttons */}
      <div className='flex items-center gap-1'>
        {tabs.map((tab) => {
          const isActive = activeTab === tab;
          return (
            <button
              key={tab}
              onClick={() => onTabChange(tab)}
              className={`px-4 py-1.5 text-[11px] font-bold uppercase tracking-widest rounded transition-all duration-150 outline-none focus:outline-none focus:ring-0 select-none
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
      <div className='flex items-center gap-2'>
        <div className='flex items-center gap-2 px-3 py-1.5 bg-zinc-900 border border-zinc-800 rounded-lg w-[220px]'>
          <Search size={13} className='text-zinc-500 flex-shrink-0' />
          <input
            type='text'
            value={query}
            onChange={handleSearch}
            placeholder='Search project...'
            className='bg-transparent text-[12px] text-zinc-300 placeholder:text-zinc-600 outline-none w-full'
          />
        </div>
        <button className='p-2 bg-zinc-900 border border-zinc-800 rounded-lg text-zinc-400 hover:text-zinc-100 hover:border-zinc-700 transition-colors'>
          <ListFilter size={14} />
        </button>
      </div>
    </div>
  );
};

export default ProjectTabs;
