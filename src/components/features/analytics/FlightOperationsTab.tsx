'use client';

import { useMemo } from 'react';
import { useFlightTasks } from '@/hooks/useFlightTasks';
import { useAuth } from '@/providers/AuthProvider';
import { DJI_CONFIG } from '@/lib/config/config';
import { ChartCard } from './ChartCard';
import { PieChart } from './charts/PieChart';
import { BarChart } from './charts/BarChart';

const STATUS_COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#6b7280', '#8b5cf6'];
const TYPE_COLORS = ['#3b82f6', '#10b981', '#f59e0b'];

export function FlightOperationsTab() {
  const { user } = useAuth();
  const workspaceId = user?.workspace_id ?? DJI_CONFIG.WORKSPACE_ID;
  const { data: taskData, isLoading: tasksLoading } = useFlightTasks(workspaceId, {
    page: 1,
    page_size: 200,
  });

  const stats = useMemo(() => {
    const tasks = taskData?.list ?? [];

    // Mission success rate
    const complete = tasks.filter((t) => t.status === 2).length;
    const failed = tasks.filter((t) => t.status === 3).length;
    const cancelled = tasks.filter((t) => t.status === 5).length;
    const pending = tasks.filter((t) => t.status === 0).length;
    const inProgress = tasks.filter((t) => t.status === 1).length;
    const paused = tasks.filter((t) => t.status === 4).length;

    const statusData = [
      { name: 'Complete', value: complete },
      { name: 'Failed', value: failed },
      { name: 'Cancelled', value: cancelled },
      { name: 'Pending', value: pending },
      { name: 'In Progress', value: inProgress },
      { name: 'Paused', value: paused },
    ].filter((d) => d.value > 0);

    // Missions by type
    const typeMap = new Map<number, number>();
    tasks.forEach((t) => {
      typeMap.set(t.task_type, (typeMap.get(t.task_type) || 0) + 1);
    });
    const typeLabels: Record<number, string> = { 0: 'Immediate', 1: 'Timed', 2: 'Conditional' };
    const typeData = Array.from(typeMap.entries())
      .map(([type, count]) => ({ name: typeLabels[type] ?? `Type ${type}`, value: count }))
      .sort((a, b) => b.value - a.value);

    // Top 10 waylines by usage count from tasks
    const usageMap = new Map<string, { name: string; count: number }>();
    tasks.forEach((t) => {
      const existing = usageMap.get(t.file_id);
      if (existing) {
        existing.count++;
      } else {
        usageMap.set(t.file_id, { name: t.file_name, count: 1 });
      }
    });
    const topWaylines = Array.from(usageMap.entries())
      .map(([id, { name, count }]) => ({ name: (name ?? 'Unknown').slice(0, 20), uses: count }))
      .sort((a, b) => b.uses - a.uses)
      .slice(0, 10);

    // Missions per day from actual task execute_time
    const dayBuckets = new Map<string, number>();
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    tasks.forEach((t) => {
      if (t.execute_time) {
        const d = new Date(t.execute_time);
        if (!isNaN(d.getTime())) {
          const key = dayNames[d.getDay()];
          dayBuckets.set(key, (dayBuckets.get(key) || 0) + 1);
        }
      }
    });
    const missionsPerDay = dayNames.map((day) => ({
      day,
      missions: dayBuckets.get(day) || 0,
    }));

    return { statusData, typeData, topWaylines, missionsPerDay, totalMissions: tasks.length };
  }, [taskData]);

  if (tasksLoading) {
    return (
      <div className='grid grid-cols-1 lg:grid-cols-2 gap-4'>
        {Array.from({ length: 4 }).map((_, i) => (
          <ChartCard key={i} title='Loading...' isLoading>
            <div />
          </ChartCard>
        ))}
      </div>
    );
  }

  return (
    <div className='grid grid-cols-1 lg:grid-cols-2 gap-4'>
      <ChartCard title='Mission Success Rate'>
        <PieChart
          data={stats.statusData}
          colors={STATUS_COLORS}
          height={250}
          centerText={String(stats.totalMissions)}
        />
      </ChartCard>

      <ChartCard title='Missions Per Day'>
        <BarChart
          data={stats.missionsPerDay}
          xKey='day'
          bars={[{ key: 'missions', color: '#3b82f6', name: 'Missions' }]}
          height={250}
        />
      </ChartCard>

      <ChartCard title='Wayline Usage Ranking' description='Top 10 most used waylines'>
        <BarChart
          data={stats.topWaylines}
          xKey='name'
          bars={[{ key: 'uses', color: '#10b981', name: 'Uses' }]}
          height={250}
          layout='vertical'
        />
      </ChartCard>

      <ChartCard title='Task Type Breakdown'>
        <PieChart
          data={stats.typeData}
          colors={TYPE_COLORS}
          height={250}
          centerText={String(stats.totalMissions)}
        />
      </ChartCard>
    </div>
  );
}
