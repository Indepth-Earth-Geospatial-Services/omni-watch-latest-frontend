import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  fetchDeviceConfigs,
  fetchDeviceConfig,
  updateDeviceConfig,
  startAIPipeline,
  stopAIPipeline,
} from '@/lib/api/device-config';
import type { DeviceConfig } from '@/lib/types';

const deviceConfigKeys = {
  all: ['omniwatch', 'device-configs'] as const,
  list: () => ['omniwatch', 'device-configs', 'list'] as const,
  detail: (sn: string) => ['omniwatch', 'device-configs', 'detail', sn] as const,
};

export function useDeviceConfigs() {
  return useQuery({
    queryKey: deviceConfigKeys.list(),
    queryFn: fetchDeviceConfigs,
    staleTime: 30_000,
    retry: 1,
  });
}

export function useDeviceConfig(sn: string) {
  return useQuery({
    queryKey: deviceConfigKeys.detail(sn),
    queryFn: () => fetchDeviceConfig(sn),
    staleTime: 30_000,
    retry: 1,
    enabled: !!sn,
  });
}

export function useUpdateDeviceConfig() {
  const queryClient = useQueryClient();

  return useMutation<DeviceConfig, Error, { deviceSn: string; targetClasses: string; ai_enabled: boolean }>({
    mutationFn: ({ deviceSn, targetClasses, ai_enabled }) =>
      updateDeviceConfig(deviceSn, { targetClasses, ai_enabled }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: deviceConfigKeys.all });
      toast.success('Device configuration updated');
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to update device configuration');
    },
  });
}

export function useStartAI() {
  return useMutation<void, Error, { streamId: string }>({
    mutationFn: ({ streamId }) => startAIPipeline(streamId),
    onError: (error) => {
      toast.error(error.message || 'Failed to start AI pipeline');
    },
  });
}

export function useStopAI() {
  return useMutation<void, Error, { streamId: string }>({
    mutationFn: ({ streamId }) => stopAIPipeline(streamId),
    onError: (error) => {
      toast.error(error.message || 'Failed to stop AI pipeline');
    },
  });
}
