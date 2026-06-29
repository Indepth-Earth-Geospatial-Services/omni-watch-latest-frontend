'use client';

import { memo } from 'react';
import { Bell, Search, Volume2, VolumeX, AlertTriangle, ShieldCheck, Target, TrendingUp } from 'lucide-react';
import type { ThreatSocketStatus } from '@/lib/types/threats';

interface AlertsHeaderProps {
  connectionStatus: ThreatSocketStatus;
  statusFilter: string;
  onStatusChange: (value: string) => void;
  typeFilter: string;
  onTypeChange: (value: string) => void;
  searchTerm: string;
  onSearchChange: (value: string) => void;
  timeRange: string;
  onTimeRangeChange: (value: string) => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
  stats: {
    total: number;
    pending: number;
    verified: number;
    highConfidence: number;
    today: number;
  };
}

const selectCls =
  'bg-zinc-900 border border-zinc-800 rounded-md px-2 py-1 text-xs font-poppins text-zinc-400 focus:outline-none focus:border-zinc-600 cursor-pointer';

export const AlertsHeader = memo(function AlertsHeader({
  connectionStatus,
  statusFilter,
  onStatusChange,
  typeFilter,
  onTypeChange,
  searchTerm,
  onSearchChange,
  timeRange,
  onTimeRangeChange,
  soundEnabled,
  onToggleSound,
  stats,
}: AlertsHeaderProps) {
  const isConnected = connectionStatus === 'connected';
  const isReconnecting = connectionStatus === 'reconnecting';
  const isConnecting = connectionStatus === 'connecting';
  const isError = connectionStatus === 'error';

  const statusDotClass = isConnected
    ? 'bg-[#2CAC73] shadow-[0px_0px_5px_0px_#45F0CF]'
    : isReconnecting || isConnecting
      ? 'bg-amber-400 animate-pulse'
      : isError
        ? 'bg-red-500'
        : 'bg-zinc-600';

  const statusLabel = isConnected
    ? 'Live'
    : isReconnecting
      ? 'Reconnecting'
      : isConnecting
        ? 'Connecting'
        : isError
          ? 'Error'
          : 'Disconnected';

  const statusTextColor = isConnected
    ? 'text-[#2CAC73]'
    : isReconnecting || isConnecting
      ? 'text-amber-400'
      : isError
        ? 'text-red-400'
        : 'text-zinc-600';

  const statItems = [
    {
      label: 'Total',
      value: stats.total,
      icon: <Bell size={14} className='text-[#AFC6FF]' />,
    },
    {
      label: 'Pending',
      value: stats.pending,
      icon: <AlertTriangle size={14} className='text-orange-400' />,
      colorClass: 'text-orange-400',
    },
    {
      label: 'Verified',
      value: stats.verified,
      icon: <ShieldCheck size={14} className='text-[#45F0CF]' />,
      colorClass: 'text-[#45F0CF]',
    },
    {
      label: 'High Conf.',
      value: stats.highConfidence,
      icon: <Target size={14} className='text-[#AFC6FF]' />,
    },
    {
      label: 'Today',
      value: stats.today,
      icon: <TrendingUp size={14} className='text-[#AFC6FF]' />,
    },
  ];

  return (
    <div className='flex flex-col gap-3 flex-shrink-0'>
      {/* Stats Bar */}
      <div className='relative flex items-center w-full h-16 bg-[#12151C] border border-[#1E2330] rounded-lg overflow-hidden'>
        <div className='absolute top-2 left-3 flex items-center gap-1.5'>
          <div className={`w-1.5 h-1.5 rounded-full ${statusDotClass}`} />
          <span className={`text-[10px] font-semibold font-poppins uppercase tracking-tighter ${statusTextColor}`}>
            {statusLabel}
          </span>
        </div>

        <div className='flex w-full h-full'>
          {statItems.map((stat, index) => (
            <div
              key={stat.label}
              className={`flex flex-col items-center justify-center flex-1 gap-0.5 ${
                index !== statItems.length - 1 ? 'border-r border-zinc-800/40' : ''
              }`}
            >
              <div className='mb-0.5'>{stat.icon}</div>
              <span
                className={`text-sm font-semibold font-poppins leading-none text-white ${stat.colorClass ?? ''}`}
              >
                {stat.value}
              </span>
              <span className='text-[10px] font-normal font-poppins text-[#8C90A0] uppercase tracking-wide'>
                {stat.label}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Toolbar */}
      <div className='flex items-center justify-between px-3 py-2 bg-[#12151C] border border-[#1E2330] rounded-lg gap-3'>
        {/* Left: Title + Status */}
        <div className='flex items-center gap-2.5'>
          <Bell size={14} className='text-[#AFC6FF]' />
          <span className='text-xs font-bold font-poppins text-[#E2E2E8] hidden sm:inline'>
            Alerts
          </span>
          <div className='flex items-center gap-1.5'>
            <div className={`w-1.5 h-1.5 rounded-full ${statusDotClass}`} />
            <span className='text-[10px] font-semibold font-poppins uppercase tracking-tighter text-zinc-500'>
              {statusLabel}
            </span>
          </div>
        </div>

        {/* Center: Search + Filters */}
        <div className='flex items-center gap-2'>
          <div className='relative'>
            <Search size={11} className='absolute left-2 top-1/2 -translate-y-1/2 text-zinc-500' />
            <input
              type='text'
              placeholder='Search class...'
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              className='bg-zinc-900 border border-zinc-800 rounded-md pl-7 pr-2 py-1 text-xs font-poppins text-zinc-400 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-600 w-32'
            />
          </div>

          <select
            className={selectCls}
            value={statusFilter}
            onChange={(e) => onStatusChange(e.target.value)}
          >
            <option value='all'>All Status</option>
            <option value='pending'>Pending</option>
            <option value='verified'>Verified</option>
            <option value='approved'>Approved</option>
            <option value='dismissed'>Dismissed</option>
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

        {/* Right: Sound toggle */}
        <div className='flex items-center gap-1.5'>
          <button
            onClick={onToggleSound}
            className={`flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-poppins font-semibold transition-colors ${
              soundEnabled
                ? 'bg-[#45F0CF]/10 text-[#45F0CF] border border-[#45F0CF]/20'
                : 'text-zinc-500 hover:text-zinc-300 border border-transparent'
            }`}
            title={soundEnabled ? 'Mute alerts' : 'Enable alert sounds'}
          >
            {soundEnabled ? <Volume2 size={11} /> : <VolumeX size={11} />}
          </button>
        </div>
      </div>
    </div>
  );
});
