import { useReducer, useCallback, useRef, useEffect } from 'react';
import { useAIDetectionWebSocket } from './useAIDetectionWebSocket';
import {
  detectionReducer,
  initialDetectionState,
} from '@/lib/reducers/detection-reducer';
import type { YoloDetectionEvent, TrackConfirmedEvent } from '@/lib/types/threats';

const ALERT_AUTO_DISMISS_MS = 30_000;

export function useAIDetections() {
  const [state, dispatch] = useReducer(detectionReducer, initialDetectionState);
  const alertTimersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  const onYoloDetection = useCallback(
    (event: YoloDetectionEvent) => {
      dispatch({ type: 'ADD_YOLO_DETECTIONS', payload: event });
    },
    [dispatch]
  );

  const onTrackConfirmed = useCallback(
    (event: TrackConfirmedEvent) => {
      dispatch({ type: 'ADD_TRACK_CONFIRMED', payload: event });

      for (const det of event.detections) {
        const alertId = `${event.streamId}-${det.trackId}-${event.timestamp}`;
        if (det.score >= 0.85) {
          const timer = setTimeout(() => {
            alertTimersRef.current.delete(alertId);
            dispatch({ type: 'DISMISS_ALERT', payload: alertId });
          }, ALERT_AUTO_DISMISS_MS);
          alertTimersRef.current.set(alertId, timer);
        }
      }
    },
    [dispatch]
  );

  const { status } = useAIDetectionWebSocket({
    onYoloDetection,
    onTrackConfirmed,
  });

  useEffect(() => {
    dispatch({ type: 'SET_STATUS', payload: status });
  }, [status, dispatch]);

  const clearAlert = useCallback(
    (id: string) => {
      const timer = alertTimersRef.current.get(id);
      if (timer) {
        clearTimeout(timer);
        alertTimersRef.current.delete(id);
      }
      dispatch({ type: 'CLEAR_ALERT', payload: id });
    },
    [dispatch]
  );

  const toggleSound = useCallback(() => {
    dispatch({ type: 'TOGGLE_SOUND' });
  }, [dispatch]);

  return {
    detections: state.detections,
    status: state.status,
    alerts: state.alerts,
    soundEnabled: state.soundEnabled,
    dispatch,
    toggleSound,
    clearAlert,
  };
}
