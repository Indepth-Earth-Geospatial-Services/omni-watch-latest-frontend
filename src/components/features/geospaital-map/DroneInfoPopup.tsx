'use client';
import { memo } from 'react';
import { Popup } from 'react-map-gl/maplibre';
import type { DronePositionType, SelectedDroneInfo } from './map-types';

interface DroneInfoPopupProps {
  drone: DronePositionType;
  info: SelectedDroneInfo;
  onClose: () => void;
}

export const DroneInfoPopup = memo(({ drone, info, onClose }: DroneInfoPopupProps) => (
  <Popup
    longitude={drone.longitude}
    latitude={drone.latitude}
    onClose={onClose}
    anchor='bottom'
    className='drone-popup'
  >
    <div className='bg-neutral-950 text-white p-3 rounded-lg min-w-[240px]'>
      <h3 className='font-semibold text-base mb-1'>{info.nickname}</h3>
      <div className='text-xs text-gray-400 mb-2'>SN: {info.serialNumber.slice(-8)}</div>

      <div className='border-t border-gray-700 pt-2 space-y-1 text-sm'>
        <Row label='Lat' value={<span className='font-mono text-xs'>{info.latitude}</span>} />
        <Row label='Lng' value={<span className='font-mono text-xs'>{info.longitude}</span>} />
        <Row label='Altitude' value={info.altitude != null ? `${info.altitude.toFixed(1)} m` : '—'} />
        <Row label='Heading' value={`${info.direction} ${info.heading}°`} />
        <Row label='Speed' value={`${info.speed.toFixed(1)} m/s`} />
        <Row
          label='Battery'
          value={
            <span
              className={
                info.battery < 20
                  ? 'text-red-400'
                  : info.battery < 40
                    ? 'text-yellow-400'
                    : 'text-green-400'
              }
            >
              {info.battery}%
            </span>
          }
        />
        <Row label='Mode' value={info.modeCode === 1 ? 'In-flight' : 'Standby'} />
      </div>
    </div>
  </Popup>
));

DroneInfoPopup.displayName = 'DroneInfoPopup';

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className='flex justify-between items-center'>
      <span className='text-gray-400'>{label}</span>
      <span className='font-mono'>{value}</span>
    </div>
  );
}
