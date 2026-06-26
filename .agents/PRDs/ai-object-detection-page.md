# PRD: AI & Object Detection Page

## 1. Executive Summary

The AI & Object Detection page is a new real-time surveillance dashboard module that provides operators with live threat detection capabilities powered by YOLO object detection and LLM-based verification. The page aggregates detection feeds from all devices attached to the active project, enabling centralized monitoring of threats across multiple drone streams simultaneously.

The core value proposition is a unified operational picture: operators can watch multiple live video feeds with real-time bounding box overlays, receive instant YOLO detection alerts, see LLM-verified threat confirmations, inspect threats with geospatial context, and take action (approve/dismiss) — all from a single page. This eliminates the need to switch between separate systems for detection, verification, and response.

The MVP delivers a functional real-time detection monitoring page with multi-stream video support, dual-panel notification system (YOLO + LLM), threat inspection modal with map visualization, and bulk action capabilities — designed to match the existing dashboard's visual language and UX patterns.

---

## 2. Mission

**Mission:** Provide security operators with immediate, actionable AI-powered threat intelligence from drone surveillance feeds through a single, intuitive interface.

### Core Principles

1. **Real-time First** — Detection data flows via WebSocket; the UI must reflect threats within seconds of occurrence
2. **Context-Rich Alerts** — Every detection is enriched with image snapshots, geospatial coordinates, and LLM reasoning
3. **Action-Oriented** — Operators can verify, approve, or dismiss threats without leaving the page
4. **Multi-Stream Awareness** — Simultaneous monitoring of up to 4 drone feeds with independent detection tracking
5. **Consistent Design** — Seamless visual and interaction patterns with the existing dashboard (shadcn/ui, Tailwind, dark theme)

---

## 3. Target Users

### Primary Persona: Security Operations Center (SOC) Operator

| Attribute | Description |
|-----------|-------------|
| **Role** | Monitors drone feeds for security threats during shifts |
| **Technical Level** | Moderate — trained on the dashboard, not a developer |
| **Key Need** | Quickly identify, verify, and respond to threats across all active drones |
| **Pain Point** | Currently must juggle multiple tools/pages to correlate detection alerts with live feeds |
| **Success Metric** | Time from threat detection to operator acknowledgment |

### Secondary Persona: Security Supervisor / Incident Commander

| Attribute | Description |
|-----------|-------------|
| **Role** | Reviews approved threats, creates incidents, manages response |
| **Technical Level** | Low-to-moderate |
| **Key Need** | High-level view of all detections, ability to drill into specific threats |
| **Pain Point** | Lack of centralized detection history with audit trail |
| **Success Metric** | Completeness of threat verification before escalation |

---

## 4. MVP Scope

### In Scope

#### Core Functionality
- [x] New dashboard page at route `/ai-detection`
- [x] Sidebar navigation entry with appropriate icon (Brain from Lucide)
- [x] Multi-select stream dropdown (max 4 simultaneous streams)
- [x] WebRTC video player per selected stream (reuse existing `WebRTCPlayer` component)
- [x] Canvas overlay for real-time YOLO bounding box rendering
- [x] Dual-panel notification system: YOLO tab + LLM tab
- [x] YOLO detection cards with "AI Verification in Progress" status
- [x] LLM verification cards with "Inspect Threat" button
- [x] Threat inspection modal (shadcn Dialog) with:
  - [x] Detection snapshot image (from GCS URL)
  - [x] Threat metadata (class, confidence, device, timestamp, track ID)
  - [x] LLM reasoning text
  - [x] Mini geospatial map (MapLibre GL) showing threat location + device positions
  - [x] "Approve Threat" button with confirmation dialog (shadcn AlertDialog)
  - [x] "Dismiss" button with confirmation dialog
- [x] Bulk actions: select all, approve selected, dismiss selected
- [x] Detection history fetch from backend API (paginated)
- [x] Real-time WebSocket connection to detection backend
- [x] Stat cards row (Total Detections, Active Threats, Verified, Pending Review)
- [x] Search and filter controls (by class, status, device, time range)

#### Technical
- [x] Custom WebSocket hook with reconnection and cleanup
- [x] React Query integration for DB history + mutations
- [x] Performance optimization (useReducer, startTransition, requestAnimationFrame)
- [x] Canvas overlay with normalized coordinate mapping
- [x] Lazy-loaded MapLibre map in modal

