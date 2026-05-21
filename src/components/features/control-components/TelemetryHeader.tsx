import React from 'react';
import { Wind } from 'lucide-react';

interface TelemetryItemProps {
  label: string;
  value: string | React.ReactNode;
  valueClassName?: string;
}

const TelemetryItem = ({
  label,
  value,
  valueClassName = 'text-zinc-100',
}: TelemetryItemProps) => (
  <div className='flex items-center gap-2'>
    <span className='text-[10px] font-normal tracking-widest text-[#8C90A0] uppercase font-poppins'>
      {label}
    </span>
    <span className={`text-xs text-[#E2E2E8] font-medium font-poppins ${valueClassName}`}>
      {value}
    </span>
  </div>
);

interface TelemetryHeaderProps {
  deviceName?: string;
  cameraName?: string;
  isStreaming?: boolean;
}

const TelemetryHeader = ({
  deviceName,
  cameraName,
  isStreaming = false,
}: TelemetryHeaderProps) => {
  return (
    <div className='flex items-center justify-between w-full h-14 px-6 bg-[#1A1C20] border border-[#42475426]/15 rounded-lg'>
      {/* Left Section: Core Mission Data */}
      <div className='flex items-center gap-x-10'>
        <TelemetryItem label='Mission' value='Alpha-7' />
        <TelemetryItem label='Dock ID' value='NestPoint-03' />
        <TelemetryItem
          label='Drone'
          value={deviceName ?? '—'}
          valueClassName='text-blue-500'
        />
        <TelemetryItem label='Camera' value={cameraName ?? '—'} />
        <TelemetryItem
          label='Live Feed'
          value={isStreaming ? 'Active' : 'Standby'}
          valueClassName={isStreaming ? 'text-emerald-400' : 'text-zinc-500'}
        />
      </div>

      {/* Right Section: Environmental & Status Data */}
      <div className='flex items-center gap-x-8'>
        <div className='flex items-center gap-2'>
          <Wind size={14} className='text-[#C2C6D7]' />
          <span className='text-xs font-normal font-poppins text-[#C2C6D7]'>
            Wind: 12 km/h
          </span>
        </div>

        <div className='flex items-center gap-2'>
          <span className='text-[10px] font-normal font-poppins tracking-widest text-[#8C90A0] uppercase'>
            Elapsed
          </span>
          <span className='text-sm font-normal font-poppins text-[#45F0CF]'>
            00:42:17
          </span>
        </div>

        <div
          className={`flex items-center gap-2 px-3 py-1 rounded border transition-colors ${
            isStreaming
              ? 'bg-[#FF0000]/10 border-[#FF0000]/30'
              : 'bg-zinc-800/50 border-zinc-700'
          }`}
        >
          <div
            className={`w-2 h-2 rounded-full ${
              isStreaming
                ? 'bg-[#FF0000] animate-pulse shadow-[0px_0px_8px_0px_#FF000080]'
                : 'bg-zinc-600'
            }`}
          />
          <span
            className={`text-[10px] font-bold font-poppins tracking-widest uppercase ${
              isStreaming ? 'text-[#FF0000]' : 'text-zinc-500'
            }`}
          >
            {isStreaming ? 'Live' : 'Offline'}
          </span>
        </div>
      </div>
    </div>
  );
};

export default TelemetryHeader;
