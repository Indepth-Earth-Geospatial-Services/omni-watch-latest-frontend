'use client';

import { memo, useState, useRef, useEffect } from 'react';
import { Navigation2, Check, Loader2, AlertTriangle, Route, X } from 'lucide-react';
import type { Wayline, WaypointCoord } from '@/lib/types';
import { getWaylineId } from '@/lib/types/wayline';

interface WaylinePanelProps {
  waylines: Wayline[];
  isLoading: boolean;
  activeWaylineId: string | null;
  activeRoute: WaypointCoord[] | undefined;
  isLoadingRoute: boolean;
  onSelect: (id: string | null) => void;
  onFitRoute: () => void;
}

const TYPE_LABEL: Record<number, string> = { 0: 'Waypoint', 1: 'Mapping', 2: 'Oblique' };
const TYPE_COLOR: Record<number, string> = {
  0: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  1: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  2: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
};

function fmtDate(ts: number) {
  return new Date(ts).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export const WaylinePanel = memo(function WaylinePanel({
  waylines,
  isLoading,
  activeWaylineId,
  activeRoute,
  isLoadingRoute,
  onSelect,
  onFitRoute,
}: WaylinePanelProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close popover when clicking outside
  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  const hasActive = !!activeWaylineId;
  const activeName = waylines.find((w) => getWaylineId(w) === activeWaylineId)?.name;

  return (
    <div ref={containerRef} className='absolute bottom-4 left-4 z-20 flex flex-col items-start'>
      {/* Popover list — renders above the FAB button */}
      {open && (
        <div className='mb-2 w-64 bg-neutral-950/95 backdrop-blur-sm border border-gray-800 rounded-xl shadow-2xl overflow-hidden'>
          {/* Header */}
          <div className='flex items-center justify-between px-3 py-2 border-b border-gray-800/50'>
            <div className='flex items-center gap-1.5'>
              <Route className='w-3 h-3 text-cyan-400' />
              <span className='text-[10px] font-bold text-gray-400 uppercase tracking-wider'>
                Wayline Routes
              </span>
            </div>
            {!isLoading && (
              <span className='text-[9px] font-mono text-cyan-500/70'>
                {waylines.length} route{waylines.length !== 1 ? 's' : ''}
              </span>
            )}
          </div>

          {/* List body */}
          <div className='p-1.5 max-h-52 overflow-y-auto'>
            {isLoading ? (
              <div className='space-y-1'>
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className='px-2.5 py-2 rounded-lg bg-neutral-900/40 space-y-1.5'>
                    <div className='h-2.5 w-32 bg-gray-800 rounded animate-pulse' />
                    <div className='h-2 w-20 bg-gray-800/60 rounded animate-pulse' />
                  </div>
                ))}
              </div>
            ) : waylines.length === 0 ? (
              <p className='text-center text-[10px] text-gray-600 py-4'>No waylines in workspace</p>
            ) : (
              <div className='space-y-0.5'>
                {waylines.map((wl) => {
                  const wlId = getWaylineId(wl);
                  const isActive = wlId === activeWaylineId;
                  const isParsing = isActive && isLoadingRoute;
                  return (
                    <button
                      key={wlId}
                      onClick={() => {
                        onSelect(isActive ? null : wlId);
                        if (!isActive) setOpen(false);
                      }}
                      className={`w-full text-left px-2.5 py-2 rounded-lg text-xs transition-all border ${
                        isActive
                          ? 'bg-cyan-500/10 border-cyan-500/30'
                          : 'border-transparent hover:bg-white/5 hover:border-gray-700/50'
                      }`}
                    >
                      <div className='flex items-center justify-between gap-2 mb-1'>
                        <span
                          className={`font-semibold truncate leading-none ${
                            isActive ? 'text-cyan-300' : 'text-gray-200'
                          }`}
                        >
                          {wl.name}
                        </span>
                        {isParsing ? (
                          <Loader2 className='w-3 h-3 text-cyan-400 animate-spin flex-shrink-0' />
                        ) : isActive ? (
                          <Check className='w-3 h-3 text-cyan-400 flex-shrink-0' />
                        ) : null}
                      </div>
                      <div className='flex items-center gap-1.5'>
                        <span
                          className={`text-[8px] font-bold px-1.5 py-0.5 rounded border ${TYPE_COLOR[wl.template_types?.[0]] ?? TYPE_COLOR[0]}`}
                        >
                          {TYPE_LABEL[wl.template_types?.[0]] ?? 'Waypoint'}
                        </span>
                        <span className='text-[9px] text-gray-600 truncate'>
                          {wl.user_name} · {fmtDate(wl.update_time)}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Active route footer */}
          {hasActive && (
            <div className='border-t border-gray-800/50 px-3 py-1.5 flex items-center justify-between'>
              {isLoadingRoute ? (
                <span className='text-[9px] text-cyan-500/70 font-mono'>Loading route…</span>
              ) : activeRoute && activeRoute.length > 0 ? (
                <>
                  <span className='text-[9px] text-cyan-400 font-mono'>
                    {activeRoute.length} pts ·{' '}
                    {Math.min(...activeRoute.map((p) => p.alt).filter(Boolean)).toFixed(0)}–
                    {Math.max(...activeRoute.map((p) => p.alt)).toFixed(0)} m
                  </span>
                  <div className='flex items-center gap-2 ml-2'>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onFitRoute();
                        setOpen(false);
                      }}
                      className='text-[9px] font-bold text-cyan-400 hover:text-cyan-300 transition-colors'
                    >
                      FIT MAP
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelect(null);
                        setOpen(false);
                      }}
                      className='text-[9px] font-bold text-red-400 hover:text-red-300 transition-colors'
                    >
                      CLEAR
                    </button>
                  </div>
                </>
              ) : (
                <div className='flex items-center justify-between w-full'>
                  <div className='flex items-center gap-1 text-[9px] text-red-400'>
                    <AlertTriangle className='w-2.5 h-2.5' />
                    Failed to load route
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelect(null);
                      setOpen(false);
                    }}
                    className='text-[9px] font-bold text-red-400 hover:text-red-300 transition-colors'
                  >
                    CLEAR
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* FAB row — trigger + inline clear button when a route is active */}
      <div className='flex items-center gap-2'>
        {/* {hasActive && (
          <button
            onClick={() => { onSelect(null); setOpen(false); }}
            title='Clear route'
            className='w-7 h-7 rounded-full bg-neutral-950/90 border border-red-500/50 text-red-400 hover:bg-red-500/10 hover:border-red-400 hover:text-red-300 flex items-center justify-center transition-all duration-200 shadow-lg'
          >
            <X className='w-3 h-3' />
          </button>
        )} */}

        {/* FAB trigger button */}
        <button
          onClick={() => setOpen((p) => !p)}
          title={hasActive ? `Active: ${activeName}` : 'Wayline Routes'}
          className={`relative w-9 h-9 rounded-full shadow-lg border flex items-center justify-center transition-all duration-200 ${
            open
              ? 'bg-cyan-500 border-cyan-400 text-white shadow-cyan-500/30'
              : hasActive
                ? 'bg-cyan-600/90 border-cyan-500/60 text-white shadow-cyan-600/20'
                : 'bg-neutral-950/90 border-gray-700 text-gray-400 hover:text-white hover:border-gray-500 hover:bg-neutral-900'
          }`}
        >
          <Navigation2 className='w-4 h-4' />

          {/* Active route indicator dot */}
          {hasActive && !isLoadingRoute && (
            <span className='absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-neutral-950' />
          )}
          {/* Loading spinner overlay */}
          {isLoadingRoute && (
            <span className='absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-cyan-400 rounded-full border-2 border-neutral-950 animate-pulse' />
          )}
          {/* Count badge when no active route */}
          {!hasActive && !isLoading && waylines.length > 0 && (
            <span className='absolute -top-1 -right-1 min-w-[14px] h-3.5 text-[8px] font-black bg-cyan-500 text-white rounded-full flex items-center justify-center px-0.5 border border-neutral-950 leading-none'>
              {waylines.length}
            </span>
          )}
        </button>
      </div>
      {/* end FAB row */}
    </div>
  );
});