#### Integration
- [x] Reuse existing `WebRTCPlayer` component
- [x] Reuse existing `StatCard` and `SearchFilter` components
- [x] Consistent with `MainLayout` wrapper pattern
- [x] Project-scoped (only shows devices from active project)

### Out of Scope (Future Phases)

- [ ] Mobile responsiveness (desktop-only ops center)
- [ ] Severity levels (all detections from configured device classes are threats)
- [ ] Audio alerts / siren triggers
- [ ] Automated response actions (lock doors, activate lights)
- [ ] Detection heatmaps on geospatial page
- [ ] Export detection reports (PDF/CSV)
- [ ] User role-based access control for threat approval
- [ ] Multi-project detection aggregation
- [ ] Detection class training/configuration UI
- [ ] Real-time model performance metrics
- [ ] Alert sound notifications
- [ ] Integration with external security systems (SIEM, PSIM)

---

## 5. User Stories

### Primary User Stories

**US-1: Stream Selection**
> As a SOC operator, I want to select up to 4 drone streams to monitor simultaneously, so that I can watch multiple areas of interest at once.

*Acceptance Criteria:*
- Dropdown shows all streams from devices in the active project
- Maximum 4 streams can be selected (with clear indication when limit reached)
- Deselecting a stream removes its video card and clears its detection list
- Stream selection persists during session (until page navigation)

**US-2: Real-time YOLO Detection Alerts**
> As a SOC operator, I want to see YOLO detection alerts appear in real-time as objects are detected, so that I am immediately aware of potential threats.

*Acceptance Criteria:*
- YOLO detections appear as cards in the YOLO tab within 2 seconds
- Each card shows: detected class, confidence score, track ID, timestamp, source device
- Status badge shows "AI Verification in Progress" with animated pulse indicator
- Detection cards auto-scroll to newest, capped at ~50 visible items
- When LLM confirms a detection, the card status updates to "Verified" with a checkmark

**US-3: LLM Verified Threats**
> As a SOC operator, I want to see LLM-verified threats separately from raw YOLO detections, so that I can focus on confirmed threats that require action.

*Acceptance Criteria:*
- Verified threats appear in the LLM tab as distinct cards
- Each card shows: class, confidence, LLM reasoning (truncated with See More), timestamp
- "Inspect Threat" button opens a detailed inspection modal
- Cards persist until manually approved or dismissed

**US-4: Threat Inspection**
> As a SOC operator, I want to inspect a verified threat in detail — including the detection image, location on a map, and AI reasoning — so that I can make an informed decision about the threat.

*Acceptance Criteria:*
- Modal opens with detection snapshot image from GCS URL
- Mini map shows threat location marker (red) and all online device positions
- Metadata grid shows: class, confidence, device name, timestamp, track ID, coordinates
- LLM reasoning text is fully readable (expandable if long)
- "Approve Threat" and "Dismiss" buttons are prominently displayed

**US-5: Approve Threat**
> As a SOC operator, I want to approve a verified threat with a confirmation step, so that I don't accidentally confirm false positives.

*Acceptance Criteria:*
- Clicking "Approve Threat" opens an AlertDialog confirmation
- Confirmation message: "Approve this threat? This will mark it as confirmed and may trigger automated responses."
- On confirm: API call to backend, toast success, card status updates to "Approved"
- Approved threat marker remains visible on the geospatial map until resolved

**US-6: Bulk Actions**
> As a SOC operator, I want to select multiple detections and approve or dismiss them in bulk, so that I can efficiently process high volumes of alerts.

*Acceptance Criteria:*
- Checkbox on each detection card for selection
- "Select All" checkbox in panel header
- "Approve Selected" and "Dismiss Selected" buttons appear when selections exist
- Bulk action triggers confirmation dialog
- Progress indicator during bulk operation

**US-7: Detection History**
> As a SOC supervisor, I want to view paginated detection history from the database, so that I can review past threats and ensure nothing was missed.

*Acceptance Criteria:*
- "Fetch History" button loads historical detections from backend API
- Infinite scroll pagination with cursor-based loading
- Filters (class, status, device, time range) apply to history fetch
- History data merges with live WebSocket data without duplicates

