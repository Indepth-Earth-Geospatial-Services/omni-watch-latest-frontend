'use client';

import { useMemo } from 'react';
import { useDetections } from '@/hooks/useDetections';
import { ChartCard } from './ChartCard';
import { AreaChart } from './charts/AreaChart';
import { PieChart } from './charts/PieChart';
import { BarChart } from './charts/BarChart';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

export function AIDetectionAnalyticsTab() {
  const { detections, isLoading } = useDetections({});

  const stats = useMemo(() => {
    // Threat type distribution
    const typeMap = new Map<string, number>();
    detections.forEach((d) => {
      typeMap.set(d.type, (typeMap.get(d.type) || 0) + 1);
    });
    const typeData = Array.from(typeMap.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);

    // Confidence distribution
    const confidenceBuckets = [
      { range: '0-20%', count: 0 },
      { range: '20-40%', count: 0 },
      { range: '40-60%', count: 0 },
      { range: '60-80%', count: 0 },
      { range: '80-100%', count: 0 },
    ];
    detections.forEach((d) => {
      const idx = Math.min(Math.floor(d.confidence * 5), 4);
      confidenceBuckets[idx].count++;
    });

    // Verified vs raw
    const verified = detections.filter((d) => d.isVerified).length;
    const raw = detections.length - verified;

    // Detections over time bucketed by hour
    const hourBuckets = new Map<number, { detections: number; verified: number }>();
    for (let h = 0; h < 24; h++) {
      hourBuckets.set(h, { detections: 0, verified: 0 });
    }
    detections.forEach((d) => {
      const hour = d.detectedAt.getHours();
      const bucket = hourBuckets.get(hour);
      if (bucket) {
        bucket.detections++;
        if (d.isVerified) bucket.verified++;
      }
    });
    const timeData = Array.from(hourBuckets.entries())
      .map(([hour, data]) => ({
        hour: `${String(hour).padStart(2, '0')}:00`,
        ...data,
      }));

    return {
      typeData,
      confidenceBuckets,
      verifiedData: [
        { name: 'Verified (LLM)', value: verified },
        { name: 'Raw (YOLO)', value: raw },
      ].filter((d) => d.value > 0),
      timeData,
      totalDetections: detections.length,
    };
  }, [detections]);

  return (
    <div className='grid grid-cols-1 lg:grid-cols-2 gap-4'>
      <ChartCard title='Detections by Hour' description='Detection activity throughout the day'>
        <AreaChart
          data={stats.timeData}
          xKey='hour'
          yKeys={[
            { key: 'detections', color: '#3b82f6', name: 'Detections' },
            { key: 'verified', color: '#10b981', name: 'Verified' },
          ]}
          height={250}
        />
      </ChartCard>

      <ChartCard title='Threat Type Distribution'>
        <PieChart
          data={stats.typeData}
          colors={COLORS}
          height={250}
          centerText={String(stats.totalDetections)}
        />
      </ChartCard>

      <ChartCard title='Confidence Distribution'>
        <BarChart
          data={stats.confidenceBuckets}
          xKey='range'
          bars={[{ key: 'count', color: '#8b5cf6', name: 'Detections' }]}
          height={250}
        />
      </ChartCard>

      <ChartCard title='Verified vs Raw Detections'>
        <PieChart
          data={stats.verifiedData}
          colors={['#10b981', '#f59e0b']}
          height={250}
          centerText={String(stats.totalDetections)}
        />
      </ChartCard>
    </div>
  );
}
