'use client';

import React from 'react';
import { Battery, ArrowUp, Wind, Compass, Wifi, Target, Clock, Navigation } from 'lucide-react';
import type { ProcessedDroneData } from '@/hooks/useTelemetry';

export interface FlightStatsBarProps {
  droneData?: ProcessedDroneData | null;
  elapsedTime?: string;
}

const COMPASS = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'] as const;
function degToCompass(deg: number): string {
  return COMPASS[Math.round((((deg % 360) + 360) % 360) / 45) % 8];
}

const FlightStatsBar = ({ droneData, elapsedTime }: FlightStatsBarProps) => {
  const battery = droneData?.battery ?? 0;
  const altitude = droneData?.altitude;
  const speedMs = droneData?.speed;
  const heading = droneData?.heading;
  const direction = droneData?.direction;
  const online = droneData?.online;
  const gpsNumber = droneData?.gpsNumber ?? 0;
  const isGPSFixed = droneData?.isGPSFixed;
  const windSpeedMs = droneData?.windSpeed;
  const windDir = droneData?.windDirection;

  const batteryColor =
    battery < 20 ? 'text-red-400' : battery < 40 ? 'text-amber-400' : 'text-[#45F0CF]';

  const stats = [
    {
      label: 'Battery',
      value: droneData ? `${battery}%` : '—',
      icon: <Battery size={18} className={batteryColor} />,
      colorClass: batteryColor,
    },
    {
      label: 'Altitude',
      value: altitude != null ? `${altitude.toFixed(1)} m` : '—',
      icon: <ArrowUp size={18} className='text-[#AFC6FF]' />,
    },
    {
      label: 'Airspeed',
      value: speedMs != null ? `${(speedMs * 3.6).toFixed(1)} km/h` : '—',
      icon: <Wind size={18} className='text-[#AFC6FF]' />,
    },
    {
      label: 'Heading',
      value: heading != null ? `${heading.toFixed(0)}° ${direction ?? ''}`.trim() : '—',
      icon: <Compass size={18} className='text-[#AFC6FF]' />,
    },
    {
      label: 'Signal',
      value: droneData ? (online ? 'Online' : 'Offline') : '—',
      icon: <Wifi size={18} className={droneData && online ? 'text-[#45F0CF]' : 'text-zinc-500'} />,
      colorClass: droneData ? (online ? 'text-[#2CAC73]' : 'text-red-400') : '',
    },
    {
      label: 'GPS',
      value: droneData
        ? isGPSFixed
          ? 'RTK Fix'
          : gpsNumber > 0
            ? `${gpsNumber} Sats`
            : 'No Fix'
        : '—',
      icon: <Target size={18} className={isGPSFixed ? 'text-[#45F0CF]' : 'text-[#AFC6FF]'} />,
      colorClass: isGPSFixed ? 'text-[#45F0CF]' : gpsNumber > 0 ? 'text-amber-400' : '',
    },
    {
      label: 'Flight Time',
      value: elapsedTime ?? '—',
      icon: <Clock size={18} className='text-[#AFC6FF]' />,
    },
    {
      label: 'Wind',
      value:
        windSpeedMs != null && windSpeedMs > 0
          ? `${(windSpeedMs * 3.6).toFixed(1)} km/h ${windDir != null ? degToCompass(windDir) : ''}`.trim()
          : '—',
      icon: <Navigation size={18} className='text-[#AFC6FF]' />,
    },
  ];

  return (
    <div className='relative flex items-center w-full h-24 bg-[#12151C] border border-[#1E2330] rounded-lg overflow-hidden'>
      {/* Live status dot */}
      <div className='absolute top-3 left-4 flex items-center gap-2'>
        <div
          className={`w-2 h-2 rounded-full ${
            droneData?.online ? 'bg-[#2CAC73] shadow-[0px_0px_5px_0px_#45F0CF]' : 'bg-zinc-600'
          }`}
        />
        <span
          className={`text-[10px] font-semibold font-poppins uppercase tracking-tighter ${
            droneData?.online ? 'text-[#2CAC73]' : 'text-zinc-600'
          }`}
        >
          {droneData?.online ? 'Live' : droneData ? 'Offline' : 'No Drone'}
        </span>
      </div>

      <div className='flex w-full h-12'>
        {stats.map((stat, index) => (
          <div
            key={stat.label}
            className={`flex flex-col items-center justify-center flex-1 gap-1 ${
              index !== stats.length - 1 ? 'border-r border-zinc-800/40' : ''
            }`}
          >
            <div className='mb-1'>{stat.icon}</div>
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
};

export default FlightStatsBar;
