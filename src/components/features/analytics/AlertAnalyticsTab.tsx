'use client';

import { useMemo } from 'react';
import { useDetections } from '@/hooks/useDetections';
import { ChartCard } from './ChartCard';
import { AreaChart } from './charts/AreaChart';
import { PieChart } from './charts/PieChart';
import { BarChart } from './charts/BarChart';

const STATUS_COLORS = ['#f59e0b', '#10b981', '#ef4444'];

export function AlertAnalyticsTab() {
  const { detections, isLoading } = useDetections({});

  const stats = useMemo(() => {
    // Alert status distribution
    const statusMap = new Map<string, number>();
    detections.forEach((d) => {
      const status = d.status ?? 'pending';
      statusMap.set(status, (statusMap.get(status) || 0) + 1);
    });
    const statusData = [
      { name: 'Pending', value: statusMap.get('pending') ?? 0 },
      { name: 'Approved', value: statusMap.get('approved') ?? 0 },
      { name: 'Dismissed', value: statusMap.get('dismissed') ?? 0 },
    ].filter((d) => d.value > 0);

    // Alerts by threat type
    const typeMap = new Map<string, number>();
    detections.forEach((d) => {
      typeMap.set(d.type, (typeMap.get(d.type) || 0) + 1);
    });
    const typeData = Array.from(typeMap.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);

    // Response time distribution from actual detection timestamps
    const responseBuckets = [
      { range: '<1s', count: 0 },
      { range: '1-5s', count: 0 },
      { range: '5-15s', count: 0 },
      { range: '15-30s', count: 0 },
      { range: '>30s', count: 0 },
    ];
    detections.forEach((d) => {
      const diff = (d.receivedAt.getTime() - d.detectedAt.getTime()) / 1000;
      if (diff < 1) responseBuckets[0].count++;
      else if (diff < 5) responseBuckets[1].count++;
      else if (diff < 15) responseBuckets[2].count++;
      else if (diff < 30) responseBuckets[3].count++;
      else responseBuckets[4].count++;
    });

    // Alerts over time bucketed by day (last 30 days)
    const dayBuckets = new Map<string, number>();
    const now = new Date();
    for (let i = 29; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const key = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      dayBuckets.set(key, 0);
    }
    detections.forEach((d) => {
      const key = d.detectedAt.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      if (dayBuckets.has(key)) {
        dayBuckets.set(key, (dayBuckets.get(key) || 0) + 1);
      }
    });
    const alertsOverTime = Array.from(dayBuckets.entries()).map(([day, alerts]) => ({ day, alerts }));

    // Hourly alert pattern
    const hourBuckets = new Map<number, number>();
    for (let h = 0; h < 24; h++) hourBuckets.set(h, 0);
    detections.forEach((d) => {
      const h = d.detectedAt.getHours();
      hourBuckets.set(h, (hourBuckets.get(h) || 0) + 1);
    });
    const hourlyPattern = Array.from(hourBuckets.entries())
      .map(([hour, alerts]) => ({ hour: `${String(hour).padStart(2, '0')}:00`, alerts }));

    return { statusData, typeData, responseBuckets, alertsOverTime, hourlyPattern, totalAlerts: detections.length };
  }, [detections]);

  return (
    <div className='grid grid-cols-1 lg:grid-cols-2 gap-4'>
      <ChartCard title='Alerts Over Time' description='Last 30 days'>
        <AreaChart
          data={stats.alertsOverTime}
          xKey='day'
          yKeys={[{ key: 'alerts', color: '#ef4444', name: 'Alerts' }]}
          height={250}
        />
      </ChartCard>

      <ChartCard title='Alert Status Distribution'>
        <PieChart
          data={stats.statusData}
          colors={STATUS_COLORS}
          height={250}
          centerText={String(stats.totalAlerts)}
        />
      </ChartCard>

      <ChartCard title='Alerts by Threat Type'>
        <BarChart
          data={stats.typeData}
          xKey='name'
          bars={[{ key: 'value', color: '#ef4444', name: 'Alerts' }]}
          height={250}
        />
      </ChartCard>

      <ChartCard title='Hourly Alert Pattern' description='Alerts by hour of day'>
        <BarChart
          data={stats.hourlyPattern}
          xKey='hour'
          bars={[{ key: 'alerts', color: '#f59e0b', name: 'Alerts' }]}
          height={250}
        />
      </ChartCard>
    </div>
  );
}
