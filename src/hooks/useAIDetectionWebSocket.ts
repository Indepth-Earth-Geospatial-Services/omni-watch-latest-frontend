import { useState, useEffect, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { toast } from 'sonner';
import { getToken } from '@/lib/config/token-store';
import type { ThreatSocketStatus, YoloDetectionEvent, TrackConfirmedEvent } from '@/lib/types/threats';

const SOCKET_URL = process.env.NEXT_PUBLIC_AI_DETECTION_SOCKET_URL || 'http://136.116.89.216';

export interface AIDetectionWebSocketOptions {
  onYoloDetection?: (event: YoloDetectionEvent) => void;
  onTrackConfirmed?: (event: TrackConfirmedEvent) => void;
}

const ERROR_TOAST_THROTTLE_MS = 10_000;

export function useAIDetectionWebSocket(options: AIDetectionWebSocketOptions = {}) {
  const [status, setStatus] = useState<ThreatSocketStatus>('connecting');
  const socketRef = useRef<Socket | null>(null);
  const cancelledRef = useRef(false);
  const lastErrorToastRef = useRef(0);
  const onYoloRef = useRef(options.onYoloDetection);
  const onTrackRef = useRef(options.onTrackConfirmed);

  useEffect(() => {
    onYoloRef.current = options.onYoloDetection;
  }, [options.onYoloDetection]);

  useEffect(() => {
    onTrackRef.current = options.onTrackConfirmed;
  }, [options.onTrackConfirmed]);

  useEffect(() => {
    cancelledRef.current = false;

    const initTimer = setTimeout(() => {
      if (cancelledRef.current) return;

      const socket = io(SOCKET_URL, {
        path: '/socket.io',
        auth: { token: getToken() },
        transports: ['websocket', 'polling'],
      });

      socket.on('connect', () => {
        if (!cancelledRef.current) setStatus('connected');
      });

      socket.on('disconnect', () => {
        if (!cancelledRef.current) setStatus('reconnecting');
      });

      socket.on('connect_error', () => {
        if (!cancelledRef.current) {
          setStatus('error');
          const now = Date.now();
          if (now - lastErrorToastRef.current > ERROR_TOAST_THROTTLE_MS) {
            lastErrorToastRef.current = now;
            toast.error('AI Detection connection lost — reconnecting...');
          }
        }
      });

      socket.on('YOLO_DETECTION', (event: YoloDetectionEvent) => {
        if (cancelledRef.current) return;
        onYoloRef.current?.(event);
      });

      socket.on('TRACK_CONFIRMED', (event: TrackConfirmedEvent) => {
        if (cancelledRef.current) return;
        onTrackRef.current?.(event);
      });

      socketRef.current = socket;
    }, 0);

    return () => {
      cancelledRef.current = true;
      clearTimeout(initTimer);
      socketRef.current?.disconnect();
      socketRef.current = null;
    };
  }, []);

  return { status };
}

export default useAIDetectionWebSocket;
