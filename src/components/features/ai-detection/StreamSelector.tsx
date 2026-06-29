'use client';

import { memo } from 'react';
import { ChevronDown, RefreshCw, Wifi } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import type { StreamEntry } from '@/hooks/useStreamKeys';

interface StreamSelectorProps {
  selectedIds: Set<string>;
  onSelectionChange: (ids: Set<string>) => void;
  streams: StreamEntry[];
  maxSelections?: number;
  onRefresh?: () => void;
  isRefreshing?: boolean;
}

export const StreamSelector = memo(function StreamSelector({
  selectedIds,
  onSelectionChange,
  streams,
  maxSelections = 4,
  onRefresh,
  isRefreshing = false,
}: StreamSelectorProps) {
  const atLimit = selectedIds.size >= maxSelections;

  const toggleStream = (streamKey: string) => {
    const next = new Set(selectedIds);
    if (next.has(streamKey)) {
      next.delete(streamKey);
    } else if (next.size < maxSelections) {
      next.add(streamKey);
    }
    onSelectionChange(next);
  };

  const selectAll = () => {
    const all = new Set(streams.slice(0, maxSelections).map((s) => s.streamKey));
    onSelectionChange(all);
  };

  const clearAll = () => {
    onSelectionChange(new Set());
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className={`flex items-center gap-1.5 px-2 py-1 rounded-md text-[10px] font-poppins font-semibold transition-colors ${
            selectedIds.size > 0
              ? 'bg-[#1C93FF]/15 text-[#1C93FF] border border-[#1C93FF]/30'
              : 'text-zinc-500 hover:text-zinc-300 border border-transparent'
          }`}
        >
          <Wifi size={11} />
          <span className='hidden sm:inline'>Select Streams</span>
          {selectedIds.size > 0 && (
            <span className='ml-0.5 px-1 py-0.5 rounded-full bg-[#1C93FF]/20 text-[#1C93FF] text-[9px] leading-none'>
              {selectedIds.size}
            </span>
          )}
          <ChevronDown size={10} className='opacity-60' />
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align='end' className='w-64 bg-[#12151C] border-zinc-800'>
        <DropdownMenuLabel className='text-zinc-500 text-[10px] uppercase tracking-wider'>
          {selectedIds.size}/{maxSelections} streams selected
        </DropdownMenuLabel>

        <div className='flex items-center gap-1 px-2 pb-1'>
          <button
            onClick={selectAll}
            className='px-2 py-0.5 rounded text-[10px] font-semibold text-[#1C93FF] hover:bg-[#1C93FF]/10 transition-colors'
          >
            Select All
          </button>
          <button
            onClick={clearAll}
            className='px-2 py-0.5 rounded text-[10px] font-semibold text-zinc-500 hover:bg-zinc-800 transition-colors'
          >
            Clear All
          </button>
        </div>

        <DropdownMenuSeparator className='bg-zinc-800' />

        {streams.length === 0 ? (
          <div className='px-3 py-4 text-center text-[10px] text-zinc-600'>
            No streams available
          </div>
        ) : (
          streams.map((stream) => {
            const isSelected = selectedIds.has(stream.streamKey);
            const isDisabled = !isSelected && atLimit;

            return (
              <DropdownMenuCheckboxItem
                key={stream.streamKey}
                checked={isSelected}
                onCheckedChange={() => toggleStream(stream.streamKey)}
                disabled={isDisabled}
                className='text-zinc-300 focus:bg-zinc-800 focus:text-zinc-300 cursor-pointer'
              >
                <div className='flex items-center gap-2 flex-1 min-w-0'>
                  <span className='flex-1 truncate text-[11px] font-mono'>
                    {stream.deviceSn}
                  </span>
                  <span className='text-[9px] text-zinc-600 truncate max-w-[120px]' title={stream.streamKey}>
                    {stream.streamKey}
                  </span>
                </div>
              </DropdownMenuCheckboxItem>
            );
          })
        )}

        {onRefresh && (
          <>
            <DropdownMenuSeparator className='bg-zinc-800' />
            <div className='px-2 py-1'>
              <button
                onClick={onRefresh}
                disabled={isRefreshing}
                className='flex items-center gap-1.5 w-full px-2 py-1 rounded text-[10px] font-semibold text-zinc-400 hover:bg-zinc-800 transition-colors disabled:opacity-50'
              >
                <RefreshCw className={`w-3 h-3 ${isRefreshing ? 'animate-spin' : ''}`} />
                Refresh Streams
              </button>
            </div>
          </>
        )}

        {atLimit && (
          <>
            <DropdownMenuSeparator className='bg-zinc-800' />
            <div className='px-3 py-1.5 text-[10px] text-amber-400/80'>
              Maximum {maxSelections} streams reached
            </div>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
});
