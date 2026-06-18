'use client';
import { memo } from 'react';
import { Marker } from 'react-map-gl/maplibre';
import type { DronePositionType } from './map-types';

interface DroneMarkerProps {
  drone: DronePositionType;
  isSelected: boolean;
  showAltitude: boolean;
  onClick: (drone: DronePositionType) => void;
}

// Top-down aircraft SVG — nose points up (north = 0°), rotated by heading
function AircraftSVG({ color, size }: { color: string; size: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox='0 0 24 24'
      fill={color}
      xmlns='http://www.w3.org/2000/svg'
    >
      <path d='M12 2.5C11.2 2.5 10.5 3.2 10.5 4L10.5 9.5L3.5 13.5V15.5L10.5 13V19L8 20.5V22L12 21L16 22V20.5L13.5 19V13L20.5 15.5V13.5L13.5 9.5V4C13.5 3.2 12.8 2.5 12 2.5Z' />
    </svg>
  );
}

export const DroneMarker = memo(
  ({ drone, isSelected, showAltitude, onClick }: DroneMarkerProps) => {
    const handleClick = (e: { originalEvent?: { stopPropagation: () => void } }) => {
      e.originalEvent?.stopPropagation();
      onClick(drone);
    };

    const iconColor = isSelected ? '#60a5fa' : '#f87171';
    const iconSize = 36;

    return (
      <Marker
        longitude={drone.longitude}
        latitude={drone.latitude}
        anchor='center'
        onClick={handleClick}
      >
        <div className='group cursor-pointer flex flex-col items-center gap-0.5 select-none'>
          {/* Hover tooltip — name + live stats */}
          {!isSelected && (
            <div className='absolute bottom-full left-1/2 -translate-x-1/2 mb-7 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10'>
              <div className='bg-neutral-900/95 backdrop-blur-sm border border-gray-700/60 px-2.5 py-1.5 rounded-lg shadow-xl whitespace-nowrap'>
                <p className='text-[11px] font-semibold text-gray-100 leading-none'>
                  {drone.nickname}
                </p>
                <p className='text-[9px] text-gray-500 font-mono mt-0.5'>
                  {drone.altitude.toFixed(0)} m · hdg {drone.heading.toFixed(0)}°
                </p>
                <p className='text-[9px] text-gray-600 font-mono mt-0.5'>
                  {drone.latitude.toFixed(5)}, {drone.longitude.toFixed(5)}
                </p>
              </div>
              <div className='w-0 h-0 border-l-[4px] border-l-transparent border-r-[4px] border-r-transparent border-t-[4px] border-t-neutral-900/95 mx-auto' />
            </div>
          )}

          {/* Altitude label above marker */}
          {(showAltitude || isSelected) && (
            <div
              className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded shadow ${
                isSelected ? 'bg-blue-900/90 text-blue-300' : 'bg-black/75 text-white'
              } whitespace-nowrap leading-none`}
            >
              {drone.altitude.toFixed(0)} m
            </div>
          )}

          {/* Aircraft icon — rotated to heading, scales on hover */}
          <div
            style={{ transform: `rotate(${drone.heading}deg)` }}
            className={`transition-all duration-150 group-hover:scale-125 ${
              isSelected
                ? 'drop-shadow-[0_0_10px_rgba(96,165,250,0.9)]'
                : 'drop-shadow-[0_0_6px_rgba(248,113,113,0.7)] group-hover:drop-shadow-[0_0_12px_rgba(248,113,113,0.95)]'
            }`}
          >
            <AircraftSVG color={iconColor} size={iconSize} />
          </div>

          {/* Nickname label below, only when selected */}
          {isSelected && (
            <div className='text-[10px] text-white bg-black/75 px-1.5 py-0.5 rounded whitespace-nowrap font-medium leading-none'>
              {drone.nickname}
            </div>
          )}
        </div>
      </Marker>
    );
  },
  (prev, next) =>
    prev.drone.sn === next.drone.sn &&
    prev.drone.longitude === next.drone.longitude &&
    prev.drone.latitude === next.drone.latitude &&
    prev.drone.heading === next.drone.heading &&
    prev.drone.altitude === next.drone.altitude &&
    prev.drone.hasGPS === next.drone.hasGPS &&
    prev.isSelected === next.isSelected &&
    prev.showAltitude === next.showAltitude
);

DroneMarker.displayName = 'DroneMarker';
