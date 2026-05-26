'use client';

import React from 'react';
import {
  Battery,
  ArrowUp,
  Wind,
  Compass,
  Wifi,
  Target,
  Clock,
  MapPin,
} from 'lucide-react';

interface StatItem {
  id: string;
  label: string;
  value: string;
  icon: React.ReactNode;
  colorClass?: string;
}

const flightStats: StatItem[] = [
  {
    id: '1',
    label: 'Battery',
    value: '87%',
    icon: <Battery size={18} className='text-[#45F0CF]' />,
  },
  {
    id: '2',
    label: 'Altitude',
    value: '120 m',
    icon: <ArrowUp size={18} className='text-[#AFC6FF]' />,
  },
  {
    id: '3',
    label: 'Airspeed',
    value: '34 km/h',
    icon: <Wind size={18} className='text-[#AFC6FF]' />,
  },
  {
    id: '4',
    label: 'Heading',
    value: '247°',
    icon: <Compass size={18} className='text-[#AFC6FF]' />,
  },
  {
    id: '5',
    label: 'Signal',
    value: 'Strong',
    icon: <Wifi size={18} className='text-[#45F0CF]' />,
    colorClass: 'text-[#2CAC73]',
  },
  {
    id: '6',
    label: 'GPS',
    value: '±1.2 m',
    icon: <Target size={18} className='text-[#45F0CF]' />,
  },
  {
    id: '7',
    label: 'Flight Time',
    value: '00:42:17',
    icon: <Clock size={18} className='text-[#AFC6FF]' />,
  },
  {
    id: '8',
    label: 'To Base',
    value: '380 m',
    icon: <MapPin size={18} className='text-[#AFC6FF]' />,
  },
];

const FlightStatsBar = () => {
  return (
    <div className='relative flex items-center w-full h-24 bg-[#12151C] border border-[#1E2330] rounded-lg overflow-hidden'>
      {/* Live Status Indicator */}
      <div className='absolute top-3 left-4 flex items-center gap-2'>
        <div className='w-2 h-2 rounded-full bg-[#2CAC73] shadow-[0px_0px_5px_0px_#45F0CF]' />
        <span className='text-[10px] font-semibold font-poppins text-[#2CAC73] uppercase tracking-tighter'>
          Live
        </span>
      </div>

      <div className='flex w-full h-12'>
        {flightStats.map((stat, index) => (
          <div
            key={stat.id}
            className={`flex flex-col items-center justify-center flex-1 gap-1
              ${index !== flightStats.length - 1 ? 'border-r border-zinc-800/40' : ''}`}
          >
            <div className='mb-1'>{stat.icon}</div>
            <span
              className={`text-sm font-semibold font-poppins leading-none text-white ${stat.colorClass || ''}`}
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
};

export default FlightStatsBar;
