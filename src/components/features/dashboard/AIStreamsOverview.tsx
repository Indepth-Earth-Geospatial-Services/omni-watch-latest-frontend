'use client';

import { Brain, Radio, Wifi } from 'lucide-react';
import { useAIStreamStats } from '@/hooks/useAIStreamStats';

export function AIStreamsOverview() {
  const { totalAIConfiguredDevices, activeAIStreams, aiEnabledDevices, isLoading } =
    useAIStreamStats();

  if (isLoading) {
    return (
      <div className='flex flex-col min-h-0'>
        <h3 className='text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2'>
          AI Streams
        </h3>
        <div className='bg-background border border-border/50 rounded-xl p-4 flex items-center justify-center py-8'>
          <span className='text-xs text-muted-foreground'>Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className='flex flex-col min-h-0'>
      <h3 className='text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2'>
        AI Streams
      </h3>
      <div className='bg-background border border-border/50 rounded-xl overflow-hidden'>
        {/* Summary Stats */}
        <div className='px-4 py-3 border-b border-border/30'>
          <div className='flex items-center justify-between mb-2'>
            <div className='flex items-center gap-1.5'>
              <Brain className='w-3.5 h-3.5 text-muted-foreground' />
              <span className='text-xs text-muted-foreground'>AI Configured</span>
            </div>
            <span className='text-xs font-medium text-foreground'>{totalAIConfiguredDevices}</span>
          </div>
          <div className='flex items-center justify-between'>
            <div className='flex items-center gap-1.5'>
              <Radio className='w-3.5 h-3.5 text-muted-foreground' />
              <span className='text-xs text-muted-foreground'>Active AI Streams</span>
            </div>
            <div className='flex items-center gap-1.5'>
              {activeAIStreams > 0 && (
                <div className='relative'>
                  <div className='w-2 h-2 rounded-full bg-green-500' />
                  <div className='absolute inset-0 w-2 h-2 rounded-full bg-green-500 animate-ping' />
                </div>
              )}
              <span className='text-xs font-medium text-foreground'>{activeAIStreams}</span>
            </div>
          </div>
        </div>

        {/* Device List */}
        <div className='px-4 py-3'>
          <div className='flex items-center gap-1.5 mb-2'>
            <Wifi className='w-3.5 h-3.5 text-muted-foreground' />
            <span className='text-xs text-muted-foreground'>Devices</span>
          </div>
          {aiEnabledDevices.length === 0 ? (
            <p className='text-[10px] text-muted-foreground'>No AI-configured devices</p>
          ) : (
            <div className='space-y-0'>
              {aiEnabledDevices.map((device) => {
                const isOnline = device.isActive;
                return (
                  <div
                    key={device.deviceSn}
                    className='flex items-center justify-between py-1.5'
                  >
                    <div className='flex items-center gap-2 min-w-0'>
                      <div
                        className={`w-2 h-2 rounded-full shrink-0 ${
                          isOnline ? 'bg-green-500' : 'bg-zinc-600'
                        }`}
                      />
                      <div className='min-w-0'>
                        <span className='text-[10px] text-foreground block truncate'>
                          {device.name}
                        </span>
                        <span className='text-[9px] text-muted-foreground block truncate'>
                          {device.deviceSn}
                        </span>
                      </div>
                    </div>
                    <span
                      className={`text-[10px] font-medium shrink-0 ml-2 ${
                        isOnline ? 'text-green-400' : 'text-muted-foreground'
                      }`}
                    >
                      {isOnline ? 'Streaming' : 'Idle'}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