**US-8: Approved Threats on Geospatial Map**
> As a SOC operator, I want approved threats to appear on the geospatial map, so that I can see the spatial distribution of confirmed threats across the operational area.

*Acceptance Criteria:*
- After approval, threat marker (red pin) appears on the geospatial map
- Marker persists until the threat is marked as "resolved" in the system
- Marker shows threat class on hover
- Clicking marker shows threat details popup

### Technical User Stories

**US-T1: WebSocket Connection Management**
> As a developer, I want a reusable WebSocket hook with automatic reconnection and proper cleanup, so that the detection page maintains a reliable connection without memory leaks.

*Acceptance Criteria:*
- Exponential backoff reconnection (3s base, max 30s)
- `mountedRef` pattern prevents state updates after unmount
- Cleanup closes WebSocket and cancels pending timers
- Connection status exposed for UI indicator

**US-T2: Canvas Overlay Performance**
> As a developer, I want bounding boxes rendered via requestAnimationFrame on a canvas overlay, so that detection visualization is smooth at 60fps without impacting React rendering performance.

*Acceptance Criteria:*
- Detection data stored in `useRef` (not state) to avoid re-renders
- `requestAnimationFrame` loop for canvas drawing
- Canvas dimensions match video intrinsic size
- Coordinate mapping: normalized (0-1) → pixel space

---

## 6. Core Architecture & Patterns

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Next.js App Router                     │
│                                                          │
│  ┌──────────────────────────────────────────────────────┐│
│  │  (dashboard)/ai-detection/page.tsx                   ││
│  │  └── AIDetectionDashboard.tsx                        ││
│  │       ├── StreamSelector (multi-select)              ││
│  │       ├── VideoGrid                                  ││
│  │       │   └── StreamVideoCard × N                    ││
│  │       │       ├── WebRTCPlayer (existing)            ││
│  │       │       └── Canvas overlay (rAF loop)          ││
│  │       ├── NotificationPanel                          ││
│  │       │   ├── YOLOTab → DetectionCard[]              ││
│  │       │   └── LLMTab  → DetectionCard[]              ││
│  │       ├── ThreatInspectionModal (shadcn Dialog)      ││
│  │       │   ├── Snapshot image                         ││
│  │       │   ├── ThreatMap (MapLibre GL)                ││
│  │       │   └── Action buttons                         ││
│  │       ├── ConfirmDialog (shadcn AlertDialog)         ││
│  │       └── BulkActions                                ││
│  └──────────────────────────────────────────────────────┘│
│                                                          │
│  ┌──────────────────────────────────────────────────────┐│
│  │  Hooks Layer                                         ││
│  │  ├── useAIDetectionWebSocket (native WS + useReducer)││
│  │  ├── useDetections (useInfiniteQuery for DB)         ││
│  │  └── useDetectionActions (mutations)                 ││
│  └──────────────────────────────────────────────────────┘│
│                                                          │
│  ┌──────────────────────────────────────────────────────┐│
│  │  Data Layer                                          ││
│  │  ├── WebSocket → detection backend (YOLO + LLM)     ││
│  │  ├── REST API → detection history (paginated)        ││
│  │  └── GCS → detection snapshot images                 ││
│  └──────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────┘
```

### Directory Structure

```
src/app/(dashboard)/ai-detection/
├── page.tsx

src/components/features/ai-detection/
├── AIDetectionDashboard.tsx
├── StreamSelector.tsx
├── VideoGrid.tsx
├── StreamVideoCard.tsx
├── NotificationPanel.tsx
├── YOLOTab.tsx
├── LLMTab.tsx
├── DetectionCard.tsx
├── ThreatInspectionModal.tsx
├── ThreatMap.tsx
├── ConfirmDialog.tsx
└── BulkActions.tsx

src/hooks/
├── useAIDetectionWebSocket.ts
├── useDetections.ts
└── useDetectionActions.ts

src/types/
└── detection.ts

