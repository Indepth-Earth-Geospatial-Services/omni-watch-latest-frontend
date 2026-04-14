// React Query hook for fetching and managing drone data
import { useQuery } from '@tanstack/react-query';
import { getAllDrones, type DroneAPIResponse } from '../services/api/drone-api';
import { WebRTCStream } from '../config/webrtc-streams';

/**
 * Transform drone API response to WebRTCStream format
 */
function transformDroneToStream(drone: DroneAPIResponse): WebRTCStream {
  const webrtcUrl = drone.webRTCUrl || '';

  // Build stream URLs
  // Clean stream (no AI): /{serial_number}
  // AI stream: /{serial_number}/ai
  const baseStreamUrl = webrtcUrl.replace('http://', 'ws://').replace('https://', 'wss://');
  const cleanStreamUrl = baseStreamUrl; // ws://localhost:6080/1581F5FJD238900D79WS
  const aiStreamUrl = drone.isUsingAiDetection && baseStreamUrl
    ? `${baseStreamUrl}/ai` // ws://localhost:6080/1581F5FJD238900D79WS/ai
    : '';

  return {
    id: drone.deviceSerialNumber,
    name: drone.deviceName,
    streamUrl: cleanStreamUrl,
    isOnline: drone.streamIsOn,
    feedType: (drone.deviceCategory as any) || 'DRONE',
    startai: drone.isUsingAiDetection,
    metadata: {
      alias: drone.metadata?.alias || drone.deviceName,
      description: drone.metadata?.description,
      aiStreamUrl: aiStreamUrl, // Add AI stream URL to metadata
      webRTCUrl: drone.webRTCUrl,
    },
  };
}

/**
 * Hook to fetch all drones with automatic polling
 * @param pollingInterval - Interval in milliseconds (default: 30000 = 30 seconds)
 */
export function useDrones(pollingInterval: number = 30000) {
  return useQuery({
    queryKey: ['drones'],
    queryFn: getAllDrones,
    refetchInterval: pollingInterval,
    refetchOnWindowFocus: true,
    staleTime: 10000, // Consider data stale after 10 seconds
    select: (drones) => {
      // Transform API drones to WebRTC stream format
      return drones.map(transformDroneToStream);
    },
  });
}

/**
 * Hook to fetch only active drones (streamIsOn === true)
 */
export function useActiveDrones(pollingInterval: number = 30000) {
  return useQuery({
    queryKey: ['drones', 'active'],
    queryFn: getAllDrones,
    refetchInterval: pollingInterval,
    refetchOnWindowFocus: true,
    staleTime: 10000,
    select: (drones) => {
      // Filter active drones and transform
      return drones
        .filter((drone) => drone.streamIsOn)
        .map(transformDroneToStream);
    },
  });
}

/**
 * Hook to fetch drones with AI detection enabled
 */
export function useAIDrones(pollingInterval: number = 30000) {
  return useQuery({
    queryKey: ['drones', 'ai-enabled'],
    queryFn: getAllDrones,
    refetchInterval: pollingInterval,
    refetchOnWindowFocus: true,
    staleTime: 10000,
    select: (drones) => {
      // Filter AI-enabled drones and transform
      return drones
        .filter((drone) => drone.isUsingAiDetection && drone.streamIsOn)
        .map(transformDroneToStream);
    },
  });
}
