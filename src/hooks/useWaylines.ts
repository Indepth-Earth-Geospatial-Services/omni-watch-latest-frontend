'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/providers/AuthProvider';
import { DJI_CONFIG } from '@/lib/config/config';
import { getToken } from '@/lib/config/token-store';
import {
  getWaylines,
  downloadWaylineKmz,
  deleteWaylineFile,
  uploadWaylineKmz,
} from '@/services/djiservice-layer/dji-service';
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

/** Deletes a wayline file from the workspace and invalidates the list cache. */
export function useDeleteWayline() {
  const { user } = useAuth();
  const workspaceId = user?.workspace_id ?? DJI_CONFIG.WORKSPACE_ID;
  const queryClient = useQueryClient();

  return useMutation<void, Error, string>({
    mutationFn: (waylineId) => deleteWaylineFile(workspaceId, waylineId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['waylines', workspaceId] });
    },
  });
}

/** Downloads a wayline KMZ file via the server-side proxy (avoids CORS). */
export function useDownloadWayline() {
  const { user } = useAuth();
  const workspaceId = user?.workspace_id ?? DJI_CONFIG.WORKSPACE_ID;

  return useMutation<void, Error, { waylineId: string; fileName: string }>({
    mutationFn: async ({ waylineId, fileName }) => {
      const token = getToken() ?? '';
      const name = fileName.endsWith('.kmz') ? fileName : `${fileName}.kmz`;
      const params = new URLSearchParams({ workspaceId, waylineId, fileName: name });

      const res = await fetch(`/api/wayline/download?${params}`, {
        headers: { 'x-auth-token': token },
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
        throw new Error(body.error || `Download failed (${res.status})`);
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    },
  });
}

/** Uploads a KMZ wayline file and invalidates the waylines list cache. */
export function useUploadWayline() {
  const { user } = useAuth();
  const workspaceId = user?.workspace_id ?? DJI_CONFIG.WORKSPACE_ID;
  const queryClient = useQueryClient();

  return useMutation<void, Error, File>({
    mutationFn: (file) => uploadWaylineKmz(workspaceId, file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['waylines', workspaceId] });
    },
  });
}
