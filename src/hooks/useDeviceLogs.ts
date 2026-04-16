// React Query hooks for DJI device log API.
// Components import from here — never from device-logs-api.ts directly.
//
// Query key convention: ['dji', 'logs', workspaceId, deviceSn]
// workspaceId is sourced from useAuth().user.workspace_id

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/providers/AuthProvider';
import { DJI_CONFIG } from '@/lib/dji/config';
import {
  getUploadedLogs,
  triggerLogUpload,
  cancelLogUpload,
  deleteLogFile,
} from '@/lib/dji/device-logs-api';
import type { TriggerLogUploadRequest } from '@/lib/types';

// ─── Query key factory ────────────────────────────────────────────────────────

const logKeys = (workspaceId: string) => ({
  all:      ['dji', 'logs', workspaceId] as const,
  uploaded: (deviceSn: string) => ['dji', 'logs', workspaceId, deviceSn, 'uploaded'] as const,
});

// ─── Read hooks ───────────────────────────────────────────────────────────────

/**
 * Fetches all log files already uploaded from a device.
 * Disabled until a deviceSn is provided.
 * Refetches every 30 seconds — upload status changes during an active upload.
 *
 * @example
 * const { data: logs = [], isLoading } = useUploadedLogs(device.device_sn);
 */
export function useUploadedLogs(deviceSn?: string) {
  const { user } = useAuth();
  const workspaceId = user?.workspace_id ?? DJI_CONFIG.WORKSPACE_ID;

  return useQuery({
    queryKey:        logKeys(workspaceId).uploaded(deviceSn ?? ''),
    queryFn:         () => getUploadedLogs(workspaceId, deviceSn!),
    enabled:         !!workspaceId && !!deviceSn,
    refetchInterval: 30_000,
    staleTime:       15_000,
  });
}

// ─── Mutation hooks ───────────────────────────────────────────────────────────

/**
 * Triggers a log upload from a device for the specified modules.
 * On success: invalidates the uploaded logs list so the new upload appears.
 *
 * @example
 * const { mutate: trigger } = useTriggerLogUpload();
 * trigger({ deviceSn: 'SN001', payload: { logs_info: [{ device_sn: 'SN001', list: [{ module: 1 }] }] } });
 */
export function useTriggerLogUpload() {
  const { user } = useAuth();
  const workspaceId = user?.workspace_id ?? DJI_CONFIG.WORKSPACE_ID;
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      deviceSn,
      payload,
    }: {
      deviceSn: string;
      payload: TriggerLogUploadRequest;
    }) => triggerLogUpload(workspaceId, deviceSn, payload),
    onSuccess: (_data, { deviceSn }) => {
      queryClient.invalidateQueries({ queryKey: logKeys(workspaceId).uploaded(deviceSn) });
    },
  });
}

/**
 * Cancels an in-progress log upload from a device.
 * On success: invalidates the uploaded logs list.
 *
 * @example
 * const { mutate: cancel } = useCancelLogUpload();
 * cancel('SN001');
 */
export function useCancelLogUpload() {
  const { user } = useAuth();
  const workspaceId = user?.workspace_id ?? DJI_CONFIG.WORKSPACE_ID;
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (deviceSn: string) => cancelLogUpload(workspaceId, deviceSn),
    onSuccess: (_data, deviceSn) => {
      queryClient.invalidateQueries({ queryKey: logKeys(workspaceId).uploaded(deviceSn) });
    },
  });
}

/**
 * Deletes a specific uploaded log record by ID.
 * On success: invalidates the uploaded logs list.
 *
 * @example
 * const { mutate: remove } = useDeleteLogFile();
 * remove({ deviceSn: 'SN001', logsId: 'log-uuid' });
 */
export function useDeleteLogFile() {
  const { user } = useAuth();
  const workspaceId = user?.workspace_id ?? DJI_CONFIG.WORKSPACE_ID;
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ deviceSn, logsId }: { deviceSn: string; logsId: string }) =>
      deleteLogFile(workspaceId, deviceSn, logsId),
    onSuccess: (_data, { deviceSn }) => {
      queryClient.invalidateQueries({ queryKey: logKeys(workspaceId).uploaded(deviceSn) });
    },
  });
}
