import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  getWaylineJobs,
  createFlightTask,
  deleteFlightTask,
  updateFlightTaskStatus,
  uploadMediaNow,
} from '@/services/djiservice-layer/dji-service';
import type { WaylineJobListResponse, CreateFlightTask } from '@/lib/types';

// ─── Query key factory ────────────────────────────────────────────────────────

export const flightTaskKeys = {
  all: ['omniwatch', 'flightTasks'] as const,
  list: (workspaceId: string, params?: { page?: number; page_size?: number }) =>
    ['omniwatch', 'flightTasks', 'list', workspaceId, params ?? {}] as const,
  detail: (jobId: string) => ['omniwatch', 'flightTasks', 'detail', jobId] as const,
};

// ─── Read hooks ───────────────────────────────────────────────────────────────

export function useFlightTasks(
  workspaceId: string,
  params?: { page?: number; page_size?: number }
) {
  return useQuery<WaylineJobListResponse>({
    queryKey: flightTaskKeys.list(workspaceId, params),
    queryFn: () => getWaylineJobs(workspaceId, params),
    staleTime: 30_000,
    retry: 1,
    enabled: !!workspaceId,
  });
}

// ─── Mutation hooks ───────────────────────────────────────────────────────────

export function useCreateFlightTask() {
  const queryClient = useQueryClient();

  return useMutation<void, Error, { workspaceId: string; body: CreateFlightTask }>({
    mutationFn: ({ workspaceId, body }) => createFlightTask(workspaceId, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: flightTaskKeys.all });
    },
  });
}

export function useDeleteFlightTask() {
  const queryClient = useQueryClient();

  return useMutation<void, Error, { workspaceId: string; jobId: string }>({
    mutationFn: ({ workspaceId, jobId }) => deleteFlightTask(workspaceId, jobId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: flightTaskKeys.all });
    },
  });
}

export function useUpdateTaskStatus() {
  const queryClient = useQueryClient();

  return useMutation<void, Error, { workspaceId: string; jobId: string; status: number }>({
    mutationFn: ({ workspaceId, jobId, status }) =>
      updateFlightTaskStatus(workspaceId, jobId, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: flightTaskKeys.all });
    },
  });
}

export function useUploadMediaNow() {
  const queryClient = useQueryClient();

  return useMutation<void, Error, { workspaceId: string; jobId: string }>({
    mutationFn: ({ workspaceId, jobId }) => uploadMediaNow(workspaceId, jobId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: flightTaskKeys.all });
    },
  });
}
