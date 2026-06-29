'use client';

import React, { useState } from 'react';
import { Search, ListFilter, Upload } from 'lucide-react';
import { WaylineTabType } from './WeylineTable';

interface WeylineTabsProps {
  activeTab: WaylineTabType;
  onTabChange: (tab: WaylineTabType) => void;
  onSearch?: (query: string) => void;
}

const tabs: WaylineTabType[] = ['All', 'Favorited'];

const WeylineTabs = ({ activeTab, onTabChange, onSearch }: WeylineTabsProps) => {
  const [query, setQuery] = useState('');

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
    onSearch?.(e.target.value);
  };

  return (
    <div className='flex items-center justify-between w-[calc(100%-2rem)] mx-4 h-[52px] px-3 bg-card border border-border/50 rounded-xl font-poppins'>
      <div className='flex items-center gap-1'>
        {tabs.map((tab) => {
          const isActive = activeTab === tab;
          return (
            <button
              key={tab}
              onClick={() => onTabChange(tab)}
              className={`px-4 py-1.5 text-[11px] font-bold uppercase tracking-widest rounded transition-all duration-150 outline-none focus:outline-none focus:ring-0 select-none
                ${isActive
                  ? 'bg-theme-accent text-white'
                  : 'text-muted-foreground hover:text-foreground hover:bg-white/5'
                }`}
            >
              {tab}
            </button>
          );
        })}
      </div>

      <div className='flex items-center gap-2'>
        <div className='flex items-center gap-2 px-3 py-1.5 bg-secondary border border-border rounded-lg w-[220px]'>
          <Search size={13} className='text-muted-foreground flex-shrink-0' />
          <input
            type='text'
            value={query}
            onChange={handleSearch}
            placeholder='Search routes...'
            className='bg-transparent text-[12px] text-muted-foreground placeholder:text-muted-foreground outline-none w-full'
          />
        </div>
        <button className='p-2 bg-secondary border border-border rounded-lg text-muted-foreground hover:text-foreground hover:border-border transition-colors'>
          <ListFilter size={14} />
        </button>
        <button className='flex items-center gap-1.5 px-3 py-1.5 bg-theme-accent text-white text-[11px] font-bold rounded-lg hover:bg-theme-accent/80 transition-colors'>
          <Upload size={13} /> Upload
        </button>
      </div>
    </div>
  );
};

export default WeylineTabs;
