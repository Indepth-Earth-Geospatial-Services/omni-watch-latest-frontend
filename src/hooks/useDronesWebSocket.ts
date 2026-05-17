// WebSocket-based drone hook - replaces polling with real-time updates
import { useEffect, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { getAllDrones, type DroneAPIResponse } from '../services/api/drone-api';
import { DJI_CONFIG } from '../lib/dji/config';
import { getToken } from '../lib/dji/token-store';

interface UseDronesWebSocketOptions {
  subscribeToAll?: boolean;
  droneSerial?: string;
}
/**
 * Hook to fetch drones with WebSocket real-time updates
 * @param options - Configuration options
 */
export function useDronesWebSocket(options: UseDronesWebSocketOptions = { subscribeToAll: true }) {
  const [drones, setDrones] = useState<DroneAPIResponse[]>([]);
  const [rawDrones, setRawDrones] = useState<Map<string, DroneAPIResponse>>(new Map()); // Store full API data
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  // Initial fetch of all drones — skipped when DJI Cloud mode is active
  useEffect(() => {
    if (DJI_CONFIG.USE_DJI_CLOUD) {
      setIsLoading(false);
      return;
    }

    const fetchInitialDrones = async () => {
      try {
        setIsLoading(true);
        const dronesData = await getAllDrones();
        setDrones(dronesData);

        // Store raw drone data for later use (e.g., editing)
        const rawMap = new Map<string, DroneAPIResponse>();
        dronesData.forEach(drone => {
          rawMap.set(drone.deviceSerialNumber, drone);
        });
        setRawDrones(rawMap);

        setError(null);
      } catch (err) {
        setError(err as Error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchInitialDrones();
  }, []);

  // Setup WebSocket connection — skipped when DJI Cloud mode is active
  useEffect(() => {
    if (DJI_CONFIG.USE_DJI_CLOUD) return;

    // BASE_URL is the plain host:port — socket.io treats any path in the URL
    // as a namespace, which would break the handshake. Use path option instead.
    const WS_URL = DJI_CONFIG.BASE_URL;

    const socketInstance = io(WS_URL, {
      path: '/ws/events',
      auth: { token: getToken() },
      transports: ['websocket', 'polling'],
    });

    socketInstance.on('connect', () => {
      console.log('[WebSocket] Connected to drone management server');
      setIsConnected(true);

      // Subscribe based on options
      if (options.subscribeToAll) {
        socketInstance.emit('subscribe', { all: true });
      } else if (options.droneSerial) {
        socketInstance.emit('subscribe', { droneSerial: options.droneSerial });
      }
    });

    socketInstance.on('disconnect', () => {
      console.log('[WebSocket] Disconnected from server');
      setIsConnected(false);
    });

    socketInstance.on('connected', (data) => {
      console.log('[WebSocket] Server acknowledged connection:', data);
    });

    socketInstance.on('subscribed', (data) => {
      console.log('[WebSocket] Subscription confirmed:', data);
    });

    // Handle drone events
    socketInstance.on('drone:event', (event) => {
      console.log('[WebSocket] Drone event received:', event);
      handleDroneEvent(event);
    });

    socketInstance.on('error', (error) => {
      console.error('[WebSocket] Error:', error);
      setError(new Error('WebSocket connection error'));
    });

    setSocket(socketInstance);

    return () => {
      socketInstance.disconnect();
    };
  }, [options.subscribeToAll, options.droneSerial]);

  // Handle incoming drone events
  const handleDroneEvent = useCallback((event: any) => {
    // Backend sends 'event' not 'eventType'
    const eventType = event.event || event.eventType;
    const { data } = event;

    switch (eventType) {
      case 'drone.created':
        // Add new drone to the list
        setDrones((prev) => {
          const exists = prev.some(d => d.deviceSerialNumber === data.drone.deviceSerialNumber);
          if (exists) return prev;
          return [...prev, data.drone];
        });
        // Store raw drone data
        setRawDrones((prev) => {
          const updated = new Map(prev);
          updated.set(data.drone.deviceSerialNumber, data.drone);
          return updated;
        });
        break;

      case 'drone.updated':
      case 'drone.stream.status':
        // Update existing drone
        setDrones((prev) => {
          const index = prev.findIndex(d => d.deviceSerialNumber === data.serialNumber);
          if (index === -1) return prev;

          const updatedDrones = [...prev];
          // Use full data if available, otherwise merge partial changes
          if (data.full) {
            updatedDrones[index] = data.full;
          } else {
            // Merge partial updates
            const existingDrone = updatedDrones[index];
            updatedDrones[index] = {
              ...existingDrone,
              ...(data.streamIsOn !== undefined && { streamIsOn: data.streamIsOn }),
              ...(data.streamUrl && { streamUrl: data.streamUrl }),
            };
            console.log('[WebSocket] Merged partial update for:', data.serialNumber, data);
          }
          return updatedDrones;
        });
        // Update raw drone data
        if (data.full) {
          setRawDrones((prev) => {
            const updated = new Map(prev);
            updated.set(data.serialNumber, data.full);
            return updated;
          });
        }
        break;

      case 'drone.deleted':
        // Remove drone from the list
        setDrones((prev) => prev.filter(d => d.deviceSerialNumber !== data.serialNumber));
        // Remove from raw data
        setRawDrones((prev) => {
          const updated = new Map(prev);
          updated.delete(data.serialNumber);
          return updated;
        });
        break;

      default:
        console.log('[WebSocket] Unknown event type:', eventType);
    }
  }, []);

  // Manually refresh all drones (fallback if needed)
  const refresh = useCallback(async () => {
    try {
      setIsLoading(true);
      const dronesData = await getAllDrones();
      setDrones(dronesData);

      // Update raw drone data
      const rawMap = new Map<string, DroneAPIResponse>();
      dronesData.forEach(drone => {
        rawMap.set(drone.deviceSerialNumber, drone);
      });
      setRawDrones(rawMap);

      setError(null);
    } catch (err) {
      setError(err as Error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Helper to get raw drone data by serial number
  const getRawDrone = useCallback((serialNumber: string): DroneAPIResponse | undefined => {
    return rawDrones.get(serialNumber);
  }, [rawDrones]);

  return {
    drones,
    isLoading,
    error,
    isConnected,
    refresh,
    socket,
    getRawDrone,
  };
}

/**
 * Hook to fetch only active drones (streamIsOn === true) with WebSocket updates
 */
export function useActiveDronesWebSocket() {
  const { drones, isLoading, error, isConnected, refresh, socket } = useDronesWebSocket({ subscribeToAll: true });

  const activeDrones = drones.filter(drone => drone.streamIsOn);

  return {
    drones: activeDrones,
    isLoading,
    error,
    isConnected,
    refresh,
    socket,
  };
}

/**
 * Hook to subscribe to a specific drone's events
 */
export function useSingleDroneWebSocket(droneSerial: string) {
  const { drones, isLoading, error, isConnected, refresh, socket } = useDronesWebSocket({
    subscribeToAll: false,
    droneSerial
  });

  const drone = drones.find(d => d.deviceSerialNumber === droneSerial);

  return {
    drone,
    isLoading,
    error,
    isConnected,
    refresh,
    socket,
  };
}
