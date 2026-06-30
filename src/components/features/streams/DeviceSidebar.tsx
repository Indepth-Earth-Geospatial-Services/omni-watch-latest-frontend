'use client';

import React, { memo } from 'react';
import { Activity, Box, PlaneTakeoff, Square, Wifi, WifiOff, X, Sparkles } from 'lucide-react';
import { isDrone } from './stream-utils';
import { Switch } from '@/components/ui/switch';
import type { DJIDevice, DeviceConfig } from '@/lib/types';

interface DeviceSidebarProps {
  projectDevices: DJIDevice[];
  unboundDevices: { id: string; device: { device_sn: string; name: string } }[];
  selectedSn: string | null;
  viewMode: 'single' | 'multi';
  streamingDevices: Map<string, string>;
  onSelect: (sn: string) => void;
  onStop: (sn: string) => void;
  isLoading?: boolean;
  isOpen: boolean;
  onClose: () => void;
  deviceConfigs?: DeviceConfig[];
  onAIToggle?: (sn: string, enabled: boolean) => void;
}

export const DeviceSidebar = memo(function DeviceSidebar({
  projectDevices,
  unboundDevices,
  selectedSn,
  viewMode,
  streamingDevices,
  onSelect,
  onStop,
  isLoading = false,
  isOpen,
  onClose,
  deviceConfigs = [],
  onAIToggle,
}: DeviceSidebarProps) {
  const onlineCount = projectDevices.filter((d) => d.status).length;
  const effectiveSn = selectedSn ?? projectDevices[0]?.deviceSn;

  const sidebarContent = (
    <aside className='w-60 flex-shrink-0 bg-background border border-border rounded-xl flex flex-col overflow-hidden h-full'>
      <div className='flex items-center justify-between px-4 py-[22px] border-b border-border flex-shrink-0'>
        <p className='text-[9px] font-black tracking-[0.16em] uppercase text-muted-foreground'>Devices</p>
        <div className='flex items-center gap-1.5'>
          <span className='w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse' />
          <span className='text-[10px] font-semibold text-emerald-400'>{onlineCount}</span>
          <span className='text-[10px] text-zinc-700'>/ {projectDevices.length}</span>
          {/* Close button — mobile only */}
          <button
            onClick={onClose}
            className='ml-2 p-1 rounded text-muted-foreground hover:text-muted-foreground hover:bg-secondary transition-colors lg:hidden'
          >
            <X size={13} />
          </button>
        </div>
      </div>

      <div className='flex-1 overflow-y-auto p-2 space-y-1'>
        {isLoading
          ? Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className='flex items-center gap-2.5 px-3 py-2.5 rounded-lg bg-zinc-900/30 border border-zinc-800/30'
              >
                <div className='w-7 h-7 bg-secondary rounded-md animate-pulse flex-shrink-0' />
                <div className='flex-1 flex flex-col gap-1.5'>
                  <div className='h-2.5 w-24 bg-secondary rounded animate-pulse' />
                  <div className='h-2 w-16 bg-zinc-800/60 rounded animate-pulse' />
                </div>
                <div className='w-2.5 h-2.5 bg-secondary rounded-full animate-pulse' />
              </div>
            ))
          : projectDevices.length === 0
            ? unboundDevices.map((d) => (
                <div
                  key={d.id}
                  className='flex items-center gap-3 px-3 py-3 rounded-lg bg-zinc-900/40 border border-zinc-800/40'
                >
                  <div className='w-7 h-7 rounded-md bg-secondary border border-border flex items-center justify-center flex-shrink-0'>
                    <PlaneTakeoff size={12} className='text-muted-foreground' />
                  </div>
                  <div className='min-w-0'>
                    <p className='text-[10px] font-logs text-muted-foreground truncate'>
                      {d.device.device_sn}
                    </p>
                    <p className='text-[9px] text-zinc-700'>Not bound</p>
                  </div>
                </div>
              ))
            : projectDevices.map((device) => {
                const drone = isDrone(device);
                const isActive = viewMode === 'single' && effectiveSn === device.deviceSn;
                const isStreaming = streamingDevices.has(device.deviceSn);

                return (
                  <div
                    key={device.deviceSn}
                    className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg border transition-colors group/row ${
                      isActive
                        ? 'bg-theme-accent/10 border-theme-accent/30'
                        : 'bg-zinc-900/30 border-zinc-800/30 hover:bg-secondary/50 hover:border-zinc-700/60'
                    }`}
                  >
                    <button
                      onClick={() => {
                        onSelect(device.deviceSn);
                        onClose(); // auto-close drawer on mobile after selection
                      }}
                      className='flex items-center gap-2.5 flex-1 min-w-0 text-left'
                    >
                      <div
                        className={`w-7 h-7 rounded-md border flex items-center justify-center flex-shrink-0 ${
                          drone
                            ? 'bg-blue-500/10 border-blue-500/20'
                            : 'bg-cyan-500/10 border-cyan-500/20'
                        }`}
                      >
                        {drone ? (
                          <Activity size={12} className='text-blue-400' />
                        ) : (
                          <Box size={12} className='text-cyan-400' />
                        )}
                      </div>
                      <div className='min-w-0 flex-1'>
                        <p
                          className={`text-xs font-bold truncate ${isActive ? 'text-theme-accent' : 'text-muted-foreground'}`}
                        >
                          {device.nickname || device.deviceName || device.deviceSn}
                        </p>
                        <p className='text-[9px] font-logs text-muted-foreground truncate'>
                          {device.deviceSn}
                        </p>
                      </div>
                    </button>

                    <div className='flex items-center gap-1 flex-shrink-0'>
                      {(() => {
                        const deviceConfig = deviceConfigs.find((c) => c.device_sn === device.deviceSn);
                        const aiEnabled = deviceConfig?.ai_enabled ?? false;
                        return (
                          <div className='flex items-center gap-1'>
                            {aiEnabled && (
                              <Sparkles size={9} className='text-violet-400' title='AI enabled' />
                            )}
                            <Switch
                              checked={aiEnabled}
                              onCheckedChange={(checked) => onAIToggle?.(device.deviceSn, checked)}
                              disabled={!onAIToggle}
                              className='scale-75 origin-center'
                            />
                          </div>
                        );
                      })()}
                      {isStreaming ? (
                        <>
                          <span
                            className='w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse'
                            title='Streaming'
                          />
                          <button
                            onClick={() => onStop(device.deviceSn)}
                            title='Stop stream'
                            className='p-1 rounded opacity-0 group-hover/row:opacity-100 text-red-400 hover:bg-red-500/20 transition-all'
                          >
                            <Square size={10} />
                          </button>
                        </>
                      ) : device.status ? (
                        <Wifi size={10} className='text-emerald-400' />
                      ) : (
                        <WifiOff size={10} className='text-zinc-700' />
                      )}
                    </div>
                  </div>
                );
              })}
      </div>
    </aside>
  );

  return (
    <>
      {/* Desktop: always visible inline */}
      <div className='hidden lg:flex h-full'>{sidebarContent}</div>

      {/* Mobile: slide-in drawer with backdrop */}
      {isOpen && (
        <div className='lg:hidden fixed inset-0 z-50 flex'>
          {/* Backdrop */}
          <div className='absolute inset-0 bg-black/60 backdrop-blur-sm' onClick={onClose} />
          {/* Drawer panel */}
          <div className='relative z-10 flex h-full pt-2 pb-4 pl-2'>{sidebarContent}</div>
        </div>
      )}
    </>
  );
});
