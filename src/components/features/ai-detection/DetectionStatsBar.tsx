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
      icon: <Brain size={16} className='text-[#AFC6FF]' />,
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
      icon: <ShieldCheck size={16} className='text-[#45F0CF]' />,
      colorClass: 'text-[#45F0CF]',
    },
    {
      label: 'High Conf.',
      value: highConfidence,
      icon: <Target size={16} className='text-[#AFC6FF]' />,
    },
    {
      label: 'Today',
      value: today,
      icon: <TrendingUp size={16} className='text-[#AFC6FF]' />,
    },
  ];

  return (
    <div className='relative flex items-center w-full h-16 bg-[#12151C] border border-[#1E2330] rounded-lg overflow-hidden'>
      {/* Live status dot */}
      <div className='absolute top-2 left-3 flex items-center gap-1.5'>
        <div
          className={`w-1.5 h-1.5 rounded-full ${
            isConnected ? 'bg-[#2CAC73] shadow-[0px_0px_5px_0px_#45F0CF]' : 'bg-zinc-600'
          }`}
        />
        <span
          className={`text-[10px] font-semibold font-poppins uppercase tracking-tighter ${
            isConnected ? 'text-[#2CAC73]' : 'text-zinc-600'
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
  );
}
