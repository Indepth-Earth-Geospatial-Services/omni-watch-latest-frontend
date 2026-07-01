'use client';

import { useMemo } from 'react';
import { useDJIDevices } from '@/hooks/useDJIDevices';
import { ChartCard } from './ChartCard';
import { AreaChart } from './charts/AreaChart';
import { PieChart } from './charts/PieChart';
import { BarChart } from './charts/BarChart';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

export function FleetAnalyticsTab() {
  const { data: devices = [], isLoading } = useDJIDevices({ refetchInterval: 30_000 });

  const stats = useMemo(() => {
    const drones = devices.filter((d) => d.domain === '0');
    const docks = devices.filter((d) => d.domain === '1');
    const online = devices.filter((d) => d.status);

    const typeData = [
      { name: 'Drones', value: drones.length },
      { name: 'Docks', value: docks.length },
      { name: 'Other', value: devices.length - drones.length - docks.length },
    ].filter((d) => d.value > 0);

    const firmwareMap = new Map<string, number>();
    devices.forEach((d) => {
      const fw = d.firmwareVersion || 'Unknown';
      firmwareMap.set(fw, (firmwareMap.get(fw) || 0) + 1);
    });
    const firmwareData = Array.from(firmwareMap.entries())
      .map(([version, count]) => ({ version: version.slice(0, 20), count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 6);

    // Status over time: count online/offline devices by login hour
    const hourBuckets = new Map<number, { online: number; offline: number }>();
    for (let h = 0; h < 24; h++) {
      hourBuckets.set(h, { online: 0, offline: 0 });
    }
    devices.forEach((d) => {
      if (d.loginTime) {
        const dt = new Date(d.loginTime);
        if (!isNaN(dt.getTime())) {
          const hour = dt.getHours();
          const bucket = hourBuckets.get(hour);
          if (bucket) {
            if (d.status) bucket.online++;
            else bucket.offline++;
          }
        }
      }
    });
    const statusData = Array.from(hourBuckets.entries())
      .map(([hour, { online, offline }]) => ({
        hour: `${String(hour).padStart(2, '0')}:00`,
        online,
        offline,
      }));

    return { typeData, firmwareData, statusData, onlineCount: online.length, totalCount: devices.length };
  }, [devices]);

  return (
    <div className='grid grid-cols-1 lg:grid-cols-2 gap-4'>
      <ChartCard title='Device Activity by Hour' description='Online/offline devices by login hour'>
        <AreaChart
          data={stats.statusData}
          xKey='hour'
          yKeys={[
            { key: 'online', color: '#10b981', name: 'Online' },
            { key: 'offline', color: '#ef4444', name: 'Offline' },
          ]}
          height={250}
        />
      </ChartCard>

      <ChartCard title='Device Type Distribution'>
        <PieChart
          data={stats.typeData}
          colors={COLORS}
          height={250}
          centerText={String(stats.totalCount)}
        />
      </ChartCard>

      <ChartCard title='Firmware Version Distribution'>
        <BarChart
          data={stats.firmwareData}
          xKey='version'
          bars={[{ key: 'count', color: '#3b82f6', name: 'Devices' }]}
          height={250}
        />
      </ChartCard>

      <ChartCard
        title='Fleet Overview'
        description={`${stats.onlineCount} of ${stats.totalCount} devices online`}
      >
        <div className='flex items-center justify-center h-[250px]'>
          <div className='text-center'>
            <div className='text-4xl font-bold text-foreground'>{stats.totalCount}</div>
            <div className='text-sm text-muted-foreground mt-1'>Total Devices</div>
            <div className='flex items-center gap-2 mt-4 justify-center'>
              <div className='w-3 h-3 rounded-full bg-green-500' />
              <span className='text-xs text-muted-foreground'>{stats.onlineCount} Online</span>
              <div className='w-3 h-3 rounded-full bg-zinc-600 ml-2' />
              <span className='text-xs text-muted-foreground'>
                {stats.totalCount - stats.onlineCount} Offline
              </span>
            </div>
          </div>
        </div>
      </ChartCard>
    </div>
  );
}
