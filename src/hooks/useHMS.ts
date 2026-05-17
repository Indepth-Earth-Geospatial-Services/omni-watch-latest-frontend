// React Query hooks for DJI HMS (Health Monitoring System) API.
// Components import from here — never from hms-api.ts directly.
//
// Query key convention: ['dji', 'hms', workspaceId, ...]
// workspaceId is sourced from useAuth().user.workspace_id

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/providers/AuthProvider';
import { DJI_CONFIG } from '@/lib/dji/config';
import {
  getWorkspaceHMS,
  markHMSRead,
  getDeviceHMSUnread,
} from '@/lib/dji/hms-api';

// ─── Query key factory ────────────────────────────────────────────────────────

const hmsKeys = (workspaceId: string) => ({
  all:        ['dji', 'hms', workspaceId] as const,
  workspace:  ['dji', 'hms', workspaceId, 'workspace'] as const,
  device:     (deviceSn: string) => ['dji', 'hms', workspaceId, 'device', deviceSn] as const,
});

// ─── Read hooks ───────────────────────────────────────────────────────────────

/**
 * Fetches all HMS health/error messages for every device in the workspace.
 * Refetches every 30 seconds — alerts can appear at any time.
 *
 * @example
 * const { data, isLoading } = useWorkspaceHMS();
 * const messages = data?.list ?? [];
 */
export function useWorkspaceHMS() {
  const { user } = useAuth();
  const workspaceId = user?.workspace_id ?? DJI_CONFIG.WORKSPACE_ID;

  return useQuery({
    queryKey:        hmsKeys(workspaceId).workspace,
    queryFn:         () => getWorkspaceHMS(workspaceId),
    enabled:         !!workspaceId,
    refetchInterval: 30_000,
    staleTime:       15_000,
  });
}

/**
 * Fetches only unread HMS messages for a single device.
 * Disabled until a deviceSn is provided.
 * Refetches every 30 seconds.
 *
 * @example
 * const { data: unread = [] } = useDeviceHMSUnread(device.device_sn);
 */
export function useDeviceHMSUnread(deviceSn?: string) {
  const { user } = useAuth();
  const workspaceId = user?.workspace_id ?? DJI_CONFIG.WORKSPACE_ID;

  return useQuery({
    queryKey:        hmsKeys(workspaceId).device(deviceSn ?? ''),
    queryFn:         () => getDeviceHMSUnread(workspaceId, deviceSn!),
    enabled:         !!workspaceId && !!deviceSn,
    refetchInterval: 30_000,
    staleTime:       15_000,
  });
}

// ─── Mutation hooks ───────────────────────────────────────────────────────────

/**
 * Marks all HMS messages for a device as read.
 * On success: invalidates workspace HMS and the specific device unread query.
 *
 * @example
 * const { mutate: markRead } = useMarkHMSRead();
 * markRead(device.device_sn);
 */
export function useMarkHMSRead() {
  const { user } = useAuth();
  const workspaceId = user?.workspace_id ?? DJI_CONFIG.WORKSPACE_ID;
  const queryClient = useQueryClient();

  return useMutation<void, Error, string>({
    mutationFn: (deviceSn) => markHMSRead(workspaceId, deviceSn),
    onSuccess: (_data, deviceSn) => {
      const keys = hmsKeys(workspaceId);
      queryClient.invalidateQueries({ queryKey: keys.workspace });
      queryClient.invalidateQueries({ queryKey: keys.device(deviceSn) });
    },
  });
}
