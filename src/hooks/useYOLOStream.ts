import { useState, useEffect, useRef, useCallback } from 'react';

interface UseYOLOStreamOptions {
  url: string;
  reconnectInterval?: number;
  onFrame?: (imageData: string) => void;
}

interface UseYOLOStreamReturn {
  status: 'CONNECTING' | 'CONNECTED' | 'DISCONNECTED' | 'ERROR';
  info: string;
  fps: number;
  isConnected: boolean;
  reconnect: () => void;
}

export function useYOLOStream({
  url,
  reconnectInterval = 3000,
  onFrame,
}: UseYOLOStreamOptions): UseYOLOStreamReturn {
  const [status, setStatus] = useState<'CONNECTING' | 'CONNECTED' | 'DISCONNECTED' | 'ERROR'>('CONNECTING');
  const [info, setInfo] = useState('Waiting for stream...');
  const [fps, setFps] = useState(0);

  const wsRef = useRef<WebSocket | null>(null);
  const frameCountRef = useRef(0);
  const lastFrameTimeRef = useRef(Date.now());
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isConnectedRef = useRef(false);

  const connect = useCallback(() => {
    // Clear any existing reconnect timeout
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    // Don't reconnect if already connected
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      return;
    }

    // Close existing connection
    if (wsRef.current) {
      wsRef.current.close();
    }

    console.log(`🔌 Connecting to YOLO WebSocket: ${url}`);
    const ws = new WebSocket(url);

    ws.onopen = () => {
      console.log('✅ YOLO WebSocket connected');
      setStatus('CONNECTED');
      setInfo('Stream active');
      isConnectedRef.current = true;
    };

    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);

        // Debug: log first few messages to see the structure
        if (frameCountRef.current < 3) {
          console.log('📦 Received message:', message);
        }

        if (message.type === 'frame' && message.data) {
          const imageData = 'data:image/jpeg;base64,' + message.data;

          // Call onFrame callback if provided
          if (onFrame) {
            onFrame(imageData);
          }

          // Calculate FPS
          frameCountRef.current++;
          const now = Date.now();
          const elapsed = now - lastFrameTimeRef.current;

          if (elapsed >= 1000) {
            const calculatedFps = Math.round((frameCountRef.current * 1000) / elapsed);
            setFps(calculatedFps);
            frameCountRef.current = 0;
            lastFrameTimeRef.current = now;
          }
        }
      } catch (error) {
        console.error('❌ Error processing YOLO frame:', error);
      }
    };

    ws.onclose = (event) => {
      console.log(`❌ YOLO WebSocket disconnected (code: ${event.code})`);
      setStatus('DISCONNECTED');
      setInfo('Reconnecting...');
      isConnectedRef.current = false;
      setFps(0);

      // Auto-reconnect
      reconnectTimeoutRef.current = setTimeout(() => {
        connect();
      }, reconnectInterval);
    };

    ws.onerror = () => {
      console.error('⚠️ YOLO WebSocket error');
      setStatus('ERROR');
      setInfo('Connection error');
      isConnectedRef.current = false;
    };

    wsRef.current = ws;
  }, [url, reconnectInterval, onFrame]);

  // Initial connection
  useEffect(() => {
    connect();

    // Cleanup on unmount
    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [connect]);

  return {
    status,
    info,
    fps,
    isConnected: status === 'CONNECTED',
    reconnect: connect,
  };
}
