// Threat Detection WebSocket Types
// Backend emits these events from 136.116.89.216 via Socket.IO

/**
 * YOLO_DETECTION — Live YOLO alert (Orange Panel)
 * Emitted when the YOLO model detects an object in a video stream
 */
export interface YoloDetection {
  // Bounding box (normalized 0-1)
  x: number;
  y: number;
  width: number;
  height: number;

  // Detection metadata
  score: number;           // YOLO confidence [0,1]
  class: string;           // e.g. 'person', 'vehicle'
  trackId: number;         // IoU tracking ID
  objectKey?: string;      // MinIO crop key (relative path)

  // Media
  imageUrl: string | null; // Presigned MinIO URL (24h expiry), null if failed

  // Dual GPS coordinates
  latitude: number | null;        // Drone GPS lat (where drone was when detection occurred)
  longitude: number | null;       // Drone GPS lon
  objectLatitude: number | null;  // Detected object's GPS lat (if resolvable)
  objectLongitude: number | null; // Detected object's GPS lon (if resolvable)
}

export interface YoloDetectionEvent {
  streamId: string;
  detections: YoloDetection[];
  timestamp: number;         // Date.now()
}

/**
 * TRACK_CONFIRMED — LLM verified threat (Red Panel)
 * Emitted when Gemini LLM verifies a YOLO detection as a confirmed threat
 */
export interface TrackConfirmedDetection {
  // Bounding box
  x: number;
  y: number;
  width: number;
  height: number;

  // Detection metadata
  class: string;
  trackId: number;
  score: number;

  // LLM verification
  reasoning: string;       // Gemini LLM explanation

  // Media
  imageUrl: string | null;

  // Dual GPS coordinates
  latitude: number | null;        // Drone GPS lat
  longitude: number | null;       // Drone GPS lon
  objectLatitude: number | null;  // Object GPS lat
  objectLongitude: number | null; // Object GPS lon
}

export interface TrackConfirmedEvent {
  streamId: string;
  detections: TrackConfirmedDetection[];
  timestamp: number;
}

/**
 * Detection status after operator action
 */
export type DetectionStatus = 'pending' | 'approved' | 'dismissed';

/**
 * Unified threat detection item for the frontend threats page
 * Combines both YOLO_DETECTION and TRACK_CONFIRMED events
 */
export interface ThreatDetection {
  id: string;                    // `${streamId}-${trackId}-${timestamp}`
  streamId: string;
  trackId: number;
  type: string;                  // class name (person, vehicle, etc.)
  confidence: number;            // score
  isVerified: boolean;           // true if TRACK_CONFIRMED
  reasoning?: string;            // LLM reasoning (only for verified threats)
  status?: DetectionStatus;      // operator action status (pending/approved/dismissed)

  // Bounding box (for video overlay)
  boundingBox: {
    x: number;
    y: number;
    width: number;
    height: number;
  };

  // Media
  imageUrl: string | null;
  objectKey?: string;

  // Dual GPS
  droneLatitude: number | null;
  droneLongitude: number | null;
  objectLatitude: number | null;
  objectLongitude: number | null;

  // Timestamps
  detectedAt: Date;
  receivedAt: Date;              // When frontend received the event
}

/**
 * Real-time alert for high-confidence detections
 */
export interface DetectionAlert {
  id: string;
  detection: ThreatDetection;
  createdAt: Date;
}

/**
 * WebSocket connection status
 */
export type ThreatSocketStatus = 'connecting' | 'connected' | 'disconnected' | 'error';
