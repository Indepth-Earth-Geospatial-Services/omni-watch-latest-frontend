// WebSocket-based drone hook - replaces polling with real-time updates
import { useEffect, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { getAllDrones, type DroneAPIResponse } from '../services/api/drone-api';
import { WebRTCStream } from '../config/webrtc-streams';

/**
 * Transform drone API response to WebRTCStream format
 */
function transformDroneToStream(drone: DroneAPIResponse): WebRTCStream {
  const webrtcUrl = drone.webRTCUrl || '';

  // Build stream URLs
  const baseStreamUrl = webrtcUrl.replace('http://', 'ws://').replace('https://', 'wss://');
  const cleanStreamUrl = baseStreamUrl;
  const aiStreamUrl = drone.isUsingAiDetection && baseStreamUrl
    ? `${baseStreamUrl}/ai`
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
      aiStreamUrl: aiStreamUrl,
      webRTCUrl: drone.webRTCUrl,
    },
  };
}

interface UseDronesWebSocketOptions {
  subscribeToAll?: boolean;
  droneSerial?: string;
}

/**
 * Hook to fetch drones with WebSocket real-time updates
 * @param options - Configuration options
 */
export function useDronesWebSocket(options: UseDronesWebSocketOptions = { subscribeToAll: true }) {
  const [drones, setDrones] = useState<WebRTCStream[]>([]);
  const [rawDrones, setRawDrones] = useState<Map<string, DroneAPIResponse>>(new Map()); // Store full API data
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  // Initial fetch of all drones
  useEffect(() => {
    const fetchInitialDrones = async () => {
      try {
        setIsLoading(true);
        const dronesData = await getAllDrones();
        setDrones(dronesData.map(transformDroneToStream));

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

  // Setup WebSocket connection
  useEffect(() => {
    const WS_URL = process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:5000';

    const socketInstance = io(WS_URL, {
      path: '/ws/events',
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
          const exists = prev.some(d => d.id === data.drone.deviceSerialNumber);
          if (exists) return prev;
          return [...prev, transformDroneToStream(data.drone)];
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
      case 'drone.ai.detection.toggled':
      case 'drone.detection.classes.changed':
        // Update existing drone
        setDrones((prev) => {
          const index = prev.findIndex(d => d.id === data.serialNumber);
          if (index === -1) return prev;

          const updatedDrones = [...prev];
          // Use full data if available, otherwise merge partial changes
          if (data.full) {
            updatedDrones[index] = transformDroneToStream(data.full);
          } else {
            // Merge partial updates (e.g., streamIsOn, streamUrl, isUsingAiDetection)
            const existingDrone = updatedDrones[index];
            updatedDrones[index] = {
              ...existingDrone,
              ...(data.streamIsOn !== undefined && { isOnline: data.streamIsOn }),
              ...(data.streamUrl && { streamUrl: data.streamUrl }),
              ...(data.isUsingAiDetection !== undefined && { startai: data.isUsingAiDetection }),
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
        setDrones((prev) => prev.filter(d => d.id !== data.serialNumber));
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
      setDrones(dronesData.map(transformDroneToStream));

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
    getRawDrone, // NEW: Get full drone data without API call
  };
}

/**
 * Hook to fetch only active drones (streamIsOn === true) with WebSocket updates
 */
export function useActiveDronesWebSocket() {
  const { drones, isLoading, error, isConnected, refresh, socket } = useDronesWebSocket({ subscribeToAll: true });

  const activeDrones = drones.filter(drone => drone.isOnline);

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
 * Hook to fetch drones with AI detection enabled with WebSocket updates
 */
export function useAIDronesWebSocket() {
  const { drones, isLoading, error, isConnected, refresh, socket } = useDronesWebSocket({ subscribeToAll: true });

  const aiDrones = drones.filter(drone => drone.startai && drone.isOnline);

  return {
    drones: aiDrones,
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

  const drone = drones.find(d => d.id === droneSerial);

  return {
    drone,
    isLoading,
    error,
    isConnected,
    refresh,
    socket,
  };
}
