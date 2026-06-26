# Plan: AID-9 — Create useAIDetectionWebSocket Hook

## Summary

Extract the Socket.IO connection lifecycle from `useAIDetections` into a dedicated, reusable `useAIDetectionWebSocket` hook. The new hook manages connection setup, status tracking, and event dispatch via callbacks. The existing `useAIDetections` becomes a state aggregator that consumes the new hook and manages detection state/alerts separately from the transport layer.

## User Story

As a developer
I want to separate the WebSocket transport from detection state management
So that the connection logic is reusable and each concern has a single responsibility

## Metadata

| Field | Value |
|-------|-------|
| Type | REFACTOR |
| Complexity | LOW |
| Systems Affected | hooks, ai-detection page |
| Jira Issue | AID-9 |

---

## Patterns to Follow

### Cancelled-ref + Deferred Init (Strict Mode safety)
```typescript
// SOURCE: src/hooks/useAIDetections.ts:74,91-96,163-170
const cancelledRef = useRef(false);

useEffect(() => {
  cancelledRef.current = false;
  const initTimer = setTimeout(() => {
    if (cancelledRef.current) return;
    // create connection...
  }, 0);

  return () => {
    cancelledRef.current = true;
    clearTimeout(initTimer);
    socketRef.current?.disconnect();
    socketRef.current = null;
  };
}, []);
```

### Socket.IO Connection Config
```typescript
// SOURCE: src/hooks/useAIDetections.ts:97-101
const socket = io(SOCKET_URL, {
  path: '/ws/events',
  auth: { token: getToken() },
  transports: ['websocket', 'polling'],
});
```

### Connection Status Tracking
```typescript
// SOURCE: src/hooks/useAIDetections.ts:70,103-113
const [status, setStatus] = useState<ThreatSocketStatus>('connecting');

socket.on('connect', () => { setStatus('connected'); });
socket.on('disconnect', () => { setStatus('disconnected'); });
socket.on('connect_error', () => { setStatus('error'); });
```

### Event Handler Registration (Callback Pattern)
```typescript
// SOURCE: src/hooks/useDJIWebSocket.ts:136-159
// The useDJIWebSocket hook uses a handlersRef map with on(bizCode, handler) returning unsubscribe
// We'll follow a simpler callback-based approach for Socket.IO events
```

### Import Ordering
```typescript
// SOURCE: src/hooks/useAIDetections.ts:1-10
// 1. React imports
// 2. External library imports (socket.io-client)
// 3. Internal config imports (token-store)
// 4. Type imports (from @/lib/types/threats)
```

### Type Definition for Socket Status
```typescript
// SOURCE: src/lib/types/threats.ts:120
export type ThreatSocketStatus = 'connecting' | 'connected' | 'disconnected' | 'error';
```

---

## Files to Change

| File | Action | Purpose |
|------|--------|---------|
| `src/hooks/useAIDetectionWebSocket.ts` | CREATE | New WebSocket transport hook |
| `src/hooks/useAIDetections.ts` | UPDATE | Consume new hook, remove connection logic |

---

## Tasks

Execute in order. Each task is atomic and verifiable.

### Task 1: Create useAIDetectionWebSocket hook

