'use client';

import React, { useRef, useState } from 'react';
import { Search, LucideIcon } from 'lucide-react';

interface PageHeaderProps {
  searchPlaceholder?: string;
  onSearch?: (query: string) => void;
  actionLabel: string;
  actionIcon: LucideIcon;
  onAction?: () => void;
  actionAccept?: string;
  isFileUpload?: boolean;
}

const PageHeader = ({
  searchPlaceholder = 'Search...',
  onSearch,
  actionLabel,
  actionIcon: ActionIcon,
  onAction,
  actionAccept = '*',
  isFileUpload = false,
}: PageHeaderProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    onSearch?.(e.target.value);
  };

  const handleClick = () => {
    if (isFileUpload) {
      fileInputRef.current?.click();
    } else {
      onAction?.();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) onAction?.();
    e.target.value = '';
  };

  return (
    <div className='flex items-center justify-between w-full px-4 py-4 bg-transparent font-poppins'>
      {/* Search */}
      <div className='relative w-full max-w-sm'>
        <div className='absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none'>
          <Search className='w-4 h-4 text-zinc-500' />
        </div>
        <input
          type='text'
          value={searchQuery}
          onChange={handleSearch}
          placeholder={searchPlaceholder}
          className='block w-full py-2.5 pl-10 pr-3 text-sm text-zinc-200 bg-[#32353C] border border-[#6B7280] rounded-md focus:outline-none focus:ring-1 focus:ring-[#adafaf] focus:border-transparent placeholder-[#CFC2D680]/50 transition-all'
        />
      </div>

      {/* Hidden file input */}
      {isFileUpload && (
        <input
          ref={fileInputRef}
          type='file'
          accept={actionAccept}
          className='hidden'
          onChange={handleFileChange}
        />
      )}

      {/* Action button */}
      <button
        type='button'
        onClick={handleClick}
        className='inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-blue-600 rounded-md hover:bg-blue-500 active:scale-95 transition-all shadow-sm'
      >
        <ActionIcon className='w-4 h-4' />
        {actionLabel}
      </button>
    </div>
  );
};

export default PageHeader;
