'use client';

import { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  Gauge,
  Loader2,
  Plane,
  Wifi,
  WifiOff,
  Image,
  ListTodo,
  FolderOpen,
  Map,
} from 'lucide-react';
import { MainLayout } from '@/components/layout/main-layout';
import { EmptyPage } from '@/components/features/streams/EmptyPage';
import { StatCard } from '@/components/features/metrics/stat-card';
import { TaskStatusBadge } from '@/components/features/tasks/TaskStatusBadge';
import { WaylineOverview } from '@/components/features/dashboard/WaylineOverview';
import { AIStreamsOverview } from '@/components/features/dashboard/AIStreamsOverview';
import { useProject } from '@/providers/ProjectProvider';
import { useAuth } from '@/providers/AuthProvider';
import { DJI_CONFIG } from '@/lib/config/config';
import { useDJIDevices } from '@/hooks/useDJIDevices';
import { useFlightTasks } from '@/hooks/useFlightTasks';
import { useMediaFiles } from '@/hooks/useMedia';

function formatTime(ts: string): string {
  if (!ts || ts === '0001-01-01 00:00:00') return '—';
  return ts.replace('T', ' ').slice(0, 16);
}

const taskTypeMap: Record<number, string> = {
  0: 'Immediate',
  1: 'Timed',
  2: 'Conditional',
};

