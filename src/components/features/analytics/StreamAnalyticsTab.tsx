'use client';

import { useMemo } from 'react';
import { useLiveCapacity } from '@/hooks/useLiveStreams';
import { useAIStreamStats } from '@/hooks/useAIStreamStats';
import { useDJIDevices } from '@/hooks/useDJIDevices';
import { ChartCard } from './ChartCard';
import { PieChart } from './charts/PieChart';
import { BarChart } from './charts/BarChart';
import { LineChart } from './charts/LineChart';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

export function StreamAnalyticsTab() {
  const { data: capacityMap } = useLiveCapacity();
  const { totalAIConfiguredDevices, activeAIStreams, aiEnabledDevices } = useAIStreamStats();
  const { data: devices = [] } = useDJIDevices({ refetchInterval: 30_000 });

  const stats = useMemo(() => {
    const totalCapacity = capacityMap?.size ?? 0;

    // AI pipeline usage from real data
    const aiPipelineData = [
      { name: 'AI Enabled', value: totalAIConfiguredDevices },
      { name: 'AI Disabled', value: Math.max(0, totalCapacity - totalAIConfiguredDevices) },
    ].filter((d) => d.value > 0);

    // Stream quality distribution from capacity data
    const qualityMap = new Map<string, number>();
    capacityMap?.forEach((cap) => {
      cap.cameras_list.forEach((cam) => {
        cam.videos_list.forEach((vid) => {
          const quality = vid.type || 'Unknown';
          qualityMap.set(quality, (qualityMap.get(quality) || 0) + 1);
        });
      });
    });
    const qualityData = Array.from(qualityMap.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);

    // Camera type usage from capacity data
    const cameraMap = new Map<string, number>();
    capacityMap?.forEach((cap) => {
      cap.cameras_list.forEach((cam) => {
        const type = cam.name || 'Unknown';
        cameraMap.set(type, (cameraMap.get(type) || 0) + 1);
      });
    });
    const cameraData = Array.from(cameraMap.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);

    return {
      totalCapacity,
      aiPipelineData,
      qualityData,
      cameraData,
      activeStreams: activeAIStreams,
    };
  }, [capacityMap, totalAIConfiguredDevices, activeAIStreams]);

  // Stream uptime from device login times (days since last login as proxy)
  const uptimeData = useMemo(() => {
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const dayBuckets = new Map<number, number>();
    for (let i = 0; i < 7; i++) dayBuckets.set(i, 0);

    devices.forEach((d) => {
      if (d.loginTime) {
        const dt = new Date(d.loginTime);
        if (!isNaN(dt.getTime())) {
          const day = dt.getDay();
          dayBuckets.set(day, (dayBuckets.get(day) || 0) + 1);
        }
      }
    });

    return dayNames.map((day, idx) => ({
      day,
      streams: dayBuckets.get(idx) || 0,
    }));
  }, [devices]);

  return (
    <div className='grid grid-cols-1 lg:grid-cols-2 gap-4'>
      <ChartCard title='Stream Activity by Day' description='Active streams by day of week'>
        <BarChart
          data={uptimeData}
          xKey='day'
          bars={[{ key: 'streams', color: '#3b82f6', name: 'Active Streams' }]}
          height={250}
        />
      </ChartCard>

      <ChartCard
        title='Stream Quality Distribution'
        description='Video quality levels from stream capacity'
      >
        <BarChart
          data={stats.qualityData}
          xKey='name'
          bars={[{ key: 'count', color: '#8b5cf6', name: 'Streams' }]}
          height={250}
        />
      </ChartCard>

      <ChartCard title='AI Pipeline Usage'>
        <PieChart
          data={stats.aiPipelineData}
          colors={['#10b981', '#6b7280']}
          height={250}
          centerText={String(stats.totalCapacity)}
        />
      </ChartCard>

      <ChartCard title='Camera Type Usage'>
        <PieChart
          data={stats.cameraData}
          colors={COLORS}
          height={250}
          centerText={String(stats.totalCapacity)}
        />
      </ChartCard>
    </div>
  );
}
