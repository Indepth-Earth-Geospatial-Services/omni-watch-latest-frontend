// Mutation hooks for approving/dismissing AI detections.
// Uses optimistic updates via the detection reducer for immediate UI feedback.
// API calls are proxied through Next.js to the OmniWatch backend at http://34.35.12.123:8002.

import { useCallback, useRef } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { detectionKeys, createAlert, updateAlert, deleteAlert } from '@/lib/api/alerts';
import type { ThreatDetection } from '@/lib/types/threats';
import type { DetectionAction } from '@/lib/reducers/detection-reducer';

// ─── Helper: check if ID is a UUID ────────────────────────────────────────────

function isUUID(id: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
}

// ─── Helper: build minio_key from detection data ──────────────────────────────

function buildMinioKey(detection: ThreatDetection): string {
  // If objectKey is available, use it
  if (detection.objectKey) {
    return detection.objectKey;
  }
  // Otherwise construct from stream_id/timestamp/track_id.jpg
  const timestamp = detection.detectedAt.getTime();
  return `${detection.streamId}/${timestamp}/${detection.trackId}.jpg`;
}

// ─── Snapshot helper for optimistic rollback ──────────────────────────────────

function useDetectionSnapshot() {
  const snapshotRef = useRef<ThreatDetection[] | null>(null);

  const saveSnapshot = useCallback((detections: ThreatDetection[]) => {
    snapshotRef.current = [...detections];
  }, []);

  const getSnapshot = useCallback(() => snapshotRef.current, []);

  const clearSnapshot = useCallback(() => {
    snapshotRef.current = null;
  }, []);

  return { saveSnapshot, getSnapshot, clearSnapshot };
}

// ─── Hook: useApproveDetection ────────────────────────────────────────────────

interface ApproveDetectionOptions {
  detections: ThreatDetection[];
  dispatch: React.Dispatch<DetectionAction>;
}

/**
 * Approves a detection with optimistic update.
 * Always creates the alert in DB with alert_type: "APPROVED".
 * If alert already exists (UUID ID), updates it instead.
 */
export function useApproveDetection({ detections, dispatch }: ApproveDetectionOptions) {
  const queryClient = useQueryClient();
  const { saveSnapshot, getSnapshot, clearSnapshot } = useDetectionSnapshot();

  const mutation = useMutation({
    mutationFn: async (detection: ThreatDetection) => {
      if (isUUID(detection.id)) {
        // Detection already in DB — update it
        await updateAlert(detection.id, 'APPROVED');
      } else {
        // Detection from WebSocket — create it already approved
        const bbox = `${detection.boundingBox.x},${detection.boundingBox.y},${detection.boundingBox.width},${detection.boundingBox.height}`;
        const minioKey = buildMinioKey(detection);
        await createAlert({
          stream_id: detection.streamId,
          track_id: String(detection.trackId),
          alert_class: detection.type,
          confidence: detection.confidence,
          bbox,
          minio_key: minioKey,
          latitude: detection.droneLatitude ?? undefined,
          longitude: detection.droneLongitude ?? undefined,
          detected_at: detection.detectedAt.toISOString(),
          alert_type: 'APPROVED',
        });
      }
      return detection;
    },

    onMutate: async (detection) => {
      await queryClient.cancelQueries({ queryKey: detectionKeys.all });
      saveSnapshot(detections);

      dispatch({
        type: 'UPDATE_DETECTION_STATUS',
        payload: { id: detection.id, status: 'approved' },
      });

      return { previousDetections: getSnapshot() };
    },

    onError: (_err, _detection, context) => {
      if (context?.previousDetections) {
        dispatch({
          type: 'UPDATE_DETECTION_STATUS',
          payload: { id: _detection.id, status: 'pending' },
        });
      }
      toast.error(`Failed to approve ${_detection.type}: ${_err.message}`);
    },

    onSettled: () => {
      clearSnapshot();
      queryClient.invalidateQueries({ queryKey: detectionKeys.all });
    },

    onSuccess: (_data, detection) => {
      toast.success(`Approved: ${detection.type} (#${detection.trackId})`);
    },
  });

  return {
    approveDetection: mutation.mutate,
    isPending: mutation.isPending,
  };
}

// ─── Hook: useDismissDetection ────────────────────────────────────────────────

/**
 * Dismisses a detection by deleting it from the DB.
 * Only works for detections with UUID IDs (already in DB).
 * For WebSocket detections, marks as dismissed locally.
 */
export function useDismissDetection({ detections, dispatch }: ApproveDetectionOptions) {
  const queryClient = useQueryClient();
  const { saveSnapshot, getSnapshot, clearSnapshot } = useDetectionSnapshot();

  const mutation = useMutation({
    mutationFn: async (detection: ThreatDetection) => {
      if (isUUID(detection.id)) {
        // Detection in DB — delete it
        await deleteAlert(detection.id);
      } else {
        // Detection from WebSocket — can't delete from DB
        // Just mark as dismissed locally
        console.log('[Dismiss] WebSocket detection, marking locally:', detection.id);
      }
      return detection;
    },

    onMutate: async (detection) => {
      await queryClient.cancelQueries({ queryKey: detectionKeys.all });
      saveSnapshot(detections);

      dispatch({
        type: 'UPDATE_DETECTION_STATUS',
        payload: { id: detection.id, status: 'dismissed' },
      });

      return { previousDetections: getSnapshot() };
    },

    onError: (_err, _detection, context) => {
      if (context?.previousDetections) {
        dispatch({
          type: 'UPDATE_DETECTION_STATUS',
          payload: { id: _detection.id, status: 'pending' },
        });
      }
      toast.error(`Failed to dismiss ${_detection.type}: ${_err.message}`);
    },

    onSettled: () => {
      clearSnapshot();
      queryClient.invalidateQueries({ queryKey: detectionKeys.all });
    },

    onSuccess: (_data, detection) => {
      toast.success(`Dismissed: ${detection.type} (#${detection.trackId})`);
    },
  });

  return {
    dismissDetection: mutation.mutate,
    isPending: mutation.isPending,
  };
}
