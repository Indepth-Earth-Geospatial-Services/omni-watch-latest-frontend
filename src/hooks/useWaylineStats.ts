import { useMemo } from 'react';
import { useWaylines } from './useWaylines';
import { useFlightTasks } from './useFlightTasks';
import { useAuth } from '@/providers/AuthProvider';
import { DJI_CONFIG } from '@/lib/config/config';
import type { Wayline, WaylineJobItem } from '@/lib/types';

interface WaylineStats {
  totalWaylines: number;
  waylinesByType: { waypoint: number; mapping: number; oblique: number };
  lastUsedWayline: { name: string; lastUsed: string } | null;
  waylineUsageStats: Array<{ waylineId: string; name: string; usageCount: number }>;
  recentWaylines: Wayline[];
  isLoading: boolean;
}

export function useWaylineStats(): WaylineStats {
  const { user } = useAuth();
  const workspaceId = user?.workspace_id ?? DJI_CONFIG.WORKSPACE_ID;

  const { data: waylines = [], isLoading: waylinesLoading } = useWaylines();
  const { data: taskData, isLoading: tasksLoading } = useFlightTasks(workspaceId, {
    page: 1,
    page_size: 200,
  });

  const isLoading = waylinesLoading || tasksLoading;

  const stats = useMemo(() => {
    const tasks = taskData?.list ?? [];

    // Count waylines by type based on template_types
    const waylinesByType = { waypoint: 0, mapping: 0, oblique: 0 };
    waylines.forEach((wl) => {
      const types = wl.template_types ?? [];
      if (types.includes(0)) waylinesByType.waypoint++;
      if (types.includes(1)) waylinesByType.mapping++;
      if (types.includes(2)) waylinesByType.oblique++;
    });

    // Compute usage count per wayline from flight tasks
    const usageMap = new Map<string, { name: string; count: number }>();
    tasks.forEach((task: WaylineJobItem) => {
      const existing = usageMap.get(task.file_id);
      if (existing) {
        existing.count++;
      } else {
        usageMap.set(task.file_id, { name: task.file_name, count: 1 });
      }
    });

    // Sort by usage count descending
    const waylineUsageStats = Array.from(usageMap.entries())
      .map(([waylineId, { name, count }]) => ({
        waylineId,
        name,
        usageCount: count,
      }))
      .sort((a, b) => b.usageCount - a.usageCount);

    // Find most recently used wayline from tasks
    let lastUsedWayline: { name: string; lastUsed: string } | null = null;
    if (tasks.length > 0) {
      const sorted = [...tasks].sort((a, b) => {
        const timeA = a.execute_time ?? '';
        const timeB = b.execute_time ?? '';
        return timeB.localeCompare(timeA);
      });
      if (sorted[0]?.execute_time) {
        lastUsedWayline = {
          name: sorted[0].file_name,
          lastUsed: sorted[0].execute_time,
        };
      }
    }

    // Recent waylines (last 5 by update_time)
    const recentWaylines = [...waylines]
      .sort((a, b) => b.update_time - a.update_time)
      .slice(0, 5);

    return {
      totalWaylines: waylines.length,
      waylinesByType,
      lastUsedWayline,
      waylineUsageStats,
      recentWaylines,
    };
  }, [waylines, taskData]);

  return {
    ...stats,
    isLoading,
  };
}
