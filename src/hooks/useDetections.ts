import { useState, useEffect, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';

interface Detection {
  id: number;
  object_class: string;
  track_id: number;
  confidence: number;
  timestamp: string;
  device_name: string;
  device_type: string;
  bbox: {
    x1: number;
    y1: number;
    x2: number;
    y2: number;
  };
  frame_base64: string;
  created_at: string;
}

interface DetectionLogEntry {
  type: string;
  source: string;
  color: string;
  time: string;
  active: boolean;
}

interface SurveillanceStats {
  totalDetections: number;
  personDetections: number;
  vehicleDetections: number;
  objectDetections: number;
  avgConfidence: number;
  lastDetectionTime: number | null;
}

interface UseDetectionsOptions {
  url: string;
  maxLogEntries?: number;
  vehicleTypes?: string[];
  personTypes?: string[];
}

interface UseDetectionsReturn {
  stats: SurveillanceStats;
  detectionLog: DetectionLogEntry[];
  recentDetections: Detection[];
  isConnected: boolean;
  isLoading: boolean;
}

const DEFAULT_VEHICLE_TYPES = ['car', 'motorcycle', 'bus', 'truck', 'bicycle'];
const DEFAULT_PERSON_TYPES = ['person'];

export function useDetections({
  url,
  maxLogEntries = 20,
  vehicleTypes = DEFAULT_VEHICLE_TYPES,
  personTypes = DEFAULT_PERSON_TYPES,
}: UseDetectionsOptions): UseDetectionsReturn {
  const [stats, setStats] = useState<SurveillanceStats>({
    totalDetections: 0,
    personDetections: 0,
    vehicleDetections: 0,
    objectDetections: 0,
    avgConfidence: 0,
    lastDetectionTime: null,
  });

  const [detectionLog, setDetectionLog] = useState<DetectionLogEntry[]>([]);
  const [recentDetections, setRecentDetections] = useState<Detection[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const socketRef = useRef<Socket | null>(null);

  // Fetch initial detections from database on mount
  useEffect(() => {
    const fetchInitialDetections = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(`${url}/detections?limit=50`);
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.detections.length > 0) {
            console.log(`📦 Loaded ${data.detections.length} detections from database`);

            // Convert database detections to Detection format
            const detections: Detection[] = data.detections.map((d: any) => ({
              id: d.id,
              object_class: d.object_class,
              track_id: d.track_id,
              confidence: d.confidence,
              timestamp: d.timestamp,
              device_name: d.device_name,
              device_type: d.device_type,
              bbox: {
                x1: d.bbox_x1,
                y1: d.bbox_y1,
                x2: d.bbox_x2,
                y2: d.bbox_y2
              },
              frame_base64: d.frame_base64,
              created_at: d.created_at
            }));

            setRecentDetections(detections);

            // Calculate initial stats from historical data
            let personCount = 0;
            let vehicleCount = 0;
            let objectCount = 0;
            let totalConfidence = 0;

            detections.forEach(detection => {
              if (personTypes.includes(detection.object_class.toLowerCase())) {
                personCount++;
              } else if (vehicleTypes.includes(detection.object_class.toLowerCase())) {
                vehicleCount++;
              } else {
                objectCount++;
              }
              totalConfidence += detection.confidence * 100;
            });

            setStats({
              totalDetections: detections.length,
              personDetections: personCount,
              vehicleDetections: vehicleCount,
              objectDetections: objectCount,
              avgConfidence: detections.length > 0 ? totalConfidence / detections.length : 0,
              lastDetectionTime: detections.length > 0 ? new Date(detections[0].created_at).getTime() : null
            });

            // Create detection log entries from recent detections (last 20)
            const logEntries: DetectionLogEntry[] = detections.slice(0, maxLogEntries).map(detection => {
              let colorClass = 'bg-green-500';
              if (personTypes.includes(detection.object_class.toLowerCase())) {
                colorClass = 'bg-blue-500';
              } else if (vehicleTypes.includes(detection.object_class.toLowerCase())) {
                colorClass = 'bg-orange-500';
              }

              const timeAgo = getTimeAgo(new Date(detection.created_at).getTime());

              return {
                type: `${detection.object_class.charAt(0).toUpperCase() + detection.object_class.slice(1)} Detected`,
                source: `${detection.device_name} • ID: ${detection.track_id} • ${(detection.confidence * 100).toFixed(1)}% confidence`,
                color: colorClass,
                time: timeAgo,
                active: false
              };
            });

            setDetectionLog(logEntries);
          }
        }
      } catch (error) {
        console.error('❌ Error fetching initial detections:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchInitialDetections();
  }, [url, maxLogEntries, personTypes, vehicleTypes]);

  // Helper function to calculate time ago
  const getTimeAgo = (timestamp: number): string => {
    const secondsAgo = Math.floor((Date.now() - timestamp) / 1000);
    if (secondsAgo < 60) return 'Just now';
    if (secondsAgo < 3600) return `${Math.floor(secondsAgo / 60)}m ago`;
    if (secondsAgo < 86400) return `${Math.floor(secondsAgo / 3600)}h ago`;
    return `${Math.floor(secondsAgo / 86400)}d ago`;
  };

  const handleNewDetection = useCallback((detection: Detection) => {
    const { object_class, confidence, track_id, device_name } = detection;

    // Add to recent detections list
    setRecentDetections((prev) => [detection, ...prev.slice(0, 49)]); // Keep last 50

    // Update statistics
    setStats((prev) => {
      const newTotalDetections = prev.totalDetections + 1;
      let newPersonDetections = prev.personDetections;
      let newVehicleDetections = prev.vehicleDetections;
      let newObjectDetections = prev.objectDetections;

      // Categorize detection
      if (personTypes.includes(object_class.toLowerCase())) {
        newPersonDetections++;
      } else if (vehicleTypes.includes(object_class.toLowerCase())) {
        newVehicleDetections++;
      } else {
        newObjectDetections++;
      }

      // Update average confidence
      const newAvgConfidence =
        (prev.avgConfidence * prev.totalDetections + confidence * 100) / newTotalDetections;

      return {
        totalDetections: newTotalDetections,
        personDetections: newPersonDetections,
        vehicleDetections: newVehicleDetections,
        objectDetections: newObjectDetections,
        avgConfidence: newAvgConfidence,
        lastDetectionTime: Date.now(),
      };
    });

    // Add to detection log
    let colorClass = 'bg-green-500';
    if (personTypes.includes(object_class.toLowerCase())) {
      colorClass = 'bg-blue-500';
    } else if (vehicleTypes.includes(object_class.toLowerCase())) {
      colorClass = 'bg-orange-500';
    }

    const newEntry: DetectionLogEntry = {
      type: `${object_class.charAt(0).toUpperCase() + object_class.slice(1)} Detected`,
      source: `${device_name} • ID: ${track_id} • ${(confidence * 100).toFixed(1)}% confidence`,
      color: colorClass,
      time: 'Just now',
      active: true,
    };

    setDetectionLog((prev) => {
      const updated = [newEntry, ...prev.map((entry) => ({ ...entry, active: false }))];
      return updated.slice(0, maxLogEntries);
    });
  }, [personTypes, vehicleTypes, maxLogEntries]);

  useEffect(() => {
    console.log(`🔌 Connecting to Detection Socket.IO: ${url}`);

    const socket = io(url, {
      transports: ['polling', 'websocket'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
      timeout: 10000,
      forceNew: true,
    });

    socket.on('connect', () => {
      console.log('✅ Connected to detection Socket.IO server', socket.id);
      setIsConnected(true);
    });

    socket.on('new-detection', (detection: Detection) => {
      console.log('🔍 New detection received:', detection);
      handleNewDetection(detection);
    });

    socket.on('disconnect', (reason) => {
      console.log('❌ Disconnected from detection Socket.IO server:', reason);
      setIsConnected(false);
    });

    socket.on('connect_error', (err) => {
      console.error('⚠️ Socket.IO connection error:', err.message);
      setIsConnected(false);
    });

    socket.on('connect_timeout', () => {
      console.error('⚠️ Socket.IO connection timeout');
      setIsConnected(false);
    });

    socketRef.current = socket;

    // Cleanup on unmount
    return () => {
      socket.disconnect();
    };
  }, [url, handleNewDetection]);

  return {
    stats,
    detectionLog,
    recentDetections,
    isConnected,
    isLoading,
  };
}

// Export Detection type for use in other components
export type { Detection, DetectionLogEntry };
