'use client';

import React from 'react';
import { MainLayout } from '@/components/layout/main-layout';
import { StatCard } from '@/components/features/metrics/stat-card';
import { useDronesWebSocket } from '@/hooks/useDronesWebSocket';
import { useDJIDevices } from '@/hooks/useDJIDevices';
import { DJI_CONFIG } from '@/lib/config/config';
import { cn } from '@/lib/utils';

import { UnifiedStream } from '@/lib/types';

// Compact stream card for dashboard (no modal, just shows placeholder for now)
function DashboardStreamCard({ stream }: { stream: UnifiedStream }) {
  const { id, name, type, isOnline } = stream;

  return (
    <div className='bg-card rounded-lg border border-gray-800 overflow-hidden group'>
      <div className='h-48 relative bg-black flex items-center justify-center'>
        <div className='text-center p-4'>
          <i
            className={cn(
              'fas text-3xl mb-2',
              type === 'DRONE'
                ? 'fa-drone text-blue-500'
                : type === 'BODY CAM'
                  ? 'fa-video text-purple-500'
                  : 'fa-camera text-green-500'
            )}
          ></i>
          <p className='text-sm text-gray-400 font-medium truncate max-w-[200px]'>{name}</p>
          {!isOnline && (
            <div className='flex items-center justify-center mt-2'>
              <div className='w-2 h-2 bg-red-500 rounded-full mr-2'></div>
              <span className='text-xs text-red-400 font-bold'>OFFLINE</span>
            </div>
          )}
        </div>

        {/* Device name overlay - bottom left */}
        <div className='absolute bottom-2 left-2 z-20'>
          <div className='bg-black bg-opacity-70 text-white px-2 py-1 rounded text-xs font-medium'>
            <i className='fas fa-video mr-1'></i>
            {id}
          </div>
        </div>

        {/* Live indicator - top right */}
        {isOnline && (
          <div className='absolute top-2 right-2 z-20'>
            <div className='flex items-center bg-green-600 bg-opacity-90 px-2 py-1 rounded text-xs font-bold'>
              <div className='w-2 h-2 bg-white rounded-full mr-1 animate-pulse'></div>
              <span className='text-white'>LIVE</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function DashboardPage() {
  // Both hooks are always called — Rules of Hooks requires no conditional hook calls.
  // DJI_CONFIG.USE_DJI_CLOUD (set in .env.local) selects which result is active.
  const wsResult = useDronesWebSocket();
  const djiResult = useDJIDevices();

  const mapToUnified = React.useCallback((item: any): UnifiedStream => {
    if ('deviceSn' in item) {
      return {
        id: item.deviceSn,
        name: item.deviceName,
        type: item.type,
        isOnline: item.status,
        raw: item,
        metadata: { alias: item.nickname },
      };
    } else {
      return {
        id: item.deviceSerialNumber,
        name: item.deviceName,
        type: item.deviceCategory,
        isOnline: item.streamIsOn,
        raw: item,
        metadata: item.metadata,
      };
    }
  }, []);

  const allStreams: UnifiedStream[] = React.useMemo(() => {
    const rawItems = DJI_CONFIG.USE_DJI_CLOUD ? (djiResult.data ?? []) : (wsResult.drones ?? []);
    return rawItems.map(mapToUnified);
  }, [djiResult.data, wsResult.drones, mapToUnified]);

  const isLoading = DJI_CONFIG.USE_DJI_CLOUD ? djiResult.isLoading : wsResult.isLoading;
  const error = DJI_CONFIG.USE_DJI_CLOUD ? djiResult.error : wsResult.error;
  // WebSocket has a live isConnected flag; DJI polling is "connected" whenever data exists
  const isConnected = DJI_CONFIG.USE_DJI_CLOUD ? !djiResult.isError : wsResult.isConnected;

  const totalStreams = allStreams.length;
  const onlineCount = allStreams.filter((s) => s.isOnline).length;

  return (
    <div className='bg-background text-foreground min-h-screen'>
      <MainLayout
        title='Operations Center'
        subtitle='Real-time surveillance and intelligence dashboard'
      >
        {/* Loading State */}
        {isLoading && (
          <div className='text-center py-12'>
            <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto'></div>
            <p className='text-gray-400 mt-4'>
              {DJI_CONFIG.USE_DJI_CLOUD
                ? 'Loading devices from DJI server…'
                : 'Loading streams from database…'}
            </p>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className='bg-red-900/20 border border-red-500 rounded-lg p-4 mb-6'>
            <p className='text-red-400'>Failed to load streams: {(error as Error)?.message}</p>
          </div>
        )}

        {/* WebSocket Connection Status */}
        {!isConnected && !isLoading && (
          <div className='bg-yellow-900/20 border border-yellow-500 rounded-lg p-3 mb-6 flex items-center'>
            <i className='fas fa-exclamation-triangle text-yellow-400 mr-3'></i>
            <p className='text-yellow-400 text-sm'>
              {DJI_CONFIG.USE_DJI_CLOUD
                ? 'Cannot reach DJI server. Check that the backend is running.'
                : 'Disconnected from real-time updates. Attempting to reconnect…'}
            </p>
          </div>
        )}

        {!isLoading && (
          <div className='space-y-6'>
            {/* Page Header */}
            <div className='flex items-center justify-between'>
              <div className='flex items-center space-x-3'>
                <div className='flex items-center space-x-1 px-3 py-1 bg-gray-800 rounded-lg border border-gray-700'>
                  <i className='fas fa-heartbeat text-green-400 text-sm'></i>
                  <span className='text-sm text-gray-300'>Health: 98%</span>
                </div>

                <button className='flex items-center px-3 py-2 text-sm bg-transparent border border-gray-600 rounded-lg hover:bg-gray-800 transition-colors'>
                  <i className='fas fa-cog text-gray-400 mr-2'></i>
                  Performance
                </button>

                <button className='flex items-center px-3 py-2 text-sm bg-transparent border border-gray-600 rounded-lg hover:bg-gray-800 transition-colors'>
                  <i className='fas fa-bolt text-green-400 mr-2'></i>
                  Auto: On
                </button>

                <button className='flex items-center px-3 py-2 text-sm bg-transparent border border-gray-600 rounded-lg hover:bg-gray-800 transition-colors'>
                  <i className='fas fa-sync-alt text-gray-400 mr-2'></i>
                  Refresh
                </button>
              </div>
            </div>

            {/* Key Metrics */}
            <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6'>
              {/* Active Incidents */}
              <StatCard
                title='Active Incidents'
                value={7}
                icon='fas fa-exclamation-triangle'
                color='red'
                variant='hover-border'
                trend={{
                  direction: 'up',
                  value: '+2 from yesterday',
                  isPositive: false,
                }}
              />

              {/* Threats Today */}
              <StatCard
                title='Threats Detected Today'
                value={23}
                icon='fas fa-shield-alt'
                color='yellow'
                variant='hover-border'
                trend={{
                  direction: 'up',
                  value: '+5 from yesterday',
                  isPositive: false,
                }}
              />

              {/* Assets Online */}
              <StatCard
                title='Assets Online'
                value={142}
                icon='fas fa-broadcast-tower'
                color='green'
                variant='hover-border'
                trend={{
                  direction: 'up',
                  value: '+1 from yesterday',
                }}
              />

              {/* Response Time */}
              <StatCard
                title='Avg Response Time'
                value='2.4s'
                icon='fas fa-clock'
                color='blue'
                variant='hover-border'
                trend={{
                  direction: 'down',
                  value: '-0.5s from yesterday',
                }}
              />
            </div>

            {/* Secondary Metrics */}
            <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
              <StatCard
                title='Operational Efficiency'
                value='95%'
                icon='fas fa-chart-line'
                color='purple'
              />

              <StatCard
                title='Critical Incidents'
                value={2}
                icon='fas fa-exclamation-triangle'
                color='orange'
              />

              <StatCard title='Total Assets' value={156} icon='fas fa-heartbeat' color='green' />
            </div>

            {/* Main Content Grid */}
            <div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
              {/* Live Video Feeds - Takes 2 columns */}
              <div className='lg:col-span-2 space-y-6'>
                <div className='space-y-4'>
                  <div className='flex items-center justify-between'>
                    <h2 className='text-xl font-semibold text-gray-100 flex items-center space-x-2'>
                      <i className='fas fa-video text-blue-500'></i>
                      <span>Live Surveillance Feeds</span>
                    </h2>
                    <div className='flex items-center space-x-4 text-sm text-gray-400'>
                      <div className='flex items-center space-x-2'>
                        <div className='w-2 h-2 bg-green-500 rounded-full animate-pulse'></div>
                        <span>
                          {onlineCount} / {totalStreams} Online
                        </span>
                      </div>
                      {isConnected && (
                        <span className='flex items-center text-xs text-green-400'>
                          <span className='w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse'></span>
                          Live Updates
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Video Feed Grid - Real WebRTC Streams */}
                  <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                    {allStreams.map((stream) => (
                      <DashboardStreamCard key={stream.id} stream={stream} />
                    ))}
                  </div>
                </div>
              </div>

              {/* Recent Incidents & Status - Takes 1 column */}
              <div className='space-y-6'>
                {/* Recent Incidents */}
                <div className='bg-card p-5 rounded-lg border border-gray-800'>
                  <h3 className='font-bold mb-4 flex items-center'>
                    <i className='fas fa-exclamation-circle text-red-400 mr-2'></i>
                    Recent Incidents
                  </h3>

                  <div className='space-y-3'>
                    <div className='p-3 bg-card border-l-4 border-red-500 rounded'>
                      <div className='flex justify-between items-center mb-1'>
                        <h4 className='font-semibold text-sm text-gray-200'>Unauthorized Entry</h4>
                        <span className='bg-red-600 text-xs px-2 py-1 rounded font-bold'>
                          ACTIVE
                        </span>
                      </div>
                      <p className='text-gray-400 text-xs mb-2'>
                        Perimeter breach detected at Gate 7
                      </p>
                      <div className='text-gray-500 text-xs flex items-center gap-3'>
                        <span>
                          <i className='fas fa-clock mr-1'></i>5m ago
                        </span>
                        <span>
                          <i className='fas fa-map-marker-alt mr-1'></i>Sector 7
                        </span>
                      </div>
                    </div>

                    <div className='p-3 bg-card border-l-4 border-yellow-500 rounded'>
                      <div className='flex justify-between items-center mb-1'>
                        <h4 className='font-semibold text-sm text-gray-200'>Suspicious Activity</h4>
                        <span className='bg-yellow-500 text-xs px-2 py-1 rounded font-bold'>
                          INVESTIGATING
                        </span>
                      </div>
                      <p className='text-gray-400 text-xs mb-2'>
                        Unusual movement patterns detected
                      </p>
                      <div className='text-gray-500 text-xs flex items-center gap-3'>
                        <span>
                          <i className='fas fa-clock mr-1'></i>12m ago
                        </span>
                        <span>
                          <i className='fas fa-map-marker-alt mr-1'></i>Zone Alpha
                        </span>
                      </div>
                    </div>

                    <div className='p-3 bg-card border-l-4 border-green-500 rounded'>
                      <div className='flex justify-between items-center mb-1'>
                        <h4 className='font-semibold text-sm text-gray-200'>
                          Equipment Malfunction
                        </h4>
                        <span className='bg-green-600 text-xs px-2 py-1 rounded font-bold'>
                          RESOLVED
                        </span>
                      </div>
                      <p className='text-gray-400 text-xs mb-2'>Camera 15 connectivity restored</p>
                      <div className='text-gray-500 text-xs flex items-center gap-3'>
                        <span>
                          <i className='fas fa-clock mr-1'></i>1h ago
                        </span>
                        <span>
                          <i className='fas fa-map-marker-alt mr-1'></i>Building C
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Operational Status */}
                <div className='space-y-4'>
                  <h3 className='text-lg font-semibold text-gray-100 flex items-center space-x-2'>
                    <i className='fas fa-chart-line text-blue-500'></i>
                    <span>Operational Status</span>
                  </h3>

                  <div className='space-y-3'>
                    <div className='flex items-center justify-between p-3 bg-card rounded-lg border border-gray-800'>
                      <span className='text-sm text-gray-400'>System Health</span>
                      <div className='flex items-center space-x-2'>
                        <div className='w-2 h-2 bg-green-500 rounded-full animate-pulse'></div>
                        <span className='text-sm font-medium text-green-400'>98%</span>
                      </div>
                    </div>

                    <div className='flex items-center justify-between p-3 bg-card rounded-lg border border-gray-800'>
                      <span className='text-sm text-gray-400'>Threat Detection</span>
                      <div className='flex items-center space-x-2'>
                        <div className='w-2 h-2 bg-green-500 rounded-full animate-pulse'></div>
                        <span className='text-sm font-medium text-green-400'>Active</span>
                      </div>
                    </div>

                    <div className='flex items-center justify-between p-3 bg-card rounded-lg border border-gray-800'>
                      <span className='text-sm text-gray-400'>Network Status</span>
                      <div className='flex items-center space-x-2'>
                        <div className='w-2 h-2 bg-green-500 rounded-full animate-pulse'></div>
                        <span className='text-sm font-medium text-green-400'>Connected</span>
                      </div>
                    </div>

                    <div className='flex items-center justify-between p-3 bg-card rounded-lg border border-gray-800'>
                      <span className='text-sm text-gray-400'>Database</span>
                      <div className='flex items-center space-x-2'>
                        <div className='w-2 h-2 bg-green-500 rounded-full animate-pulse'></div>
                        <span className='text-sm font-medium text-green-400'>Operational</span>
                      </div>
                    </div>

                    <div className='flex items-center justify-between p-3 bg-card rounded-lg border border-gray-800'>
                      <span className='text-sm text-gray-400'>Response Time</span>
                      <div className='flex items-center space-x-2'>
                        <div className='w-2 h-2 bg-green-500 rounded-full animate-pulse'></div>
                        <span className='text-sm font-medium text-green-400'>2.4s</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </MainLayout>
    </div>
  );
}
