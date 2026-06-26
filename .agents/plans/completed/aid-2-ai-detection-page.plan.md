# Plan: AID-2 — AI Detection Page

## Summary

Build the real-time AI Detection page that connects to the backend Socket.IO at `136.116.89.216` and displays live `YOLO_DETECTION` (orange panel) and `TRACK_CONFIRMED` (red panel) events. The page will show detection cards with bounding boxes, confidence scores, drone/object GPS, and LLM reasoning for verified threats. A new `useAIDetections` hook manages the Socket.IO singleton connection, and the page follows the existing threats page layout patterns (StatCard, SearchFilter, MainLayout).

## User Story

As a Surveillance Operator
I want to see real-time AI object detections from live drone feeds in a unified dashboard
So that I can quickly identify, filter, and assess threats without manually monitoring every stream

## Metadata

| Field | Value |
|-------|-------|
| Type | NEW_CAPABILITY |
| Complexity | MEDIUM |
| Systems Affected | Frontend (Next.js), Backend Socket.IO (`136.116.89.216`) |
| Jira Issue | AID-2 |

---

## Patterns to Follow

### Socket.IO Connection (singleton hook)
```ts
// SOURCE: src/hooks/useUnregisteredDevices.ts:23-27
const socketInstance = io(TELEMETRY_SOCKET_URL, {
  path: '/ws/events',
  auth: { token: getToken() },
  transports: ['websocket', 'polling'],
});
```

### StatCard Usage
```ts
// SOURCE: src/app/(dashboard)/threats/page.tsx:158-162
<StatCard
  title="Total Threats"
  value={totalThreats}
  icon={ShieldAlert}
  color="blue"
/>
```

### SearchFilter Usage
```ts
// SOURCE: src/app/(dashboard)/threats/page.tsx:195-232
<SearchFilter
  searchTerm={searchTerm}
  onSearchChange={setSearchTerm}
  searchPlaceholder="Search threats..."
  filters={[
    { label: "Status", value: statusFilter, onChange: setStatusFilter, options: [...] },
    { label: "Type", value: typeFilter, onChange: setTypeFilter, options: [...] },
  ]}
/>
```

### Page Guard (active project check)
```ts
// SOURCE: src/app/(dashboard)/ai-detection/page.tsx:13-25
if (!activeProject) {
  return (
    <EmptyPage
      icon={<Brain className='w-6 h-6 text-zinc-400' />}
      title='No Project Selected'
      body='Please select a project...'
      action={{ label: 'Go to Projects', onClick: () => router.push('/projects') }}
    />
  );
}
```

### Types (already defined)
```ts
// SOURCE: src/lib/types/threats.ts:8-35, 41-70, 76-111
export interface YoloDetection { ... }
export interface YoloDetectionEvent { streamId: string; detections: YoloDetection[]; timestamp: number; }
export interface TrackConfirmedDetection { ... }
export interface TrackConfirmedEvent { streamId: string; detections: TrackConfirmedDetection[]; timestamp: number; }
export interface ThreatDetection { ... } // unified type
export type ThreatSocketStatus = 'connecting' | 'connected' | 'disconnected' | 'error';
```

---

## Files to Change

| File | Action | Purpose |
|------|--------|---------|
| `src/hooks/useAIDetections.ts` | CREATE | Socket.IO hook connecting to `136.116.89.216`, listening for `YOLO_DETECTION` and `TRACK_CONFIRMED` events, maintaining detection list state |
| `src/app/(dashboard)/ai-detection/page.tsx` | UPDATE | Replace empty shell with full detection dashboard: stats, search/filter, detection cards with bounding boxes, GPS, confidence, LLM reasoning |
| `src/components/features/ai-detection/DetectionCard.tsx` | CREATE | Individual detection card component showing type badge, confidence, bounding box overlay preview, drone/object GPS, verified status, LLM reasoning |
| `src/components/features/ai-detection/DetectionStatsBar.tsx` | CREATE | Row of StatCard components: Total Detections, YOLO Alerts, Verified Threats, High Confidence, Today's Detections |
| `src/components/features/ai-detection/DetectionFilters.tsx` | CREATE | SearchFilter wrapper with detection-specific filter options (status: all/yolo/verified, type: person/vehicle/etc., stream) |

---

## Tasks

Execute in order. Each task is atomic and verifiable.

### Task 1: Create `useAIDetections` hook

