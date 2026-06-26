'use client';

import { useEffect, useCallback, useRef } from 'react';
import { AlertTriangle, X } from 'lucide-react';
import type { DetectionAlert } from '@/lib/types/threats';

interface AlertBannerProps {
  alerts: DetectionAlert[];
  onDismiss: (id: string) => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
  onViewDetection?: (detectionId: string) => void;
}

export function AlertBanner({
  alerts,
  onDismiss,
  soundEnabled,
  onToggleSound,
  onViewDetection,
}: AlertBannerProps) {
  const prevCountRef = useRef(0);

  useEffect(() => {
    if (alerts.length > prevCountRef.current && soundEnabled) {
      try {
        const ctx = new AudioContext();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.frequency.value = 880;
        gain.gain.value = 0.15;
        osc.start();
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
        osc.stop(ctx.currentTime + 0.5);
      } catch {
        // AudioContext not available
      }
    }
    prevCountRef.current = alerts.length;
  }, [alerts.length, soundEnabled]);

  const handleView = useCallback(
    (detectionId: string) => {
      onViewDetection?.(detectionId);
    },
    [onViewDetection]
  );

  if (alerts.length === 0) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-40 space-y-2 p-4 pointer-events-none">
      {alerts.map((alert) => {
        const d = alert.detection;
        return (
          <div
            key={alert.id}
            className="pointer-events-auto flex items-center justify-between gap-4 bg-red-950/90 backdrop-blur-sm border border-red-500/40 rounded-lg px-4 py-3 shadow-lg animate-in slide-in-from-top-4"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
              <div className="min-w-0">
                <p className="text-xs font-semibold font-poppins text-red-200 capitalize">
                  {d.type} detected
                </p>
                <p className="text-xs font-poppins text-red-300/70 truncate">
                  {(d.confidence * 100).toFixed(1)}% confidence · Stream {d.streamId}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              {onViewDetection && (
                <button
                  onClick={() => handleView(d.id)}
                  className="text-xs font-poppins px-2 py-1 rounded-md bg-red-500/20 text-red-300 hover:bg-red-500/30 transition-colors border border-red-500/30"
                >
                  View
                </button>
              )}
              <button
                onClick={() => onDismiss(alert.id)}
                className="p-1 rounded-md hover:bg-red-500/20 transition-colors"
              >
                <X className="w-3.5 h-3.5 text-red-400" />
              </button>
            </div>
          </div>
        );
      })}


    </div>
  );
}
