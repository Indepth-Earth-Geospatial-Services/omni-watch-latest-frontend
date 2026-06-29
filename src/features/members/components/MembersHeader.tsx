'use client';

import { Search, UserPlus } from 'lucide-react';

interface MembersHeaderProps {
  onSearch?: (query: string) => void;
  onInviteClick: () => void;
}

export default function MembersHeader({ onSearch, onInviteClick }: MembersHeaderProps) {
  return (
    <div className='flex flex-col sm:flex-row items-stretch sm:items-center justify-between w-[calc(100%-2rem)] mx-4 py-4 bg-transparent gap-3'>
      <div className='relative w-full sm:max-w-sm'>
        <div className='absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none'>
          <Search className='w-4 h-4 text-zinc-500' />
        </div>
        <input
          type='text'
          onChange={(e) => onSearch?.(e.target.value)}
          placeholder='Search members...'
          className='block w-full py-2.5 pl-10 pr-3 text-sm text-zinc-200 bg-[#32353C] border border-[#6B7280] rounded-md focus:outline-none focus:ring-1 focus:ring-[#adafaf] focus:border-transparent placeholder:text-[#CFC2D680]/50 transition-all'
        />
      </div>

      <button
        type='button'
        onClick={onInviteClick}
        className='inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-blue-600 rounded-md hover:bg-blue-500 active:scale-95 transition-all shadow-sm w-full sm:w-auto flex-shrink-0'
      >
        <UserPlus className='w-4 h-4' />
        Add Member
      </button>
    </div>
  );
}
