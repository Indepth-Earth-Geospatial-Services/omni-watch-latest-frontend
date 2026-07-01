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
    <div className='flex flex-col sm:flex-row items-stretch sm:items-center justify-between w-[calc(100%-2rem)] mx-4 py-4 bg-transparent font-poppins gap-3'>
      {/* Search */}
      <div className='relative w-full sm:max-w-sm'>
        <div className='absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none'>
          <Search className='w-4 h-4 text-muted-foreground' />
        </div>
        <input
          type='text'
          value={searchQuery}
          onChange={handleSearch}
          placeholder={searchPlaceholder}
          className='block w-full py-2.5 pl-10 pr-3 text-sm text-foreground bg-secondary border border-border rounded-md focus:outline-none focus:ring-1 focus:ring-[#adafaf] focus:border-transparent placeholder-[#CFC2D680]/50 transition-all'
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
        className='inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-blue-600 rounded-md hover:bg-blue-500 active:scale-95 transition-all shadow-sm w-full sm:w-auto flex-shrink-0'
      >
        <ActionIcon className='w-4 h-4' />
        {actionLabel}
      </button>
    </div>
  );
};

export default PageHeader;
