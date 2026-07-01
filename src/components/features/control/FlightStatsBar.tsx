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
  const online = droneData?.online;
  const gpsNumber = droneData?.gpsNumber ?? 0;
  const isGPSFixed = droneData?.isGPSFixed;

  // modeCode 0 = docked/standby. Flight-only metrics (altitude, speed, heading,
  // wind) are meaningless when the drone is sitting in the dock — the GPS height
  // reflects the installation elevation, not flight altitude. Show — instead.
  const isAirborne = droneData ? droneData.modeCode !== 0 : false;

  const altitude    = isAirborne ? droneData?.altitude      : undefined;
  const speedMs     = isAirborne ? droneData?.speed         : undefined;
  const heading     = isAirborne ? droneData?.heading       : undefined;
  const direction   = isAirborne ? droneData?.direction     : undefined;
  const windSpeedMs = isAirborne ? droneData?.windSpeed     : undefined;
  const windDir     = isAirborne ? droneData?.windDirection : undefined;

  const batteryColor =
    battery < 20 ? 'text-red-400' : battery < 40 ? 'text-amber-400' : 'text-theme-accent';

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
      icon: <ArrowUp size={18} className='text-theme-accent' />,
    },
    {
      label: 'Airspeed',
      value: speedMs != null ? `${(speedMs * 3.6).toFixed(1)} km/h` : '—',
      icon: <Wind size={18} className='text-theme-accent' />,
    },
    {
      label: 'Heading',
      value: heading != null ? `${heading.toFixed(0)}° ${direction ?? ''}`.trim() : '—',
      icon: <Compass size={18} className='text-theme-accent' />,
    },
    {
      label: 'Signal',
      value: droneData ? (online ? 'Online' : 'Offline') : '—',
      icon: <Wifi size={18} className={droneData && online ? 'text-theme-accent' : 'text-muted-foreground'} />,
      colorClass: droneData ? (online ? 'text-theme-accent' : 'text-red-400') : '',
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
      icon: <Target size={18} className={isGPSFixed ? 'text-theme-accent' : 'text-theme-accent'} />,
      colorClass: isGPSFixed ? 'text-theme-accent' : gpsNumber > 0 ? 'text-amber-400' : '',
    },
    {
      label: 'Flight Time',
      value: elapsedTime ?? '—',
      icon: <Clock size={18} className='text-theme-accent' />,
    },
    {
      label: 'Wind',
      value:
        windSpeedMs != null && windSpeedMs > 0
          ? `${(windSpeedMs * 3.6).toFixed(1)} km/h ${windDir != null ? degToCompass(windDir) : ''}`.trim()
          : '—',
      icon: <Navigation size={18} className='text-theme-accent' />,
    },
  ];

  return (
    <div className='relative flex items-center w-full h-24 bg-card border border-border rounded-lg overflow-hidden'>
      {/* Live status dot */}
      <div className='absolute top-3 left-4 flex items-center gap-2'>
        <div
          className={`w-2 h-2 rounded-full ${
            droneData?.online ? 'bg-theme-accent shadow-[0px_0px_5px_0px_var(--theme-accent)]' : 'bg-muted'
          }`}
        />
        <span
          className={`text-[10px] font-semibold font-ui uppercase tracking-tighter ${
            droneData?.online ? 'text-theme-accent' : 'text-muted-foreground'
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
              index !== stats.length - 1 ? 'border-r border-border/40' : ''
            }`}
          >
            <div className='mb-1'>{stat.icon}</div>
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

export default FlightStatsBar;
