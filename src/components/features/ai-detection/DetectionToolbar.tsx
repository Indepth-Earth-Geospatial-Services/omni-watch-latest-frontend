'use client';

import { memo } from 'react';
import { Brain, Map, Search, Volume2, VolumeX } from 'lucide-react';

interface DetectionToolbarProps {
  connectionStatus: string;
  statusFilter: string;
  onStatusChange: (value: string) => void;
  typeFilter: string;
  onTypeChange: (value: string) => void;
  searchTerm: string;
  onSearchChange: (value: string) => void;
  timeRange: string;
  onTimeRangeChange: (value: string) => void;
  showMap: boolean;
  onToggleMap: () => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
}

const selectCls =
  'bg-zinc-900 border border-zinc-800 rounded-md px-2 py-1 text-xs font-ui text-zinc-400 focus:outline-none focus:border-zinc-600 cursor-pointer';

export const DetectionToolbar = memo(function DetectionToolbar({
  connectionStatus,
  statusFilter,
  onStatusChange,
  typeFilter,
  onTypeChange,
  searchTerm,
  onSearchChange,
  timeRange,
  onTimeRangeChange,
  showMap,
  onToggleMap,
  soundEnabled,
  onToggleSound,
}: DetectionToolbarProps) {
  const isConnected = connectionStatus === 'connected';
  const isReconnecting = connectionStatus === 'reconnecting';
  const isConnecting = connectionStatus === 'connecting';
  const isError = connectionStatus === 'error';

  return (
    <div className='flex items-center justify-between px-3 py-2 bg-card border border-border rounded-lg flex-shrink-0 gap-3'>
      {/* Left: Title + Status */}
      <div className='flex items-center gap-2.5'>
        <Brain size={14} className='text-blue-300' />
        <span className='text-xs font-bold font-ui text-foreground hidden sm:inline'>
          AI Detection
        </span>
        <div className='flex items-center gap-1.5'>
          <div
            className={`w-1.5 h-1.5 rounded-full ${
              isConnected
                ? 'bg-green-500 shadow-[0px_0px_4px_0px_hsl(var(--theme-accent))]'
                : isReconnecting || isConnecting
                  ? 'bg-amber-400 animate-pulse'
                  : isError
                    ? 'bg-red-500'
                    : 'bg-zinc-600'
            }`}
          />
          <span className='text-[10px] font-semibold font-ui uppercase tracking-tighter text-zinc-500'>
            {isConnected
              ? 'Live'
              : isReconnecting
                ? 'Reconnecting'
                : isConnecting
                  ? 'Connecting'
                  : isError
                    ? 'Error'
                    : 'Disconnected'}
          </span>
        </div>
      </div>

      {/* Center: Search + Filters */}
      <div className='flex items-center gap-2'>
        {/* Search Input */}
        <div className='relative'>
          <Search size={11} className='absolute left-2 top-1/2 -translate-y-1/2 text-zinc-500' />
          <input
            type='text'
            placeholder='Search class...'
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className='bg-zinc-900 border border-zinc-800 rounded-md pl-7 pr-2 py-1 text-xs font-ui text-zinc-400 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-600 w-32'
          />
        </div>

        <select
          className={selectCls}
          value={statusFilter}
          onChange={(e) => onStatusChange(e.target.value)}
        >
          <option value='all'>All Status</option>
          <option value='pending'>YOLO Alerts</option>
          <option value='verified'>Verified</option>
        </select>

        <select
          className={selectCls}
          value={typeFilter}
          onChange={(e) => onTypeChange(e.target.value)}
        >
          <option value='all'>All Types</option>
          <option value='person'>Person</option>
          <option value='vehicle'>Vehicle</option>
          <option value='boat'>Boat</option>
          <option value='weapon'>Weapon</option>
          <option value='suspicious'>Suspicious</option>
          <option value='drone'>Drone</option>
          <option value='animal'>Animal</option>
        </select>

        <select
          className={selectCls}
          value={timeRange}
          onChange={(e) => onTimeRangeChange(e.target.value)}
        >
          <option value='all'>All Time</option>
          <option value='today'>Today</option>
          <option value='1h'>Last Hour</option>
          <option value='24h'>Last 24h</option>
        </select>
      </div>

      {/* Right: Map + Sound toggles */}
      <div className='flex items-center gap-1.5'>
        <button
          onClick={onToggleMap}
          className={`flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-ui font-semibold transition-colors ${
            showMap
              ? 'bg-primary/15 text-primary border border-primary/30'
              : 'text-zinc-500 hover:text-zinc-300 border border-transparent'
          }`}
        >
          <Map size={11} />
          <span className='hidden sm:inline'>Map</span>
        </button>

        <button
          onClick={onToggleSound}
          className={`flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-ui font-semibold transition-colors ${
            soundEnabled
              ? 'bg-theme-accent/10 text-theme-accent border border-theme-accent/20'
              : 'text-zinc-500 hover:text-zinc-300 border border-transparent'
          }`}
          title={soundEnabled ? 'Mute alerts' : 'Enable alert sounds'}
        >
          {soundEnabled ? <Volume2 size={11} /> : <VolumeX size={11} />}
        </button>
      </div>
    </div>
  );
});
