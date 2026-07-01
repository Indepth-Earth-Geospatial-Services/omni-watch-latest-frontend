import axios, { AxiosError } from 'axios';
import { getToken } from '@/lib/config/token-store';
import { API_URLS } from '@/lib/api/AuthGlobalApi';
import type { ThreatDetection } from '@/lib/types/threats';

// ─── Query key factory ────────────────────────────────────────────────────────

export const detectionKeys = {
  all: ['ai-detections'] as const,
  list: (filters?: Record<string, unknown>) => ['ai-detections', 'list', filters ?? {}] as const,
  detail: (id: string) => ['ai-detections', 'detail', id] as const,
};

// ─── Types ────────────────────────────────────────────────────────────────────

export interface DetectionFilters {
  class?: string;
  status?: string;
  deviceId?: string;
  page?: number;
  page_size?: number;
}

export interface DetectionPage {
  detections: ThreatDetection[];
  nextPage: number | null;
}

// Backend alert item shape
interface BackendAlert {
  id: string;
  stream_id: string;
  track_id: string;
  class: string;
  confidence: number;
  bbox: {
    x: number;
    y: number;
    score: number;
    width: number;
    height: number;
  };
  minio_key?: string;
  image_url?: string | null;
  reasoning?: string;
  latitude?: number;
  longitude?: number;
  detected_at: string;
  created_at: string;
  alert_type: string;
}

export interface CreateAlertBody {
  stream_id: string;
  track_id: string;
  alert_class: string;
  confidence: number;
  bbox: string;
  minio_key?: string;
  reasoning?: string;
  latitude?: number;
  longitude?: number;
  detected_at: string;
  alert_type: 'PENDING' | 'APPROVED';
}

// loctiva wraps every response in { code, message, data }
interface loctivaEnvelope<T> {
  code: number;
  message: string;
  data: T;
}

// ─── Map backend alert to ThreatDetection ─────────────────────────────────────

function mapAlertToThreatDetection(alert: BackendAlert): ThreatDetection {
  return {
    id: alert.id,
    streamId: alert.stream_id,
    trackId: parseInt(alert.track_id, 10) || 0,
    type: alert.class,
    confidence: alert.confidence,
    isVerified: alert.alert_type === 'APPROVED' || alert.reasoning !== undefined,
    reasoning: alert.reasoning,
    status: alert.alert_type.toLowerCase() as 'pending' | 'approved' | 'dismissed',
    boundingBox: {
      x: alert.bbox.x,
      y: alert.bbox.y,
      width: alert.bbox.width,
      height: alert.bbox.height,
    },
    imageUrl: alert.image_url ?? null,
    objectKey: alert.minio_key,
    droneLatitude: alert.latitude ?? null,
    droneLongitude: alert.longitude ?? null,
    objectLatitude: null,
    objectLongitude: null,
    detectedAt: new Date(alert.detected_at),
    receivedAt: new Date(alert.created_at),
  };
}

// ─── Core request helper ──────────────────────────────────────────────────────

async function request<T>(
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE',
  url: string,
  data?: unknown
): Promise<T> {
  const token = getToken();

  try {
    const res = await axios.request({
      method,
      url,
      data,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });

    if (res.status === 204 || !res.data) {
      return undefined as unknown as T;
    }

    const body = res.data;

    // Handle loctiva envelope format { code, message, data }
    if (body && typeof body === 'object' && 'code' in body && 'data' in body) {
      const envelope = body as loctivaEnvelope<T>;
      if (envelope.code !== 0) {
        const detail = (envelope.data as Record<string, unknown> | undefined)?.detail;
        const msg = String(detail ?? envelope.message ?? `Request failed: ${res.status}`);
        throw new Error(msg);
      }
      return envelope.data;
    }

    // Direct response (no envelope)
    return body as T;
  } catch (err) {
    if (err instanceof AxiosError && err.response) {
      const body = err.response.data;
      // Try to extract error from envelope
      if (body && typeof body === 'object' && 'code' in body && 'data' in body) {
        const envelope = body as loctivaEnvelope<unknown>;
        const detail = (envelope.data as Record<string, unknown> | undefined)?.detail;
        throw new Error(
          String(detail ?? envelope.message ?? `Request failed: ${err.response.status}`)
        );
      }
      // Try to extract error from direct response
      if (body && typeof body === 'object' && 'detail' in body) {
        throw new Error(String((body as Record<string, unknown>).detail));
      }
      throw new Error(`Request failed: ${err.response.status}`);
    }
    throw err;
  }
}

// ─── Public API ───────────────────────────────────────────────────────────────

export async function fetchDetections(filters: DetectionFilters = {}): Promise<DetectionPage> {
  const params: Record<string, string> = {};

  if (filters.page) params.page = String(filters.page);
  if (filters.page_size) params.page_size = String(filters.page_size);
  if (filters.class) params.class = filters.class;
  if (filters.status) params.status = filters.status;
  if (filters.deviceId) params.deviceId = filters.deviceId;

  const url = API_URLS.alerts.list(params);

  try {
    const data = await request<{
      alerts?: BackendAlert[];
      total?: number;
      page?: number;
      page_size?: number;
      total_pages?: number;
    }>('GET', url);

    const alerts = data.alerts ?? [];
    const nextPage =
      data.page && data.total_pages && data.page < data.total_pages ? data.page + 1 : null;

    return {
      detections: alerts.map(mapAlertToThreatDetection),
      nextPage,
    };
  } catch (err) {
    console.error('[fetchDetections] Error:', err);
    return { detections: [], nextPage: null };
  }
}

export async function createAlert(body: CreateAlertBody): Promise<ThreatDetection> {
  const data = await request<BackendAlert>('POST', API_URLS.alerts.create, body);
  return mapAlertToThreatDetection(data);
}

export async function updateAlert(id: string, alertType: string): Promise<void> {
  await request<void>('PATCH', API_URLS.alerts.update(id), { alert_type: alertType });
}

export async function deleteAlert(id: string): Promise<void> {
  await request<void>('DELETE', API_URLS.alerts.delete(id));
}