src/lib/config/
└── config.ts (add AI_WS_URL, AI_API_URL)
```

### Key Design Patterns

1. **Component Composition** — `MainLayout` → `AIDetectionDashboard` → feature components
2. **Headless WebRTC** — Reuse existing `WebRTCPlayer` for connection management
3. **Canvas in rAF** — Bounding boxes via `requestAnimationFrame`, detection data in refs
4. **Dual Data Source** — REST for history, WebSocket for live; merged via React Query cache
5. **Optimistic Mutations** — Approve/dismiss updates UI immediately, rolls back on error
6. **Lazy Map** — `next/dynamic` for MapLibre GL in modal (SSR disabled)

---

## 7. Tools/Features

### Feature 1: Multi-Stream Video Grid

**Purpose:** Display up to 4 live WebRTC video feeds with real-time YOLO bounding box overlays.

| Component | Description |
|-----------|-------------|
| `StreamSelector` | Multi-select dropdown, max 4, shows streams from project devices |
| `VideoGrid` | Responsive grid layout (1-4 streams), 2×2 when 4 selected |
| `StreamVideoCard` | Individual video + canvas overlay card with device name label |

**Behavior:**
- Selecting a stream initiates WebRTC connection via existing `WebRTCPlayer`
- Canvas overlay renders bounding boxes at 60fps using `requestAnimationFrame`
- Bounding boxes include class label and confidence score
- Closing/removing a stream closes the peer connection and clears detection list

### Feature 2: Dual-Panel Notification System

**Purpose:** Separate YOLO (raw detection) and LLM (verified threat) notifications with status linking.

| Component | Description |
|-----------|-------------|
| `NotificationPanel` | Tab container with YOLO and LLM tabs |
| `YOLOTab` | List of YOLO detection cards with verification status |
| `LLMTab` | List of LLM-verified threat cards with action buttons |
| `DetectionCard` | Shared card component with type-specific rendering |

**Behavior:**
- YOLO detections auto-appear with "AI Verification in Progress" badge
- When LLM confirms, YOLO card status updates to "Verified"
- LLM card appears simultaneously with full reasoning
- Cards auto-scroll, capped at ~50 items per panel
- Tab badge shows count of unread/new detections

### Feature 3: Threat Inspection Modal

**Purpose:** Provide rich context for a verified threat to support operator decision-making.

| Component | Description |
|-----------|-------------|
| `ThreatInspectionModal` | shadcn Dialog with ScrollArea for content |
| `ThreatMap` | Lightweight MapLibre GL map with threat + device markers |

**Content:**
- Detection snapshot image (from GCS URL in WebSocket payload)
- Threat metadata grid (class, confidence, device, timestamp, track ID, coordinates)
- LLM reasoning text (expandable)
- Mini map (dark basemap, threat marker in red, device markers in default)

**Interactions:**
- "Approve Threat" button → ConfirmDialog → API call → toast → marker on geospatial map
- "Dismiss" button → ConfirmDialog → API call → toast → card removed from list
- Close button or Escape key closes modal

### Feature 4: Bulk Actions

**Purpose:** Enable efficient processing of high detection volumes.

**Behavior:**
- Checkbox on each detection card
- "Select All" checkbox in panel header
- "Approve Selected" / "Dismiss Selected" buttons appear when selections > 0
- Confirmation dialog for bulk operations
- Progress indicator during bulk API calls

### Feature 5: Detection History

**Purpose:** Access paginated historical detections from the database.

**Behavior:**
- "Fetch History" button triggers initial load
- Infinite scroll for subsequent pages
- Filters apply to history query
- Cursor-based pagination (not offset)
- Merges with live WebSocket data (deduplication by detection ID)

---

## 8. Technology Stack

### Frontend

| Technology | Version | Purpose |
|------------|---------|---------|
| Next.js | 15 (App Router) | Framework |
| React | 18 | UI library |
| TypeScript | 5.x | Type safety |
| Tailwind CSS | 3.3 | Styling |
| shadcn/ui | New York | UI components (Dialog, AlertDialog, ScrollArea) |
| Lucide React | latest | Icons |
| TanStack React Query | 5.x | Server state, caching, mutations |
| MapLibre GL | 5.8 | Maps (modal) |
| react-map-gl | 8.x | React wrapper for MapLibre |
| Sonner | latest | Toast notifications |

### To Install

```bash
pnpm dlx shadcn@latest add dialog alert-dialog scroll-area
```

### Already Available (No Install)

| Library | Purpose |
|---------|---------|
| `react-map-gl/maplibre` | Map in modal |
| `maplibre-gl` | Map renderer |
| `@tanstack/react-query` | Data fetching |
| `sonner` | Toasts |
| `lucide-react` | Icons |

### Data Sources

| Source | Protocol | Purpose |
|--------|----------|---------|
| Detection Backend | WebSocket (native) | Real-time YOLO + LLM events |
| Detection Backend | REST API | Paginated detection history |
| GCS Bucket | HTTPS | Detection snapshot images |
| DJI Cloud API | REST/WebSocket | Device list, positions (existing) |

---

## 9. Security & Configuration

### Authentication

- Detection WebSocket connection requires JWT token (same pattern as `useDJIWebSocket`)
- REST API calls use authenticated Axios instance (`djiRequest` or dedicated client)
- Token retrieved from `getToken()` in `token-store.ts`

### Configuration

Add to `src/lib/config/config.ts`:

```typescript
export const AI_DETECTION_CONFIG = {
  WS_URL: process.env.NEXT_PUBLIC_AI_WS_URL || 'ws://localhost:8000/ws',
  API_URL: process.env.NEXT_PUBLIC_AI_API_URL || 'http://localhost:8000/api',
  MAX_STREAMS: 4,
  MAX_DETECTIONS_PER_PANEL: 50,
  DETECTION_HISTORY_PAGE_SIZE: 20,
}
```

Environment variables:
```
NEXT_PUBLIC_AI_WS_URL=ws://your-detection-backend/ws
NEXT_PUBLIC_AI_API_URL=http://your-detection-backend/api
```

### Security Scope

**In Scope:**
- JWT authentication for WebSocket and REST connections
- No secrets or keys in frontend code
- HTTPS for GCS image URLs

**Out of Scope:**
- Role-based access control for threat approval
- Audit logging of approval actions
- Rate limiting on detection submissions

---

## 10. API Specification

### WebSocket Events

**Connection:**
```
ws://<host>/ws?token=<jwt>
```

**Incoming: YOLO Detection**
```json
{
  "event": "YOLO_DETECTION",
  "data": {
    "streamId": "cam-0183",
    "timestamp": "2026-06-24T10:30:00Z",
    "deviceId": "DRONE-001",
    "detections": [
      {
        "class": "person",
        "score": 0.87,
        "trackId": 1847,
        "x": 0.45,
        "y": 0.32,
        "width": 0.12,
        "height": 0.28
      }
    ]
  }
}
```

**Incoming: LLM Verification**
```json
{
  "event": "TRACK_CONFIRMED",
  "data": {
    "streamId": "cam-0183",
    "timestamp": "2026-06-24T10:30:05Z",
    "deviceId": "DRONE-001",
    "detections": [
      {
        "class": "person",
        "score": 0.94,
        "trackId": 1847,
        "reasoning": "Individual detected carrying what appears to be a firearm near the restricted perimeter fence. Confidence is high due to the distinctive L-shaped profile and the individual's movement pattern toward the secure zone.",
        "imageUrl": "https://storage.googleapis.com/your-bucket/detections/snap-1847.jpg",
        "latitude": 6.4238,
        "longitude": 3.4219
      }
    ]
  }
}
```

**Incoming: Detection Canvas Overlay**
```json
{
  "event": "DETECTIONS",
  "data": {
    "streamId": "cam-0183",
    "detections": [
      {
        "class": "person",
        "score": 0.87,
        "x": 0.45,
        "y": 0.32,
        "width": 0.12,
        "height": 0.28
      }
    ]
  }
}
```

### REST Endpoints

**GET /api/detections** — Paginated detection history
```
Query: cursor=<id>&limit=20&class=person&status=pending&deviceId=DRONE-001
Response: {
  "detections": DetectionRecord[],
  "nextCursor": string | null
}
```

**POST /api/detections/:id/approve** — Approve a threat
```
Response: { "success": true, "detection": DetectionRecord }
```

**POST /api/detections/:id/dismiss** — Dismiss a threat
```
Response: { "success": true, "detection": DetectionRecord }
```

**POST /api/detections/bulk-action** — Bulk approve/dismiss
```
Body: { "ids": string[], "action": "approve" | "dismiss" }
Response: { "success": true, "updated": number }
```

---

## 11. Success Criteria

### MVP Success Definition

The AI & Object Detection page is successful when a SOC operator can:
1. Select and monitor multiple drone streams simultaneously
2. See YOLO detections appear in real-time with bounding box overlays
3. Distinguish between raw YOLO alerts and LLM-verified threats
4. Inspect a threat with full context (image, map, reasoning)
5. Approve or dismiss threats with confirmation
6. Process multiple detections efficiently via bulk actions

### Functional Requirements

- [ ] Page loads within 3 seconds
- [ ] WebSocket connects and receives detections within 5 seconds
- [ ] Bounding boxes render at ≥30fps on canvas overlay
- [ ] Detection cards appear within 2 seconds of WebSocket event
- [ ] Threat inspection modal opens within 500ms of button click
- [ ] Map renders in modal within 1 second
- [ ] Approve/dismiss API calls complete within 3 seconds
- [ ] Bulk operations process 10 items within 5 seconds

### Quality Indicators

- [ ] Zero memory leaks from WebSocket or canvas (verified via Chrome DevTools)
- [ ] No React console warnings in production
- [ ] Consistent visual design with existing dashboard pages
- [ ] All interactive elements have proper loading/disabled states
- [ ] Error states handled gracefully (WS disconnection, API failures)

### User Experience Goals

- [ ] Operator can identify a threat within 5 seconds of detection
- [ ] Operator can approve/dismiss a threat in <10 seconds
- [ ] Bulk actions reduce per-threat processing time by 5x
- [ ] Page feels responsive even with 4 active streams + 50+ detections

---

## 12. Implementation Phases

### Phase 1: Foundation (Days 1-2)

**Goal:** Page structure, navigation, stream selection, and video grid working.

**Deliverables:**
- [ ] Create `/ai-detection/page.tsx` with `MainLayout` wrapper
- [ ] Add sidebar navigation entry (Brain icon)
- [ ] Implement `StreamSelector` component (multi-select, max 4)
- [ ] Implement `VideoGrid` and `StreamVideoCard` components
- [ ] Integrate existing `WebRTCPlayer` for video streams
- [ ] Add stat cards row (Total Detections, Active Threats, Verified, Pending)
- [ ] Add search/filter controls

**Validation:**
- Page appears in sidebar and navigates correctly
- Can select up to 4 streams and see live video
- Stat cards display correctly
- Design matches existing dashboard pages

### Phase 2: Real-time Detection (Days 3-4)

**Goal:** WebSocket integration, YOLO/LLM panels, and canvas overlay working.

**Deliverables:**
- [ ] Create `useAIDetectionWebSocket` hook with reconnection
- [ ] Create detection type definitions (`detection.ts`)
- [ ] Implement `NotificationPanel` with YOLO and LLM tabs
- [ ] Implement `DetectionCard` component with status badges
- [ ] Implement canvas overlay with `requestAnimationFrame` loop
- [ ] Wire WebSocket events to panel updates and canvas rendering
- [ ] Implement "AI Verification in Progress" → "Verified" status linking

**Validation:**
- YOLO detections appear in left panel with correct styling
- LLM verifications appear in right panel with reasoning
- Bounding boxes render smoothly on video canvas
- Status updates propagate from YOLO to LLM panel

### Phase 3: Threat Inspection & Actions (Days 5-6)

**Goal:** Inspection modal, map, approve/dismiss, and bulk actions working.

**Deliverables:**
- [ ] Install shadcn Dialog, AlertDialog, ScrollArea
- [ ] Implement `ThreatInspectionModal` with image, metadata, reasoning
- [ ] Implement `ThreatMap` (lazy-loaded MapLibre GL)
- [ ] Implement `ConfirmDialog` (AlertDialog) for approve/dismiss
- [ ] Implement `useDetectionActions` hook (mutations with optimistic updates)
- [ ] Implement `BulkActions` component with select all, approve/dismiss selected
- [ ] Wire approve action to geospatial map marker persistence

**Validation:**
- "Inspect Threat" opens modal with all threat details
- Map shows threat location and device positions
- Approve/dismiss works with confirmation and toast feedback
- Bulk actions process multiple selections correctly
- Approved threats appear on geospatial map

### Phase 4: History & Polish (Days 7-8)

**Goal:** Detection history, performance optimization, and edge cases.

**Deliverables:**
- [ ] Implement `useDetections` hook with `useInfiniteQuery`
- [ ] Implement infinite scroll for detection history
- [ ] Add "Fetch History" button and integrate with filters
- [ ] Performance optimization (useMemo, useCallback, startTransition)
- [ ] Edge case handling (WS disconnection UI, empty states, error states)
- [ ] Canvas coordinate mapping validation
- [ ] Memory leak testing and cleanup verification

**Validation:**
- History loads and paginates correctly
- Filters apply to both live and historical data
- No memory leaks after 30 minutes of operation
- Graceful handling of WebSocket disconnection
- All edge cases display appropriate empty/error states

---

## 13. Future Considerations

### Post-MVP Enhancements

1. **Detection Heatmap** — Aggregate approved threats on geospatial page as heatmap layer
2. **Export Reports** — Generate PDF/CSV reports of detections for a time period
3. **Audio Alerts** — Play alert sound for high-confidence detections
4. **Automated Responses** — Trigger actions (lock doors, activate lights) on threat approval
5. **Multi-Project View** — Aggregate detections across multiple projects
6. **Detection Analytics** — Charts showing detection trends over time
7. **Custom Alert Rules** — Configure which classes trigger notifications
8. **Mobile Responsiveness** — Adapt layout for tablet/phone operators

### Integration Opportunities

1. **Incident Management** — Auto-create incidents from approved threats
2. **Geospatial Page** — Add detection layer to main map
3. **Dashboard** — Add detection summary widgets
4. **Reports Page** — Include detection data in generated reports

---

## 14. Risks & Mitigations

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| **WebSocket backend not ready** | Cannot test real-time detections | Medium | Create mock WebSocket server for development; design hook to accept configurable WS URL |
| **GCS image URLs not in WS payload** | Threat inspection modal shows no image | Medium | Implement placeholder image with retry; backend team to add imageUrl field |
| **Canvas performance with 4 streams** | Frame drops on lower-end hardware | Low | Cap at 4 streams; use `requestAnimationFrame` with frame skipping; profile early |
| **MapLibre GL bundle size** | Increases initial page load | Low | Lazy load with `next/dynamic`; map only renders when modal opens |
| **Detection volume spikes** | UI becomes unresponsive | Medium | Cap visible detections at 50; use `startTransition` for non-urgent updates; implement virtual scrolling if needed |
| **React 19 + react-map-gl compatibility** | Map crashes on modal open/close | Low | Only mount map when modal is open; use `react-map-gl@^8.1.0` for latest fixes |

---

## 15. Appendix

### Related Documents

- Existing HTML prototype: `ai-detection-page.html` (reference implementation)
- DJI WebSocket hook: `src/hooks/useDJIWebSocket.ts` (pattern reference)
- Geospatial map: `src/components/features/geospaital-map/geo-map.tsx` (map patterns)
- Threats page: `src/app/(dashboard)/threats/page.tsx` (design reference)
- WebRTC player: `src/components/features/streams/WebRTCPlayer.tsx` (reuse)

### Key Dependencies

| Package | Purpose | Already Installed |
|---------|---------|-------------------|
| `react-map-gl` | Map React wrapper | Yes |
| `maplibre-gl` | Map renderer | Yes |
| `@tanstack/react-query` | Data fetching | Yes |
| `lucide-react` | Icons | Yes |
| `sonner` | Toasts | Yes |
| `shadcn/ui dialog` | Modal | **No — needs install** |
| `shadcn/ui alert-dialog` | Confirmation | **No — needs install** |
| `shadcn/ui scroll-area` | Scrollable modal | **No — needs install** |

### Project Structure Reference

```
src/
├── app/(dashboard)/        # Protected dashboard pages
├── components/
│   ├── features/           # Feature-specific components
│   ├── ui/                 # shadcn/ui primitives
│   └── layout/             # MainLayout, Sidebar, Header
├── hooks/                  # Custom React hooks
├── lib/config/             # Configuration, API clients
└── providers/              # React Context providers
```
