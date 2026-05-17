// React Query hook for fetching and managing drone data
import { useQuery } from '@tanstack/react-query';
import { getAllDrones, type DroneAPIResponse } from '../services/api/drone-api';
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
      // Filter active drones
      return drones.filter((drone) => drone.streamIsOn);
    },
  });
}
