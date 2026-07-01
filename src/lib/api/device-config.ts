import axios, { AxiosError } from 'axios';
import { getToken } from '@/lib/config/token-store';
import type { DeviceConfig, AIClass, StreamUrlResponse } from '@/lib/types';

const OMNI_PROXY = '/api/omniwatch';

interface OmniWatchEnvelope<T> {
  code: number;
  message: string;
  data: T;
}

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

    if (body && typeof body === 'object' && 'code' in body && 'data' in body) {
      const envelope = body as OmniWatchEnvelope<T>;
      if (envelope.code !== 0) {
        const detail = (envelope.data as Record<string, unknown> | undefined)?.detail;
        const msg = String(detail ?? envelope.message ?? `Request failed: ${res.status}`);
        throw new Error(msg);
      }
      return envelope.data;
    }

    return body as T;
  } catch (err) {
    if (err instanceof AxiosError && err.response) {
      const body = err.response.data;
      if (body && typeof body === 'object' && 'code' in body && 'data' in body) {
        const envelope = body as OmniWatchEnvelope<unknown>;
        const detail = (envelope.data as Record<string, unknown> | undefined)?.detail;
        throw new Error(String(detail ?? envelope.message ?? `Request failed: ${err.response.status}`));
      }
      if (body && typeof body === 'object' && 'detail' in body) {
        throw new Error(String((body as Record<string, unknown>).detail));
      }
      throw new Error(`Request failed: ${err.response.status}`);
    }
    throw err;
  }
}

export async function fetchDeviceConfigs(): Promise<DeviceConfig[]> {
  const data = await request<DeviceConfig[] | { list: DeviceConfig[] }>(
    'GET',
    `${OMNI_PROXY}/projects/devices/config/`
  );
  return Array.isArray(data) ? data : (data?.list ?? []);
}

export async function fetchDeviceConfig(deviceSn: string): Promise<DeviceConfig> {
  return request<DeviceConfig>('GET', `${OMNI_PROXY}/projects/devices/${deviceSn}/config/view/`);
}

export async function updateDeviceConfig(
  deviceSn: string,
  body: { targetClasses: string; ai_enabled: boolean }
): Promise<DeviceConfig> {
  return request<DeviceConfig>('PUT', `${OMNI_PROXY}/projects/devices/${deviceSn}/config/`, body);
}

export async function fetchAIClasses(): Promise<AIClass[]> {
  const data = await request<AIClass[] | { list: AIClass[] }>(
    'GET',
    `${OMNI_PROXY}/projects/ai-classes/`
  );
  return Array.isArray(data) ? data : (data?.list ?? []);
}

export async function fetchStreamUrl(deviceSn: string): Promise<StreamUrlResponse> {
  return request<StreamUrlResponse>('GET', `/api/stream-url?sn=${deviceSn}`);
}

export async function startAIPipeline(streamId: string): Promise<void> {
  return request<void>('POST', `/api/ai-detection/streams/start-ai`, { streamId });
}

export async function stopAIPipeline(streamId: string): Promise<void> {
  return request<void>('POST', `/api/ai-detection/streams/stop-ai`, { streamId });
}
