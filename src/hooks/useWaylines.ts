'use client';

import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/providers/AuthProvider';
import { DJI_CONFIG } from '@/lib/config/config';
import { getWaylines, downloadWaylineKmz } from '@/services/djiservice-layer/dji-service';
import { parseKmzBuffer } from '@/lib/utils/parseWaylineKmz';
import type { WaypointCoord } from '@/lib/types';

/** Lists all wayline route files in the workspace. */
export function useWaylines() {
  const { user } = useAuth();
  const workspaceId = user?.workspace_id ?? DJI_CONFIG.WORKSPACE_ID;

  return useQuery({
    queryKey: ['waylines', workspaceId],
    queryFn: () => getWaylines(workspaceId, { order_by: 'update_time' }),
    staleTime: 2 * 60 * 1000,
    enabled: !!workspaceId,
    select: (data) => data.list,
  });
}

/**
 * Downloads and parses a wayline KMZ into an ordered array of GPS waypoints.
 * Caches for 10 minutes — route files rarely change.
 */
export function useWaylineRoute(waylineId: string | null) {
  const { user } = useAuth();
  const workspaceId = user?.workspace_id ?? DJI_CONFIG.WORKSPACE_ID;

  return useQuery<WaypointCoord[]>({
    queryKey: ['wayline-route', workspaceId, waylineId],
    queryFn: async () => {
      const buffer = await downloadWaylineKmz(workspaceId, waylineId!);
      return parseKmzBuffer(buffer);
    },
    enabled: !!waylineId && !!workspaceId,
    staleTime: 10 * 60 * 1000,
    retry: 1,
  });
}
