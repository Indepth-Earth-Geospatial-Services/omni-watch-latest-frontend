# Plan: AID-10 — Create Detection State Reducer

## Summary

Refactor the AI detection state management from multiple `useState` calls into a centralized `useReducer` pattern. This consolidates detection list, alert, sound preference, and connection status state into a single pure reducer function with typed actions, improving predictability, testability, and scalability as detection features grow.

## User Story

As a developer maintaining the AI detection module
I want to consolidate detection state into a reducer pattern
So that state transitions are predictable, testable, and easier to extend

## Metadata

| Field | Value |
|-------|-------|
| Type | REFACTOR |
| Complexity | MEDIUM |
| Systems Affected | AI Detection (hooks, types, page) |
| Jira Issue | AID-10 |

---

## Patterns to Follow

### Reducer Structure (new pattern for this codebase)
```typescript
// SOURCE: src/lib/reducers/detection-reducer.ts
export interface DetectionState {
  detections: ThreatDetection[];
  alerts: DetectionAlert[];
  soundEnabled: boolean;
  status: ThreatSocketStatus;
}

export type DetectionAction =
  | { type: 'SET_STATUS'; payload: ThreatSocketStatus }
  | { type: 'ADD_YOLO_DETECTIONS'; payload: YoloDetectionEvent }
  | ...;

export function detectionReducer(state: DetectionState, action: DetectionAction): DetectionState {
  switch (action.type) { ... }
}
```

### Hook Consumption Pattern
```typescript
// SOURCE: src/hooks/useAIDetections.ts
const [state, dispatch] = useReducer(detectionReducer, initialDetectionState);
// Dispatch wrapped in useCallback, never expose raw dispatch
```

### Type Definitions
```typescript
// SOURCE: src/lib/types/threats.ts
// Interfaces: PascalCase, no I prefix
// Events: <Name>Event
// Union types: <Name> = 'option1' | 'option2'
```

### Array Capping
```typescript
// SOURCE: src/lib/reducers/detection-reducer.ts:74-76
function capArray<T>(arr: T[], max: number): T[] {
  return arr.length > max ? arr.slice(0, max) : arr;
}
```

---

## Files to Change

| File | Action | Purpose |
|------|--------|---------|
| `src/lib/reducers/detection-reducer.ts` | CREATE | Reducer function, state interface, action types, initial state |
| `src/hooks/useAIDetections.ts` | UPDATE | Replace useState calls with useReducer, dispatch actions |
| `src/lib/types/threats.ts` | NO CHANGE | Types already defined correctly |
| `src/lib/types/index.ts` | NO CHANGE | Already re-exports threats module |

---

## Tasks

Execute in order. Each task is atomic and verifiable.

### Task 1: Create Detection Reducer File

- **File**: `src/lib/reducers/detection-reducer.ts`
- **Action**: CREATE
- **Implement**:
  - `DetectionState` interface with `detections`, `alerts`, `soundEnabled`, `status`
  - `DetectionAction` discriminated union with 6 action types: `SET_STATUS`, `ADD_YOLO_DETECTIONS`, `ADD_TRACK_CONFIRMED`, `CLEAR_ALERT`, `DISMISS_ALERT`, `TOGGLE_SOUND`
  - Helper functions: `buildDetectionFromYolo()`, `buildDetectionFromTrack()`, `capArray<T>()`
  - Export `initialDetectionState` constant
  - Export `detectionReducer()` pure function
- **Constants**: `MAX_DETECTIONS = 200`, `MAX_ALERTS = 5`, `ALERT_CONFIDENCE_THRESHOLD = 0.85`
- **Mirror**: N/A — first reducer in codebase; follow existing naming conventions from `src/lib/types/threats.ts`
- **Validate**: `npx tsc --noEmit`

### Task 2: Update useAIDetections Hook

- **File**: `src/hooks/useAIDetections.ts`
- **Action**: UPDATE
- **Implement**:
  - Replace `useState` calls with `useReducer(detectionReducer, initialDetectionState)`
  - Remove `buildDetectionFromYolo`, `buildDetectionFromTrack`, `capDetections` (moved to reducer)
  - Wrap callbacks in `useCallback` that dispatch actions
  - Sync WebSocket status into reducer via `useEffect`
  - Maintain alert auto-dismiss timers in `useRef<Map>`
  - Return same public API: `{ detections, status, alerts, soundEnabled, toggleSound, clearAlert }`
- **Mirror**: `src/hooks/useAIDetectionWebSocket.ts:13-18` — useRef pattern for timers
- **Validate**: `npx tsc --noEmit`

### Task 3: Verify Type Consistency

- **File**: `src/lib/types/threats.ts`
- **Action**: VERIFY (no changes expected)
- **Implement**: Confirm all types used in reducer match existing type definitions
- **Mirror**: `src/lib/types/threats.ts:1-120`
- **Validate**: `npx tsc --noEmit`

---

## Validation

```bash
# Type check
npx tsc --noEmit

# Build check
npm run build

# Lint
npx next lint
```

---

## Acceptance Criteria

- [x] All tasks completed
- [x] Type check passes (`npx tsc --noEmit`)
- [x] Follows existing patterns (naming, structure, exports)
- [x] Public API of `useAIDetections` unchanged
- [x] Reducer is a pure function (no side effects)
- [x] Action types are a discriminated union
- [x] Array growth capped at MAX_DETECTIONS / MAX_ALERTS
- [x] Alert auto-dismiss timers properly cleaned up on unmount
