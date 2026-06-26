import type {
  ThreatDetection,
  DetectionAlert,
  ThreatSocketStatus,
  YoloDetectionEvent,
  TrackConfirmedEvent,
} from '@/lib/types/threats';

const MAX_DETECTIONS = 200;
const MAX_ALERTS = 5;
const ALERT_CONFIDENCE_THRESHOLD = 0.85;

export interface DetectionState {
  detections: ThreatDetection[];
  alerts: DetectionAlert[];
  soundEnabled: boolean;
  status: ThreatSocketStatus;
}

export type DetectionAction =
  | { type: 'SET_STATUS'; payload: ThreatSocketStatus }
  | { type: 'ADD_YOLO_DETECTIONS'; payload: YoloDetectionEvent }
  | { type: 'ADD_TRACK_CONFIRMED'; payload: TrackConfirmedEvent }
  | { type: 'CLEAR_ALERT'; payload: string }
  | { type: 'TOGGLE_SOUND' }
  | { type: 'DISMISS_ALERT'; payload: string };

function buildDetectionFromYolo(
  event: YoloDetectionEvent,
  det: YoloDetectionEvent['detections'][number]
): ThreatDetection {
  return {
    id: `${event.streamId}-${det.trackId}-${event.timestamp}`,
    streamId: event.streamId,
    trackId: det.trackId,
    type: det.class,
    confidence: det.score,
    isVerified: false,
    boundingBox: { x: det.x, y: det.y, width: det.width, height: det.height },
    imageUrl: det.imageUrl,
    objectKey: det.objectKey,
    droneLatitude: det.latitude,
    droneLongitude: det.longitude,
    objectLatitude: det.objectLatitude,
    objectLongitude: det.objectLongitude,
    detectedAt: new Date(event.timestamp),
    receivedAt: new Date(),
  };
}

function buildDetectionFromTrack(
  event: TrackConfirmedEvent,
  det: TrackConfirmedEvent['detections'][number]
): ThreatDetection {
  return {
    id: `${event.streamId}-${det.trackId}-${event.timestamp}`,
    streamId: event.streamId,
    trackId: det.trackId,
    type: det.class,
    confidence: det.score,
    isVerified: true,
    reasoning: det.reasoning,
    boundingBox: { x: det.x, y: det.y, width: det.width, height: det.height },
    imageUrl: det.imageUrl,
    droneLatitude: det.latitude,
    droneLongitude: det.longitude,
    objectLatitude: det.objectLatitude,
    objectLongitude: det.objectLongitude,
    detectedAt: new Date(event.timestamp),
    receivedAt: new Date(),
  };
}

function capArray<T>(arr: T[], max: number): T[] {
  return arr.length > max ? arr.slice(0, max) : arr;
}

export const initialDetectionState: DetectionState = {
  detections: [],
  alerts: [],
  soundEnabled: false,
  status: 'connecting',
};

export function detectionReducer(
  state: DetectionState,
  action: DetectionAction
): DetectionState {
  switch (action.type) {
    case 'SET_STATUS':
      return { ...state, status: action.payload };

    case 'ADD_YOLO_DETECTIONS': {
      const event = action.payload;
      const newDetections = event.detections.map((d) => buildDetectionFromYolo(event, d));
      return {
        ...state,
        detections: capArray([...newDetections, ...state.detections], MAX_DETECTIONS),
      };
    }

    case 'ADD_TRACK_CONFIRMED': {
      const event = action.payload;
      const newDetections = event.detections.map((d) => buildDetectionFromTrack(event, d));

      const updatedDetections = [...state.detections];
      for (const nd of newDetections) {
        const idx = updatedDetections.findIndex((d) => d.id === nd.id);
        if (idx >= 0) {
          updatedDetections[idx] = nd;
        } else {
          updatedDetections.unshift(nd);
        }
      }

      const newAlerts = [...state.alerts];
      for (const nd of newDetections) {
        if (nd.confidence >= ALERT_CONFIDENCE_THRESHOLD) {
          const alert: DetectionAlert = {
            id: nd.id,
            detection: nd,
            createdAt: new Date(),
          };
          const existingIdx = newAlerts.findIndex((a) => a.id === alert.id);
          if (existingIdx >= 0) {
            newAlerts[existingIdx] = alert;
          } else {
            newAlerts.unshift(alert);
          }
        }
      }

      return {
        ...state,
        detections: capArray(updatedDetections, MAX_DETECTIONS),
        alerts: capArray(newAlerts, MAX_ALERTS),
      };
    }

    case 'CLEAR_ALERT':
    case 'DISMISS_ALERT':
      return {
        ...state,
        alerts: state.alerts.filter((a) => a.id !== action.payload),
      };

    case 'TOGGLE_SOUND':
      return { ...state, soundEnabled: !state.soundEnabled };

    default:
      return state;
  }
}
