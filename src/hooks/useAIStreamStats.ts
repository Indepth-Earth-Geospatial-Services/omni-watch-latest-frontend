import { useMemo } from 'react';
import { useDJIDevices } from './useDJIDevices';
import { useDeviceConfigs } from './useDeviceConfig';
import { useLiveCapacity } from './useLiveStreams';
import type { DeviceConfig } from '@/lib/types';

interface AIStreamDeviceInfo {
  deviceSn: string;
  name: string;
  isActive: boolean;
}

interface AIStreamListItem {
  streamId: string;
  deviceName: string;
  status: 'active' | 'inactive';
}

interface AIStreamStats {
  totalAIConfiguredDevices: number;
  activeAIStreams: number;
  aiEnabledDevices: AIStreamDeviceInfo[];
  aiStreamsList: AIStreamListItem[];
  isLoading: boolean;
}

export function useAIStreamStats(): AIStreamStats {
  const { data: devices = [], isLoading: devicesLoading } = useDJIDevices({ refetchInterval: 30_000 });
  const { data: configs = [], isLoading: configsLoading } = useDeviceConfigs();
  const { data: capacityMap, isLoading: capacityLoading } = useLiveCapacity();

  const isLoading = devicesLoading || configsLoading || capacityLoading;

  const stats = useMemo(() => {
    // Filter configs to only AI-enabled devices
    const aiConfigs = configs.filter((c: DeviceConfig) => c.ai_enabled);

    // Map device SN to device info for quick lookup
    const deviceMap = new Map(devices.map((d) => [d.deviceSn, d]));

    // Build AI-enabled devices list
    const aiEnabledDevices: AIStreamDeviceInfo[] = aiConfigs.map((config) => {
      const device = deviceMap.get(config.device_sn);
      const isStreaming = capacityMap?.has(config.device_sn) ?? false;
      return {
        deviceSn: config.device_sn,
        name: config.name || device?.nickname || config.device_sn,
        isActive: isStreaming,
      };
    });

    // AI streams list - devices that are AI-enabled and have a streaming capacity
    const aiStreamsList: AIStreamListItem[] = aiEnabledDevices
      .filter((d) => capacityMap?.has(d.deviceSn))
      .map((d) => ({
        streamId: d.deviceSn,
        deviceName: d.name,
        status: d.isActive ? 'active' as const : 'inactive' as const,
      }));

    return {
      totalAIConfiguredDevices: aiConfigs.length,
      activeAIStreams: aiStreamsList.filter((s) => s.status === 'active').length,
      aiEnabledDevices,
      aiStreamsList,
    };
  }, [devices, configs, capacityMap]);

  return {
    ...stats,
    isLoading,
  };
}