- **File**: `src/hooks/useAIDetections.ts`
- **Action**: CREATE
- **Implement**:
  - Singleton Socket.IO connection to `http://136.116.89.216` (backend from PRD)
  - Listen for `YOLO_DETECTION` and `TRACK_CONFIRMED` events
  - Convert incoming events to unified `ThreatDetection` items (using the type from `src/lib/types/threats.ts`)
  - Maintain state: `detections: ThreatDetection[]`, `status: ThreatSocketStatus`
  - Expose helper: `getDetectionsByStream(streamId)`, `getStats()` (total, yolo, verified, highConfidence, today)
  - Auto-reconnect on disconnect (follow `useDJIWebSocket.ts:182-188` pattern)
  - Strict Mode safe (follow `useDockMQTT.ts:50-59` deferred init pattern)
  - Cap detection list at 200 items ( FIFO eviction )
- **Mirror**: `src/hooks/useUnregisteredDevices.ts:23-27` (Socket.IO connection), `src/hooks/useDJIWebSocket.ts:182-188` (reconnect)
- **Validate**: `pnpm run build`

### Task 2: Create `DetectionStatsBar` component

- **File**: `src/components/features/ai-detection/DetectionStatsBar.tsx`
- **Action**: CREATE
- **Implement**:
  - Accept props: `{ total, yoloAlerts, verified, highConfidence, today }`
  - Render 5 `StatCard` components in a responsive grid (`grid-cols-1 md:grid-cols-5`)
  - Icons: `Brain` (total), `AlertTriangle` (yolo), `ShieldCheck` (verified), `Target` (high conf), `TrendingUp` (today)
  - Colors: blue, orange, green, purple, red
- **Mirror**: `src/app/(dashboard)/threats/page.tsx:157-192` (stat cards grid)
- **Validate**: `pnpm run build`

### Task 3: Create `DetectionFilters` component

- **File**: `src/components/features/ai-detection/DetectionFilters.tsx`
- **Action**: CREATE
- **Implement**:
  - Wrapper around `SearchFilter` with detection-specific filter configs
  - Status filter: All, YOLO Alerts (pending), Verified Threats
  - Type filter: All, Person, Vehicle, Boat, Weapon, Suspicious Behavior, etc. (from threats page types)
  - Stream filter: All + dynamically populated from active detection streamIds
  - Props: `{ searchTerm, onSearchChange, statusFilter, onStatusChange, typeFilter, onTypeChange, streamFilter, onStreamChange, streamOptions }`
- **Mirror**: `src/app/(dashboard)/threats/page.tsx:195-232` (SearchFilter usage)
- **Validate**: `pnpm run build`

### Task 4: Create `DetectionCard` component

- **File**: `src/components/features/ai-detection/DetectionCard.tsx`
- **Action**: CREATE
- **Implement**:
  - Accept `detection: ThreatDetection` prop
  - Show detection type badge (color-coded), confidence percentage, verified/pending status
  - Display bounding box info (x, y, w, h normalized coords)
  - Show drone GPS (`droneLatitude`, `droneLongitude`) and object GPS (`objectLatitude`, `objectLongitude`) when available
  - Show detection image thumbnail from `imageUrl` (with fallback placeholder)
  - For verified detections: show LLM `reasoning` text in a collapsible section
  - Timestamp display using `formatTimeAgo` from `@/lib/utils`
  - Color scheme: green border for verified, red for high-confidence unverified, orange for lower-confidence
- **Mirror**: `src/app/(dashboard)/threats/page.tsx:245-311` (threat card layout)
- **Validate**: `pnpm run build`

### Task 5: Update AI Detection page

- **File**: `src/app/(dashboard)/ai-detection/page.tsx`
- **Action**: UPDATE
- **Implement**:
  - Keep existing project guard (EmptyPage fallback)
  - Import and call `useAIDetections()` hook
  - Derive filtered detections based on search/filter state
  - Render `DetectionStatsBar` with stats from hook
  - Render `DetectionFilters` with controlled filter state
  - Render list of `DetectionCard` components for filtered detections
  - Empty state when no detections: "Waiting for AI detections from live streams..."
  - Loading state when socket is connecting
  - Connection status indicator in the header area
- **Mirror**: `src/app/(dashboard)/threats/page.tsx:80-318` (full page structure)
- **Validate**: `pnpm run build`

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

- [ ] `useAIDetections` hook connects to Socket.IO backend and receives `YOLO_DETECTION` and `TRACK_CONFIRMED` events
- [ ] Detection stats bar shows total, YOLO alerts, verified, high confidence, and today counts
- [ ] Detection cards display type, confidence, bounding box, GPS coords, image thumbnail
- [ ] Verified threats show LLM reasoning in a collapsible section
- [ ] Search and filter by status (all/yolo/verified), type (person/vehicle/etc.), and stream
- [ ] Connection status indicator shows connecting/connected/disconnected state
- [ ] Page handles empty state gracefully (no detections yet)
- [ ] Page handles project guard (redirect to projects if none selected)
- [ ] TypeScript compiles without errors
- [ ] Follows existing code patterns and naming conventions
