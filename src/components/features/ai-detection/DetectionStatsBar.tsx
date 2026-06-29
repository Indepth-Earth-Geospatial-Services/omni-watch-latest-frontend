'use client';

import { Brain, AlertTriangle, ShieldCheck, Target, TrendingUp } from 'lucide-react';

interface DetectionStatsBarProps {
  total: number;
  yoloAlerts: number;
  verified: number;
  highConfidence: number;
  today: number;
  isConnected?: boolean;
}

export function DetectionStatsBar({
  total,
  yoloAlerts,
  verified,
  highConfidence,
  today,
  isConnected = false,
}: DetectionStatsBarProps) {
  const stats = [
    {
      label: 'Total',
      value: total,
      icon: <Brain size={16} className='text-blue-300' />,
    },
    {
      label: 'YOLO Alerts',
      value: yoloAlerts,
      icon: <AlertTriangle size={16} className='text-orange-400' />,
      colorClass: 'text-orange-400',
    },
    {
      label: 'Verified',
      value: verified,
      icon: <ShieldCheck size={16} className='text-theme-accent' />,
      colorClass: 'text-theme-accent',
    },
    {
      label: 'High Conf.',
      value: highConfidence,
      icon: <Target size={16} className='text-blue-300' />,
    },
    {
      label: 'Today',
      value: today,
      icon: <TrendingUp size={16} className='text-blue-300' />,
    },
  ];

  return (
    <div className='relative flex items-center w-full h-16 bg-card border border-border rounded-lg overflow-hidden'>
      {/* Live status dot */}
      <div className='absolute top-2 left-3 flex items-center gap-1.5'>
        <div
          className={`w-1.5 h-1.5 rounded-full ${
            isConnected ? 'bg-green-500 shadow-[0px_0px_5px_0px_hsl(var(--theme-accent))]' : 'bg-zinc-600'
          }`}
        />
        <span
          className={`text-[10px] font-semibold font-ui uppercase tracking-tighter ${
            isConnected ? 'text-green-500' : 'text-muted-foreground'
          }`}
        >
          {isConnected ? 'Live' : 'Offline'}
        </span>
      </div>

      <div className='flex w-full h-full'>
        {stats.map((stat, index) => (
          <div
            key={stat.label}
            className={`flex flex-col items-center justify-center flex-1 gap-0.5 ${
              index !== stats.length - 1 ? 'border-r border-zinc-800/40' : ''
            }`}
          >
            <div className='mb-0.5'>{stat.icon}</div>
            <span
              className={`text-sm font-semibold font-ui leading-none text-white ${stat.colorClass ?? ''}`}
            >
              {stat.value}
            </span>
            <span className='text-[10px] font-normal font-ui text-muted-foreground uppercase tracking-wide'>
              {stat.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
