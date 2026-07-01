'use client';

import React from 'react';
import { PlaneTakeoff, Box, Wifi } from 'lucide-react';
import type { DJIDevice } from '@/lib/types';

interface FleetOverviewKPIProps {
  devices: DJIDevice[];
  isLoading?: boolean;
}

const FleetOverviewKPI = ({ devices, isLoading = false }: FleetOverviewKPIProps) => {
  if (isLoading) return null;

  const total = devices.length;
  const drones = devices.filter((d) => d.domain === '0').length;
  const docks  = devices.filter((d) => d.domain === '1').length;
  const online = devices.filter((d) => d.status).length;
  const offline = total - online;

  const stats = [
    {
      label: 'Devices',
      value: total,
      icon: <PlaneTakeoff size={16} className='text-theme-accent' />,
    },
    {
      label: 'Drones',
      value: drones,
      icon: <PlaneTakeoff size={16} className='text-blue-300' />,
    },
    {
      label: 'Docks',
      value: docks,
      icon: <Box size={16} className='text-cyan-400' />,
    },
    {
      label: 'Online',
      value: online,
      icon: <Wifi size={16} className='text-emerald-400' />,
      colorClass: 'text-emerald-400',
    },
    {
      label: 'Offline',
      value: offline,
      icon: <Wifi size={16} className='text-zinc-500' />,
      colorClass: 'text-zinc-500',
    },
  ];

  return (
    <div className='relative flex items-center w-full h-16 bg-card border border-border rounded-lg overflow-hidden'>
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
};

export default FleetOverviewKPI;
