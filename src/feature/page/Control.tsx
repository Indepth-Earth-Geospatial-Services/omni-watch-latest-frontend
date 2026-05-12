'use client';

import React from 'react';

// Importing the modular components we built
import TelemetryHeader from '@/feature/components/control-components/TelemetryHeader';
import FlightStatsBar from '@/feature/components/control-components/FlightStatsBar';
import MissionControlViewport from '@/feature/components/control-components/MissionControlViewport';
import TacticalMiniMap from '@/feature/components/control-components/TacticalMiniMap';
import DockMonitor from '@/feature/components/control-components/DockMonitor';
import SystemStatusFooter from '@/feature/components/control-components/SystemStatusFooter';

export default function ControlPage() {
  return (
    <div className=' bg-black text-zinc-100 flex flex-col font-sans selection:bg-blue-500/30'>
      {/* 1. Global Navigation */}

      {/* Main Content Area */}
      <main className='flex-1 flex flex-col items-center py-4 px-6 pb-[80px] overflow-y-auto overflow-x-hidden'>
        <div className='w-full space-y-4'>
          {/* 2. Top Status Section */}
          <section className='space-y-2'>
            <TelemetryHeader />
            <FlightStatsBar />
          </section>

          {/* 3. Primary Mission Control Grid */}
          <div className='flex flex-row gap-4 justify-center'>
            {/* Left/Center Column: Primary Operations (Fixed 1067px) */}
            {/* <div className='flex flex-col rounded-xl overflow-hidden border border-zinc-800/50 bg-[#0C0E12] shadow-2xl'> */}
            <MissionControlViewport />
            {/* </div> */}

            {/* Right Column: Secondary Data & Docking (Fixed 304px area) */}
            <aside className='flex flex-col gap-4'>
              <TacticalMiniMap />
              <DockMonitor />
            </aside>
          </div>
        </div>
      </main>

      {/* 4. Global System Footer */}
      <SystemStatusFooter />
    </div>
  );
}
