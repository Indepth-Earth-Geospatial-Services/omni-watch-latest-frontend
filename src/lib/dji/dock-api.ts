import { djiRequest } from './client';
import { DJI_CONFIG } from './config';
import type {
  PayloadCommandRequest,
  JobActionRequest,
  TakeoffToPointRequest,
  DockFlyToPointRequest,
  PayloadAuthorityRequest,
} from '@/lib/types/dock';

const CONTROL = DJI_CONFIG.CONTROL;

// POST /control/api/v1/devices/{sn}/payload/commands
export function sendPayloadCommand(sn: string, payload: PayloadCommandRequest): Promise<void> {
  return djiRequest.post<void>(`${CONTROL}/devices/${sn}/payload/commands`, payload);
}

// POST /control/api/v1/devices/{sn}/jobs/{service_identifier}
export function executeJob(sn: string, serviceIdentifier: string, body: JobActionRequest): Promise<void> {
  return djiRequest.post<void>(`${CONTROL}/devices/${sn}/jobs/${serviceIdentifier}`, body);
}

// POST /control/api/v1/devices/{sn}/jobs/takeoff-to-point
export function takeoffToPoint(sn: string, body: TakeoffToPointRequest): Promise<void> {
  return djiRequest.post<void>(`${CONTROL}/devices/${sn}/jobs/takeoff-to-point`, body);
}

// POST /control/api/v1/devices/{sn}/jobs/fly-to-point
export function flyToPoint(sn: string, body: DockFlyToPointRequest): Promise<void> {
  return djiRequest.post<void>(`${CONTROL}/devices/${sn}/jobs/fly-to-point`, body);
}

// DELETE /control/api/v1/devices/{sn}/jobs/fly-to-point
export function cancelFlyToPoint(sn: string): Promise<void> {
  return djiRequest.delete<void>(`${CONTROL}/devices/${sn}/jobs/fly-to-point`);
}

// POST /control/api/v1/devices/{sn}/authority/payload
export function requestPayloadAuthority(sn: string, body: PayloadAuthorityRequest): Promise<void> {
  return djiRequest.post<void>(`${CONTROL}/devices/${sn}/authority/payload`, body);
}

// POST /control/api/v1/devices/{sn}/authority/flight
export function requestFlightAuthority(sn: string): Promise<void> {
  return djiRequest.post<void>(`${CONTROL}/devices/${sn}/authority/flight`);
}