- **File**: `src/hooks/useAIDetectionWebSocket.ts`
- **Action**: CREATE
- **Implement**:
  - Import `useState, useEffect, useRef, useCallback` from React
  - Import `io, Socket` from `socket.io-client`
  - Import `getToken` from `@/lib/config/token-store`
  - Import `ThreatSocketStatus` from `@/lib/types/threats`
  - Define `SOCKET_URL` constant from `process.env.NEXT_PUBLIC_AI_DETECTION_SOCKET_URL` with fallback `'http://136.116.89.216'`
  - Define `AIDetectionWebSocketOptions` interface with optional `onYoloDetection` and `onTrackConfirmed` callbacks
  - Implement `useAIDetectionWebSocket` hook:
    - State: `status: ThreatSocketStatus` (default `'connecting'`)
    - Refs: `socketRef: Socket | null`, `cancelledRef: boolean`
    - Refs for callback storage: `onYoloRef`, `onTrackRef` (to avoid stale closures)
    - Expose `subscribe` functions that let consumers register event handlers
    - `useEffect` with cancelled-ref + deferred init pattern:
      - Create Socket.IO connection with auth token
      - Wire `connect`, `disconnect`, `connect_error` to status state
      - Wire `YOLO_DETECTION` to dispatch to `onYoloRef.current`
      - Wire `TRACK_CONFIRMED` to dispatch to `onTrackRef.current`
    - Cleanup: disconnect socket, clear refs
    - Return: `{ status }`
  - Export the hook as default and named export
- **Mirror**: `src/hooks/useAIDetections.ts:68-170` — follow the same connection lifecycle pattern
- **Validate**: `pnpm run build`

### Task 2: Refactor useAIDetections to consume the new hook

- **File**: `src/hooks/useAIDetections.ts`
- **Action**: UPDATE
- **Implement**:
  - Remove Socket.IO import (`io, Socket`)
  - Remove `getToken` import
  - Remove `SOCKET_URL` constant
  - Keep: `useState, useEffect, useRef, useCallback` from React
  - Keep: all type imports from `@/lib/types/threats`
  - Keep: `MAX_DETECTIONS`, `MAX_ALERTS`, `ALERT_CONFIDENCE_THRESHOLD`, `ALERT_AUTO_DISMISS_MS` constants
  - Keep: `buildDetectionFromYolo`, `buildDetectionFromTrack`, `capDetections` helper functions
  - Import `useAIDetectionWebSocket` from `./useAIDetectionWebSocket`
  - Remove: `socketRef`, `cancelledRef` refs (no longer needed)
  - Keep: `alertTimersRef` (still needed for alert auto-dismiss)
  - Keep: `detections`, `status`, `alerts`, `soundEnabled` state
  - Call `useAIDetectionWebSocket` with callbacks:
    - `onYoloDetection`: map detections, prepend to state, cap at MAX_DETECTIONS
    - `onTrackConfirmed`: merge/update detections, cap, queue high-confidence alerts
  - Use the `status` returned from `useAIDetectionWebSocket` instead of local status state
  - Remove the entire Socket.IO connection `useEffect` block (lines 90-170)
  - Keep: `clearAlert` and `toggleSound` callbacks
  - Keep: same return value shape `{ detections, status, alerts, soundEnabled, toggleSound, clearAlert }`
- **Mirror**: `src/hooks/useAIDetections.ts:68-180` — maintain the same public API
- **Validate**: `pnpm run build`

### Task 3: Verify TypeScript compilation and no regressions

- **File**: N/A
- **Action**: VALIDATE
- **Implement**: Run build and lint to verify no type errors or regressions
- **Validate**:
  - `pnpm run build` passes
  - `pnpm run lint` passes
  - The AI detection page (`src/app/(dashboard)/ai-detection/page.tsx`) still works — it imports `useAIDetections` which maintains the same return signature

---

## Validation

```bash
# Type check
pnpm run build

# Lint
pnpm run lint
```

---

## Acceptance Criteria

- [ ] `useAIDetectionWebSocket.ts` created in `src/hooks/`
- [ ] Hook manages Socket.IO connection lifecycle (connect, disconnect, cleanup)
- [ ] Hook tracks connection status (`ThreatSocketStatus`)
- [ ] Hook dispatches events to registered callbacks
- [ ] `useAIDetections.ts` refactored to consume `useAIDetectionWebSocket`
- [ ] `useAIDetections` return value unchanged (no breaking changes for consumers)
- [ ] AI detection page (`src/app/(dashboard)/ai-detection/page.tsx`) works without modification
- [ ] `pnpm run build` passes
- [ ] `pnpm run lint` passes
