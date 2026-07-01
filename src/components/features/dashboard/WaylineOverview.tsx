'use client';

import { Map, Navigation, Grid3x3, Compass } from 'lucide-react';
import { useWaylineStats } from '@/hooks/useWaylineStats';

function formatTime(ts: string): string {
  if (!ts || ts === '0001-01-01 00:00:00') return '—';
  return ts.replace('T', ' ').slice(0, 16);
}

const typeColors = {
  waypoint: 'bg-blue-500',
  mapping: 'bg-green-500',
  oblique: 'bg-purple-500',
};

const typeLabels = {
  waypoint: 'Waypoint',
  mapping: 'Mapping',
  oblique: 'Oblique',
};

export function WaylineOverview() {
  const { totalWaylines, waylinesByType, lastUsedWayline, waylineUsageStats, isLoading } =
    useWaylineStats();

  if (isLoading) {
    return (
      <div className='flex flex-col min-h-0'>
        <h3 className='text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2'>
          Waylines
        </h3>
        <div className='bg-background border border-border/50 rounded-xl p-4 flex items-center justify-center py-8'>
          <span className='text-xs text-muted-foreground'>Loading...</span>
        </div>
      </div>
    );
  }

  const topUsage = waylineUsageStats.slice(0, 3);
  const maxUsage = topUsage.length > 0 ? topUsage[0].usageCount : 1;

  return (
    <div className='flex flex-col min-h-0'>
      <h3 className='text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2'>
        Waylines
      </h3>
      <div className='bg-background border border-border/50 rounded-xl overflow-hidden'>
        {/* Total + Type Breakdown */}
        <div className='px-4 py-3 border-b border-border/30'>
          <div className='flex items-center justify-between mb-2'>
            <div className='flex items-center gap-1.5'>
              <Map className='w-3.5 h-3.5 text-muted-foreground' />
              <span className='text-xs text-muted-foreground'>Total Waylines</span>
            </div>
            <span className='text-xs font-medium text-foreground'>{totalWaylines}</span>
          </div>
          <div className='flex gap-3'>
            {(Object.keys(waylinesByType) as Array<keyof typeof waylinesByType>).map((type) => (
              <div key={type} className='flex items-center gap-1.5'>
                <div className={`w-2 h-2 rounded-full ${typeColors[type]}`} />
                <span className='text-[10px] text-muted-foreground'>
                  {typeLabels[type]}: {waylinesByType[type]}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Last Used */}
        <div className='px-4 py-3 border-b border-border/30'>
          <div className='flex items-center justify-between'>
            <div className='flex items-center gap-1.5'>
              <Navigation className='w-3.5 h-3.5 text-muted-foreground' />
              <span className='text-xs text-muted-foreground'>Last Used</span>
            </div>
            <span className='text-xs text-foreground truncate max-w-[140px]' title={lastUsedWayline?.name ?? '—'}>
              {lastUsedWayline?.name ?? '—'}
            </span>
          </div>
          {lastUsedWayline?.lastUsed && (
            <p className='text-[10px] text-muted-foreground mt-1'>
              {formatTime(lastUsedWayline.lastUsed)}
            </p>
          )}
        </div>

        {/* Top Used */}
        <div className='px-4 py-3'>
          <div className='flex items-center gap-1.5 mb-2'>
            <Grid3x3 className='w-3.5 h-3.5 text-muted-foreground' />
            <span className='text-xs text-muted-foreground'>Most Used</span>
          </div>
          {topUsage.length === 0 ? (
            <p className='text-[10px] text-muted-foreground'>No usage data</p>
          ) : (
            <div className='space-y-2'>
              {topUsage.map((wl) => (
                <div key={wl.waylineId} className='space-y-1'>
                  <div className='flex items-center justify-between'>
                    <span className='text-[10px] text-foreground truncate max-w-[140px]' title={wl.name}>
                      {wl.name}
                    </span>
                    <span className='text-[10px] text-muted-foreground ml-2'>
                      {wl.usageCount}x
                    </span>
                  </div>
                  <div className='h-1 bg-secondary rounded-full overflow-hidden'>
                    <div
                      className='h-full bg-sky-500 rounded-full'
                      style={{ width: `${(wl.usageCount / maxUsage) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
