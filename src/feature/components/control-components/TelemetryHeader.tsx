import React from 'react';
import { Wind, Radio } from 'lucide-react';

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
    <span
      className={`text-xs text-[#E2E2E8] font-medium font-poppins ${valueClassName}`}
    >
      {value}
    </span>
  </div>
);

const TelemetryHeader = () => {
  return (
    <div className='flex items-center justify-between w-full h-14 px-6 bg-[#1A1C20] border border-[#42475426]/15 rounded-lg'>
      {/* 1. Left Section: Core Mission Data */}
      <div className='flex items-center gap-x-10'>
        <TelemetryItem label='Mission' value='Alpha-7' />
        <TelemetryItem label='Dock ID' value='NestPoint-03' />
        <TelemetryItem
          label='Drone'
          value='Raptor-07'
          valueClassName='text-blue-500'
        />
        <TelemetryItem label='Operator' value='J. Okafor' />
        <TelemetryItem label='Live Feed' value='Dock' />
      </div>

      {/* 2. Right Section: Environmental & Status Data */}
      <div className='flex items-center gap-x-8'>
        {/* Environmental Info */}
        <div className='flex items-center gap-2'>
          <Wind size={14} className='text-[#C2C6D7]' />
          <span className='text-xs font-normal font-poppins text-[#C2C6D7]'>
            Wind: 12 km/h
          </span>
        </div>

        {/* Elapsed Time */}
        <div className='flex items-center gap-2'>
          <span className='text-[10px] font-normal font-poppins tracking-widest text-[#8C90A0] uppercase'>
            Elapsed
          </span>
          <span className='text-sm font-normal font-poppins text-[#45F0CF]'>
            00:42:17
          </span>
        </div>

        {/* Live Indicator */}
        <div className='flex items-center gap-2 px-3 py-1 bg-[#FF0000]/10 border border-[#FF0000]/30 rounded'>
          <div className='w-2 h-2 bg-[#FF0000] rounded-full animate-pulse shadow-[0px_0px_8px_0px_#FF000080]' />
          <span className='text-[10px] font-bold font-poppins tracking-widest text-[#FF0000] uppercase'>
            Live
          </span>
        </div>
      </div>
    </div>
  );
};

export default TelemetryHeader;
