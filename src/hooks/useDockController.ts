'use client';

import { useMutation } from '@tanstack/react-query';
import {
  sendPayloadCommand,
  executeJob,
  takeoffToPoint,
  flyToPoint,
  cancelFlyToPoint,
  requestPayloadAuthority,
  requestFlightAuthority,
} from '@/services/djiservice-layer/dji-service';
import type {
  PayloadCommandRequest,
  TakeoffToPointRequest,
  DockFlyToPointRequest,
  PayloadAuthorityRequest,
} from '@/lib/types/dock';

// Send a camera or gimbal command to the drone payload mounted on the dock
export function useSendPayloadCommand(sn: string) {
  return useMutation<void, Error, PayloadCommandRequest>({
    mutationFn: (payload) => sendPayloadCommand(sn, payload),
  });
}

// Execute any dock job by service identifier.
// body is optional — omit for no-payload commands, pass { action: N } for action commands.
export function useExecuteJob(sn: string) {
  return useMutation<void, Error, { serviceIdentifier: string; body?: object }>({
    mutationFn: ({ serviceIdentifier, body }) => executeJob(sn, serviceIdentifier, body),
  });
}

// Command the drone to take off and fly to an absolute GPS point
export function useTakeoffToPoint(sn: string) {
  return useMutation<void, Error, TakeoffToPointRequest>({
    mutationFn: (body) => takeoffToPoint(sn, body),
  });
}

// Command a drone already in flight to fly to one or more GPS waypoints
export function useFlyToPoint(sn: string) {
  return useMutation<void, Error, DockFlyToPointRequest>({
    mutationFn: (body) => flyToPoint(sn, body),
  });
}

// Cancel an active fly-to-point command; drone will hover in place
export function useCancelFlyToPoint(sn: string) {
  return useMutation<void, Error, void>({
    mutationFn: () => cancelFlyToPoint(sn),
  });
}

// Request exclusive control of the drone's payload (camera/gimbal)
export function useRequestPayloadAuthority(sn: string) {
  return useMutation<void, Error, PayloadAuthorityRequest>({
    mutationFn: (body) => requestPayloadAuthority(sn, body),
  });
}

// Request exclusive flight control authority over the drone
export function useRequestFlightAuthority(sn: string) {
  return useMutation<void, Error, void>({
    mutationFn: () => requestFlightAuthority(sn),
  });
}
