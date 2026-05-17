// React Query hooks for DJI device log API.
// Components import from here — never from device-logs-api.ts directly.
//
// Query key convention: ['dji', 'logs', workspaceId, deviceSn, ...]

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/providers/AuthProvider';
import { DJI_CONFIG } from '@/lib/config/config';
import {
  getDeviceLogs,
  getUploadedLogs,
  triggerLogUpload,
  cancelLogUpload,
  deleteLogFile,
} from '@/services/djiservice-layer/dji-service';
import type {
  TriggerLogUploadRequest,
  CancelLogUploadRequest,
  DeviceLogsQueryParams,
  UploadedLogsQueryParams,
} from '@/lib/types';

// ─── Query key factory ────────────────────────────────────────────────────────

const logKeys = (workspaceId: string) => ({
  all: ['dji', 'logs', workspaceId] as const,
  modules: (deviceSn: string) => ['dji', 'logs', workspaceId, deviceSn, 'modules'] as const,
  uploaded: (deviceSn: string) => ['dji', 'logs', workspaceId, deviceSn, 'uploaded'] as const,
});

// ─── Read hooks ───────────────────────────────────────────────────────────────

/**
 * Fetches the available log modules on a device (what can be requested for upload).
 * Pass domainList to filter — defaults to ["0"] (flight controller).
 *
 * @example
 * const { data: modules = [] } = useDeviceLogs(device.deviceSn);
 */
export function useDeviceLogs(
  deviceSn?: string,
  params: DeviceLogsQueryParams = { domain_list: ['0'] }
) {
  const { user } = useAuth();
  const workspaceId = user?.workspace_id ?? DJI_CONFIG.WORKSPACE_ID;

  return useQuery({
    queryKey: logKeys(workspaceId).modules(deviceSn ?? ''),
    queryFn: () => getDeviceLogs(workspaceId, deviceSn!, params),
    enabled: !!workspaceId && !!deviceSn,
    retry: false,
    staleTime: 30_000,
  });
}

/**
 * Fetches all log files already uploaded from a device.
 * Refetches every 30 seconds — upload status changes during an active upload.
 *
 * @example
 * const { data: logs = [], isLoading } = useUploadedLogs(device.deviceSn);
 */
export function useUploadedLogs(deviceSn?: string, params?: UploadedLogsQueryParams) {
  const { user } = useAuth();
  const workspaceId = user?.workspace_id ?? DJI_CONFIG.WORKSPACE_ID;

  return useQuery({
    queryKey: logKeys(workspaceId).uploaded(deviceSn ?? ''),
    queryFn: () => getUploadedLogs(workspaceId, deviceSn!, params),
    enabled: !!workspaceId && !!deviceSn,
    retry: false,
    refetchInterval: 30_000,
    staleTime: 15_000,
  });
}

// ─── Mutation hooks ───────────────────────────────────────────────────────────

/**
 * Triggers a log upload from a device for the specified modules.
 * On success: invalidates the uploaded logs list.
 *
 * @example
 * const { mutate: trigger } = useTriggerLogUpload();
 * trigger({ deviceSn: 'SN001', payload: { logsInformation: '...', happenTime: Date.now(), files: [] } });
 */
export function useTriggerLogUpload() {
  const { user } = useAuth();
  const workspaceId = user?.workspace_id ?? DJI_CONFIG.WORKSPACE_ID;
  const queryClient = useQueryClient();

  return useMutation<void, Error, { deviceSn: string; payload: TriggerLogUploadRequest }>({
    mutationFn: ({ deviceSn, payload }) => triggerLogUpload(workspaceId, deviceSn, payload),
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
 * cancel({ deviceSn: 'SN001', payload: { moduleList: ['0'], status: 'cancel' } });
 */
export function useCancelLogUpload() {
  const { user } = useAuth();
  const workspaceId = user?.workspace_id ?? DJI_CONFIG.WORKSPACE_ID;
  const queryClient = useQueryClient();

  return useMutation<void, Error, { deviceSn: string; payload: CancelLogUploadRequest }>({
    mutationFn: ({ deviceSn, payload }) => cancelLogUpload(workspaceId, deviceSn, payload),
    onSuccess: (_data, { deviceSn }) => {
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

  return useMutation<void, Error, { deviceSn: string; logsId: string }>({
    mutationFn: ({ deviceSn, logsId }) => deleteLogFile(workspaceId, deviceSn, logsId),
    onSuccess: (_data, { deviceSn }) => {
      queryClient.invalidateQueries({ queryKey: logKeys(workspaceId).uploaded(deviceSn) });
    },
  });
}