export default function DashboardPage() {
  const { activeProject } = useProject();
  const { user } = useAuth();
  const router = useRouter();
  const workspaceId = user?.workspace_id ?? DJI_CONFIG.WORKSPACE_ID;

  // Fetch data
  const { data: devices = [], isLoading: devicesLoading } = useDJIDevices({ refetchInterval: 30_000 });
  const { data: taskData, isLoading: tasksLoading } = useFlightTasks(workspaceId, { page: 1, page_size: 100 });
  const { data: mediaData, isLoading: mediaLoading } = useMediaFiles(workspaceId, { page: 1, page_size: 1 });

  // Compute stats
  const stats = useMemo(() => {
    const drones = devices.filter((d) => d.domain === '0');
    const docks = devices.filter((d) => d.domain === '1');
    const onlineDrones = drones.filter((d) => d.status);
    const tasks = taskData?.list ?? [];
    const activeMissions = tasks.filter((t) => t.status === 0 || t.status === 1);
    const failedMissions = tasks.filter((t) => t.status === 3);

    return {
      totalDrones: drones.length,
      onlineDrones: onlineDrones.length,
      offlineDrones: drones.length - onlineDrones.length,
      totalDocks: docks.length,
      onlineDocks: docks.filter((d) => d.status).length,
      totalTasks: taskData?.pagination.total ?? tasks.length,
      activeMissions: activeMissions.length,
      failedMissions: failedMissions.length,
      totalMedia: mediaData?.pagination.total ?? 0,
    };
  }, [devices, taskData, mediaData]);

  // Recent missions (last 8)
  const recentMissions = useMemo(() => {
    const tasks = taskData?.list ?? [];
    return tasks.slice(0, 8);
  }, [taskData]);

  // Drone list for fleet status
  const droneList = useMemo(() => {
    return devices
      .filter((d) => d.domain === '0')
      .sort((a, b) => (b.status ? 1 : 0) - (a.status ? 1 : 0));
  }, [devices]);

  // Project guard
  if (!activeProject) {
    return (
      <EmptyPage
        icon={<Gauge className='w-6 h-6 text-muted-foreground' />}
        title='No Project Selected'
        body='Please select a project from the sidebar to access the Dashboard.'
        action={{
          label: 'Go to Projects',
          onClick: () => router.push('/projects'),
        }}
      />
    );
  }

  const isLoading = devicesLoading || tasksLoading || mediaLoading;

  return (
    <MainLayout title='Dashboard' subtitle='Fleet overview and key metrics'>
      <div className='-my-6 -mr-6'>
        <div className='flex flex-col h-[calc(100vh-10rem)] font-ui'>
          {/* Stats Grid */}
          <div className='px-4 pt-4 flex-shrink-0'>
            {isLoading ? (
              <div className='flex items-center justify-center py-8'>
                <Loader2 size={16} className='text-muted-foreground animate-spin' />
                <span className='text-xs font-ui text-muted-foreground ml-2'>Loading dashboard...</span>
              </div>
            ) : (
              <div className='grid grid-cols-2 lg:grid-cols-4 gap-3'>
                <StatCard
                  title='Total Drones'
                  value={stats.totalDrones}
                  icon={Plane}
                  color='blue'
                  variant='hover-border'
                />
                <StatCard
                  title='Online Drones'
                  value={stats.onlineDrones}
                  icon={Wifi}
                  color='green'
                  variant='hover-border'
                />
                <StatCard
                  title='Active Missions'
                  value={stats.activeMissions}
                  icon={ListTodo}
                  color='orange'
                  variant='hover-border'
                />
                <StatCard
                  title='Total Media'
                  value={stats.totalMedia}
                  icon={Image}
                  color='purple'
                  variant='hover-border'
                />
              </div>
            )}
          </div>

          {/* Content */}
          <div className='flex-1 min-h-0 overflow-y-auto px-4 pt-4 pb-4'>
            {isLoading ? null : (
              <div className='grid grid-cols-1 lg:grid-cols-5 gap-4 h-full'>
                {/* Left: Recent Missions */}
                <div className='lg:col-span-3 flex flex-col min-h-0'>
                  <h3 className='text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2'>
                    Recent Missions
                  </h3>
                  <div className='flex-1 bg-background border border-border/50 rounded-xl overflow-hidden min-h-0'>
                    {recentMissions.length === 0 ? (
                      <div className='flex flex-col items-center justify-center py-12 text-center'>
                        <ListTodo size={16} className='text-muted-foreground' />
                        <p className='text-xs font-ui text-muted-foreground mt-2'>No missions yet</p>
                      </div>
                    ) : (
                      <div className='overflow-y-auto h-full'>
                        <table className='w-full text-xs font-ui'>
                          <thead>
                            <tr className='border-b border-border/50 text-muted-foreground'>
                              <th className='px-3 py-2.5 text-left font-medium'>Time</th>
                              <th className='px-3 py-2.5 text-left font-medium'>Name</th>
                              <th className='px-3 py-2.5 text-left font-medium'>Status</th>
                              <th className='px-3 py-2.5 text-left font-medium'>Type</th>
                              <th className='px-3 py-2.5 text-left font-medium'>Dock</th>
                            </tr>
                          </thead>
                          <tbody>
                            {recentMissions.map((task) => (
                              <tr
                                key={task.job_id}
                                className='border-b border-border/30 hover:bg-secondary/50 transition-colors'
                              >
                                <td className='px-3 py-2 text-muted-foreground whitespace-nowrap'>
                                  {formatTime(task.execute_time)}
                                </td>
                                <td className='px-3 py-2 text-muted-foreground max-w-[140px] truncate' title={task.job_name}>
                                  {task.job_name}
                                </td>
                                <td className='px-3 py-2'>
                                  <TaskStatusBadge status={task.status} />
                                </td>
                                <td className='px-3 py-2 text-muted-foreground'>
                                  {taskTypeMap[task.task_type] ?? `Type ${task.task_type}`}
                                </td>
                                <td className='px-3 py-2 text-muted-foreground max-w-[80px] truncate' title={task.dock_sn}>
                                  {task.dock_sn}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>

                {/* Right: Fleet Status + Project Info */}
                <div className='lg:col-span-2 flex flex-col gap-4 min-h-0'>
                  {/* Fleet Status */}
                  <div className='flex-1 flex flex-col min-h-0'>
                    <h3 className='text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2'>
                      Fleet Status
                    </h3>
                    <div className='flex-1 bg-background border border-border/50 rounded-xl overflow-hidden min-h-0'>
                      {droneList.length === 0 ? (
                        <div className='flex flex-col items-center justify-center py-8 text-center'>
                          <Plane size={16} className='text-muted-foreground' />
                          <p className='text-xs font-ui text-muted-foreground mt-2'>No drones registered</p>
                        </div>
                      ) : (
                        <div className='overflow-y-auto h-full'>
                          {droneList.map((drone) => (
                            <div
                              key={drone.deviceSn}
                              className='flex items-center justify-between px-3 py-2.5 border-b border-border/30 last:border-0'
                            >
                              <div className='flex items-center gap-2 min-w-0'>
                                <div className={`w-2 h-2 rounded-full shrink-0 ${drone.status ? 'bg-green-500' : 'bg-zinc-600'}`} />
                                <div className='min-w-0'>
                                  <span className='text-xs text-muted-foreground block truncate'>
                                    {drone.nickname || drone.deviceName}
                                  </span>
                                  <span className='text-[9px] text-muted-foreground block truncate'>
                                    {drone.deviceSn}
                                  </span>
                                </div>
                              </div>
                              <span className={`text-[10px] font-medium shrink-0 ml-2 ${drone.status ? 'text-green-400' : 'text-muted-foreground'}`}>
                                {drone.status ? 'Online' : 'Offline'}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Project Info */}
                  <div className='flex-shrink-0'>
                    <h3 className='text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2'>
                      Project Info
                    </h3>
                    <div className='bg-background border border-border/50 rounded-xl p-4 space-y-3'>
                      <div className='flex items-center justify-between'>
                        <span className='text-xs text-muted-foreground flex items-center gap-1.5'>
                          <FolderOpen className='w-3.5 h-3.5' />
                          Project
                        </span>
                        <span className='text-xs text-muted-foreground font-medium truncate max-w-[160px]'>
                          {activeProject.name}
                        </span>
                      </div>
                      <div className='flex items-center justify-between'>
                        <span className='text-xs text-muted-foreground flex items-center gap-1.5'>
                          <Plane className='w-3.5 h-3.5' />
                          Devices
                        </span>
                        <span className='text-xs text-muted-foreground'>
                          {activeProject.devices.length}
                        </span>
                      </div>
                      <div className='flex items-center justify-between'>
                        <span className='text-xs text-muted-foreground flex items-center gap-1.5'>
                          <Map className='w-3.5 h-3.5' />
                          Flight Areas
                        </span>
                        <span className='text-xs text-muted-foreground'>
                          {activeProject.flight_areas.length}
                        </span>
                      </div>
                      <div className='flex items-center justify-between'>
                        <span className='text-xs text-muted-foreground flex items-center gap-1.5'>
                          <ListTodo className='w-3.5 h-3.5' />
                          Total Missions
                        </span>
                        <span className='text-xs text-muted-foreground'>
                          {stats.totalTasks}
                        </span>
                      </div>
                      {stats.failedMissions > 0 && (
                        <div className='flex items-center justify-between pt-1 border-t border-border/50'>
                          <span className='text-xs text-red-400/70'>Failed Missions</span>
                          <span className='text-xs text-red-400 font-medium'>
                            {stats.failedMissions}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Wayline + AI Streams Row */}
            {!isLoading && (
              <div className='grid grid-cols-1 lg:grid-cols-2 gap-4 mt-4'>
                <WaylineOverview />
                <AIStreamsOverview />
              </div>
            )}
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
