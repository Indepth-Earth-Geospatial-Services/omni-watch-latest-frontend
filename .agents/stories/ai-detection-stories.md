# AI & Object Detection Page - User Stories

Generated from: `.agents/PRDs/ai-object-detection-page.md`

---

## Phase 1: Foundation (Days 1-2)

---

### AID-1: Create AI Detection Page Shell

**Type**: Feature
**Jira Type**: Story
**Priority**: High
**Complexity**: Small
**Phase**: 1 - Foundation
**Labels**: `frontend`, `layout`

#### Description
As a SOC operator, I want a new "AI Detection" page accessible from the sidebar navigation, so that I can access the AI-powered threat detection dashboard.

#### Acceptance Criteria
- [ ] Given I am logged in, when I look at the sidebar, then I see an "AI Detection" entry with a Brain icon
- [ ] Given I click "AI Detection" in the sidebar, when the page loads, then I see the MainLayout with title "AI & Object Detection" and subtitle showing the active project name
- [ ] Given no project is active, when I navigate to /ai-detection, then I see the EmptyPage component with a redirect to Projects
- [ ] Given the page loads, when I view the content area, then I see a placeholder layout ready for child components

#### Technical Notes

**1. Create page file:** `src/app/(dashboard)/ai-detection/page.tsx`

Follow the exact pattern from `src/app/(dashboard)/geospatial/page.tsx`:
```tsx
'use client';
import { MainLayout } from '@/components/layout/main-layout';
import { Brain } from 'lucide-react';

export default function AIDetectionPage() {
  return (
    <MainLayout
      title='AI & Object Detection'
      subtitle='Real-time threat detection and verification'
    >
      {/* Child components will be added in subsequent stories */}
      <div className="space-y-6">
        {/* Placeholder for stat cards, video grid, notification panel */}
      </div>
    </MainLayout>
  );
}
```

**2. Add sidebar navigation entry:** `src/components/layout/sidebar.tsx`

Add to the `navigation` array (line 22-34), after the Control entry:
```tsx
import { Brain } from 'lucide-react';  // Add to imports at line 7

// Add to navigation array:
{ name: 'AI Detection', href: '/ai-detection', icon: Brain },
```

**3. Project context and EmptyPage:**

The page can access the active project via `useProject()` hook from `@/providers/ProjectProvider`:
```tsx
import { useProject } from '@/providers/ProjectProvider';
import { EmptyPage } from '@/components/features/streams/EmptyPage';
import { Brain } from 'lucide-react';
import { useRouter } from 'next/navigation';

// Inside component:
const { activeProject } = useProject();
const router = useRouter();

if (!activeProject) {
  return (
    <MainLayout title='AI & Object Detection' subtitle=''>
      <EmptyPage
        icon={<Brain className="w-6 h-6 text-sky-400" />}
        title="No Project Selected"
        body="Select a project to access AI detection features"
        action={{ label: "Go to Projects", onClick: () => router.push('/projects') }}
      />
    </MainLayout>
  );
}
```

**4. Key files to reference:**
- `src/app/(dashboard)/geospatial/page.tsx` — page shell pattern
- `src/components/layout/sidebar.tsx` — navigation array (lines 22-34)
- `src/components/layout/main-layout.tsx` — MainLayout wrapper
- `src/components/features/streams/EmptyPage.tsx` — empty state component

#### Dependencies
- None

---

### AID-2: Install shadcn/ui Dialog Components

**Type**: Technical
**Jira Type**: Task
**Priority**: High
**Complexity**: Small
**Phase**: 1 - Foundation
**Labels**: `frontend`, `dependencies`

#### Description
As a developer, I want to install the shadcn/ui Dialog, AlertDialog, and ScrollArea components, so that the threat inspection modal and confirmation dialogs can be built using consistent UI primitives.

#### Acceptance Criteria
- [ ] Given I run `pnpm dlx shadcn@latest add dialog alert-dialog scroll-area`, when the command completes, then the components exist in `src/components/ui/`
- [ ] Given the components are installed, when I import them, then TypeScript resolves the imports without errors
- [ ] Given the components are installed, when I run `pnpm build`, then the build succeeds without errors

#### Technical Notes
- Run: `pnpm dlx shadcn@latest add dialog alert-dialog scroll-area`
- Verify components are added to `src/components/ui/`
- Verify `components.json` is updated if needed
- These are Radix UI primitives styled with shadcn/ui New York theme

#### Dependencies
- None

---

### AID-3: Add Detection Configuration

**Type**: Technical
**Jira Type**: Task
**Priority**: High
**Complexity**: Small
**Phase**: 1 - Foundation
**Labels**: `frontend`, `config`

#### Description
As a developer, I want to add AI detection configuration to the centralized config, so that WebSocket URLs, API endpoints, and feature limits are configurable via environment variables.

#### Acceptance Criteria
- [ ] Given I add `AI_DETECTION_CONFIG` to `src/lib/config/config.ts`, when I import it, then the config object is available with WS_URL, API_URL, MAX_STREAMS, MAX_DETECTIONS_PER_PANEL, DETECTION_HISTORY_PAGE_SIZE
- [ ] Given I set `NEXT_PUBLIC_AI_WS_URL` in `.env`, when I access `AI_DETECTION_CONFIG.WS_URL`, then it returns the environment value
- [ ] Given no environment variables are set, when I access the config, then it falls back to default values (backend at `136.116.89.216`)

#### Technical Notes
- Add to `src/lib/config/config.ts`:
```typescript
export const AI_DETECTION_CONFIG = {
  WS_URL: process.env.NEXT_PUBLIC_AI_WS_URL || 'ws://136.116.89.216',
  API_URL: process.env.NEXT_PUBLIC_AI_API_URL || 'http://136.116.89.216/api',
  MAX_STREAMS: 4,
  MAX_DETECTIONS_PER_PANEL: 50,
  DETECTION_HISTORY_PAGE_SIZE: 20,
}
```
- Add env vars to `.env.example`
- Backend WebSocket endpoint: `ws://136.116.89.216` emits `YOLO_DETECTION` and `TRACK_CONFIRMED` events

#### Dependencies
- None

---

### AID-4: Create Detection Type Definitions

**Type**: Technical
**Jira Type**: Task
**Priority**: High
**Complexity**: Small
**Phase**: 1 - Foundation
**Labels**: `frontend`, `types`

#### Description
As a developer, I want TypeScript type definitions for all detection-related data structures, so that the codebase has type safety across WebSocket events, API responses, and component props.

#### Acceptance Criteria
- [ ] Given I create `src/lib/types/threats.ts`, when I import types, then I can use `YoloDetectionEvent`, `TrackConfirmedEvent`, `ThreatDetection`, `ThreatSocketStatus`
- [ ] Given the types are defined, when I run `pnpm typecheck`, then no type errors are introduced
- [ ] Given WebSocket events arrive, when parsed with these types, then all fields are properly typed including dual GPS coordinates

#### Technical Notes
- Create `src/lib/types/threats.ts` (already created with dual GPS support)
- Export types from `src/lib/types/index.ts`
- Types based on actual backend WebSocket data contract:

**`YOLO_DETECTION` event shape:**
```typescript
interface YoloDetection {
  x: number; y: number; width: number; height: number;  // normalized 0-1
  score: number;      // YOLO confidence [0,1]
  class: string;      // 'person', 'vehicle', etc.
  trackId: number;    // IoU tracking ID
  objectKey?: string; // MinIO crop key
  imageUrl: string | null;  // presigned MinIO URL (24h expiry)
  latitude: number | null;  // drone GPS lat
  longitude: number | null; // drone GPS lon
  objectLatitude: number | null;   // detected object GPS lat (nullable)
  objectLongitude: number | null;  // detected object GPS lon (nullable)
}
```

**`TRACK_CONFIRMED` event shape:**
```typescript
interface TrackConfirmedDetection {
  // Same bounding box + metadata fields as YoloDetection
  reasoning: string;  // Gemini LLM explanation
  // Same dual GPS fields
}
```

**Dual GPS Coordinate System:**
- `latitude`/`longitude`: Drone position when detection occurred (always available if drone has GPS fix)
- `objectLatitude`/`objectLongitude`: Detected object's geolocation (null if not resolvable from video)

#### Dependencies
- None

---

### AID-5: Implement Stream Selector Component

**Type**: Feature
**Jira Type**: Story
**Priority**: High
**Complexity**: Medium
**Phase**: 1 - Foundation
**Labels**: `frontend`, `components`

#### Description
As a SOC operator, I want to select up to 4 drone streams from a multi-select dropdown, so that I can choose which video feeds to monitor for AI detection.

#### Acceptance Criteria
- [ ] Given I am on the AI Detection page, when I look at the toolbar, then I see a multi-select dropdown labeled "Select Streams"
- [ ] Given I click the dropdown, when it opens, then I see all streams from devices in the active project
- [ ] Given I have selected 4 streams, when I try to select a 5th, then the dropdown shows "Maximum 4 streams reached" and prevents selection
- [ ] Given I deselect a stream, when the selection changes, then the video card for that stream is removed from the grid
- [ ] Given I navigate away and return, when the page loads, then my stream selection is preserved (session state)

#### Technical Notes
- Create `src/components/features/ai-detection/StreamSelector.tsx`
- Use project devices from `useProject()` provider
- Filter to only show streams from online devices
- State managed in parent `AIDetectionDashboard`
- Follow existing `DeviceSidebar` pattern from live-feed for device list
- Max 4 enforced at component level with visual feedback

#### Dependencies
- AID-1 (page shell must exist)

---

### AID-6: Implement Video Grid and Stream Video Card

**Type**: Feature
**Jira Type**: Story
**Priority**: High
**Complexity**: Large
**Phase**: 1 - Foundation
**Labels**: `frontend`, `components`, `webrtc`

#### Description
As a SOC operator, I want to see live WebRTC video feeds in a responsive grid with bounding box canvas overlays, so that I can visually monitor multiple streams with real-time detection visualization.

#### Acceptance Criteria
- [ ] Given I have selected streams, when the grid renders, then each stream shows a video feed in a card with the device name as label
- [ ] Given 1 stream is selected, when I view the grid, then it fills the available width
- [ ] Given 4 streams are selected, when I view the grid, then they display in a 2×2 grid layout
- [ ] Given a video feed is playing, when I look at the card, then a canvas overlay is positioned on top of the video for bounding box rendering
- [ ] Given I remove a stream, when the card unmounts, then the WebRTC peer connection is closed and tracks are stopped

#### Technical Notes
- Create `src/components/features/ai-detection/VideoGrid.tsx`
- Create `src/components/features/ai-detection/StreamVideoCard.tsx`
- Reuse existing `WebRTCPlayer` component (headless, manages RTCPeerConnection)
- Canvas overlay pattern:
  - `<div className="relative">` → `<video>` + `<canvas className="absolute inset-0 pointer-events-none">`
  - Canvas dimensions match video intrinsic size
  - `requestAnimationFrame` loop for drawing (will be wired in Phase 2)
- Follow `MultiFeedView` pattern from live-feed for grid layout
- Clean up peer connections on unmount

#### Dependencies
- AID-1 (page shell)
- AID-5 (stream selector provides selected streams)

---

### AID-7: Add Stat Cards Row

**Type**: Feature
**Jira Type**: Story
**Priority**: Medium
**Complexity**: Small
**Phase**: 1 - Foundation
**Labels**: `frontend`, `components`, `metrics`

#### Description
As a SOC operator, I want to see summary statistics at the top of the AI Detection page, so that I can quickly understand the current detection status across all streams.

#### Acceptance Criteria
- [ ] Given I am on the AI Detection page, when I look at the top, then I see 4 stat cards: Total Detections, Active Threats, Verified, Pending Review
- [ ] Given detections are coming in via WebSocket, when the stats update, then the card values reflect current counts
- [ ] Given no detections exist, when I view the cards, then they show 0 with appropriate icons

#### Technical Notes
- Create `src/components/features/ai-detection/StatCards.tsx` or inline in dashboard
- Reuse existing `StatCard` component from `src/components/features/metrics/stat-card.tsx`
- Colors: Total=blue, Active=red, Verified=green, Pending=orange
- Icons from lucide-react: Activity, ShieldAlert, CheckCircle, Clock
- Stats derived from WebSocket detection state (will be wired in Phase 2)

#### Dependencies
- AID-1 (page shell)
- Reuses existing `StatCard` component

---

### AID-8: Add Search and Filter Controls

**Type**: Feature
**Jira Type**: Story
**Priority**: Medium
**Complexity**: Small
**Phase**: 1 - Foundation
**Labels**: `frontend`, `components`, `filters`

#### Description
As a SOC operator, I want search and filter controls on the AI Detection page, so that I can quickly find specific detections by class, status, device, or time range.

#### Acceptance Criteria
- [ ] Given I am on the AI Detection page, when I look at the toolbar, then I see a search input and filter dropdowns
- [ ] Given I type in the search box, when the value changes, then detections are filtered by class name or description
- [ ] Given I select a status filter, when I choose "Pending", then only pending YOLO detections are shown
- [ ] Given I select a device filter, when I choose a specific device, then only detections from that device are shown

#### Technical Notes
- Reuse existing `SearchFilter` component from `src/components/features/filters/search-filter.tsx`
- Filters: Status (All/Pending/Verified/Approved/Dismissed), Device (All + project devices), Time Range (Today/Last Hour/Last 24h/All)
- Filter state managed in parent dashboard component
- Filters apply to both live WebSocket data and historical data

#### Dependencies
- AID-1 (page shell)
- Reuses existing `SearchFilter` component

---

## Phase 2: Real-time Detection (Days 3-4)

---

### AID-9: Create useAIDetectionWebSocket Hook

**Type**: Technical
**Jira Type**: Task
**Priority**: High
**Complexity**: Large
**Phase**: 2 - Real-time Detection
**Labels**: `frontend`, `hooks`, `websocket`

#### Description
As a developer, I want a reusable WebSocket hook that connects to the AI detection backend at `136.116.89.216`, handles reconnection, and dispatches detection events, so that the detection page has a reliable real-time data connection.

#### Acceptance Criteria
- [ ] Given I call `useAIDetectionWebSocket({ url, onYOLODetection, onTrackConfirmed })`, when the component mounts, then a WebSocket connection to `136.116.89.216` is established
- [ ] Given the WebSocket disconnects, when 3 seconds pass, then it attempts to reconnect with exponential backoff (3s, 4.5s, 6.75s, max 30s)
- [ ] Given the component unmounts, when cleanup runs, then the WebSocket is closed and all timers are cancelled
- [ ] Given a `YOLO_DETECTION` event arrives, when the hook processes it, then the `onYOLODetection` callback is invoked with parsed `YoloDetectionEvent` data including dual GPS coordinates
- [ ] Given a `TRACK_CONFIRMED` event arrives, when the hook processes it, then the `onTrackConfirmed` callback is invoked with parsed `TrackConfirmedEvent` data including `reasoning` field
- [ ] Given the WebSocket state changes, when I access `isConnected`, then it reflects the current connection status
- [ ] Given React Strict Mode runs in development, when effects run twice, then no duplicate connections or state update warnings occur

#### Technical Notes
- Create `src/hooks/useAIDetectionWebSocket.ts`
- Follow pattern from `src/hooks/useDJIWebSocket.ts` (native WebSocket, not socket.io)
- Backend WebSocket URL: `ws://136.116.89.216` (configurable via `NEXT_PUBLIC_AI_WS_URL`)
- Use `useRef` for WS instance, `mountedRef` for leak prevention
- Use `useCallback` for stable handler references
- Expose `isConnected` state for UI indicator
- Handle events: `YOLO_DETECTION`, `TRACK_CONFIRMED`
- Parse JSON messages, dispatch to appropriate callbacks
- Exponential backoff: `Math.min(3000 * Math.pow(1.5, attempt), 30000)`

**Event handling with dual GPS:**
```typescript
// YOLO_DETECTION event
socket.onmessage = (event) => {
  const data = JSON.parse(event.data);
  if (data.type === 'YOLO_DETECTION') {
    // data.detections[].latitude / longitude = drone position
    // data.detections[].objectLatitude / objectLongitude = object position (may be null)
    onYOLODetection(data as YoloDetectionEvent);
  }
  if (data.type === 'TRACK_CONFIRMED') {
    // data.detections[].reasoning = LLM explanation
    // Same dual GPS fields as YOLO
    onTrackConfirmed(data as TrackConfirmedEvent);
  }
};
```

#### Dependencies
- AID-3 (config for WS_URL)
- AID-4 (types for parsing)

---

### AID-10: Create Detection State Reducer

**Type**: Technical
**Jira Type**: Task
**Priority**: High
**Complexity**: Medium
**Phase**: 2 - Real-time Detection
**Labels**: `frontend`, `hooks`, `state`

#### Description
As a developer, I want a useReducer-based state management for detection data, so that high-frequency WebSocket updates are batched efficiently without causing excessive re-renders.

#### Acceptance Criteria
- [ ] Given I dispatch `ADD_YOLO_DETECTIONS`, when the reducer processes it, then new detections are prepended to the YOLO list (capped at 50)
- [ ] Given I dispatch `ADD_LLM_VERIFICATION`, when the reducer processes it, then the corresponding YOLO detection status updates to "verified" and the LLM list is updated
- [ ] Given I dispatch `UPDATE_DETECTION_STATUS`, when the reducer processes it, then the detection's status field is updated (approved/dismissed)
- [ ] Given I dispatch `CLEAR_OLD_DETECTIONS`, when the reducer processes it, then detections older than 5 minutes are removed
- [ ] Given I dispatch `RESET`, when the reducer processes it, then all detection state is cleared

#### Technical Notes
- Create `src/hooks/useDetectionReducer.ts`
- State shape:
```typescript
interface DetectionState {
  yoloDetections: YOLODetectionItem[];
  llmVerifications: LLMVerificationItem[];
  overlayDetections: Map<string, OverlayDetection[]>; // streamId → detections
  stats: { total: number; active: number; verified: number; pending: number };
}
```
- Use `useReducer` (not useState) for batch updates
- Cap YOLO/LLM lists at `AI_DETECTION_CONFIG.MAX_DETECTIONS_PER_PANEL`
- Link YOLO→LLM by matching `trackId` and `streamId`

#### Dependencies
- AID-4 (types)
- AID-3 (config for MAX_DETECTIONS_PER_PANEL)

---

### AID-11: Implement Notification Panel with Tabs

**Type**: Feature
**Jira Type**: Story
**Priority**: High
**Complexity**: Medium
**Phase**: 2 - Real-time Detection
**Labels**: `frontend`, `components`

#### Description
As a SOC operator, I want a tabbed notification panel showing YOLO detections and LLM verifications separately, so that I can distinguish between raw alerts and confirmed threats.

#### Acceptance Criteria
- [ ] Given I am on the AI Detection page, when I look at the right side, then I see a panel with two tabs: "AI Detection (YOLO)" and "Verified Threats (LLM)"
- [ ] Given I click the YOLO tab, when the tab is active, then I see a list of YOLO detection cards with an orange accent
- [ ] Given I click the LLM tab, when the tab is active, then I see a list of LLM verification cards with a red accent
- [ ] Given new detections arrive, when the panel updates, then the tab badge shows the count of new/unread items
- [ ] Given a detection card is added, when the list exceeds 50 items, then the oldest item is removed

#### Technical Notes
- Create `src/components/features/ai-detection/NotificationPanel.tsx`
- Create `src/components/features/ai-detection/YOLOTab.tsx`
- Create `src/components/features/ai-detection/LLMTab.tsx`
- Use shadcn Tabs pattern (or custom tabs matching existing style)
- Tab accent colors: YOLO=orange (#ff9800), LLM=red (#ff4444) — matching HTML prototype
- Auto-scroll to bottom on new items
- Empty state messages: YOLO="Scanning airspace...", LLM="Waiting for confirmation..."

#### Dependencies
- AID-1 (page shell)
- AID-10 (detection state)

---

### AID-12: Implement Detection Card Component

**Type**: Feature
**Jira Type**: Story
**Priority**: High
**Complexity**: Medium
**Phase**: 2 - Real-time Detection
**Labels**: `frontend`, `components`

#### Description
As a SOC operator, I want detection cards that show relevant information for both YOLO and LLM detections including dual GPS coordinates, so that I can quickly assess each alert.

#### Acceptance Criteria
- [ ] Given a YOLO detection arrives, when the card renders, then it shows: class name, confidence score, track ID, timestamp, device name, and "AI Verification in Progress" badge with pulse animation
- [ ] Given an LLM verification arrives, when the card renders, then it shows: class name, confidence score, track ID, timestamp, device name, LLM reasoning (truncated), and "Verified" badge
- [ ] Given a detection has GPS data, when the card renders, then it shows both drone position (`latitude`, `longitude`) and object position (`objectLatitude`, `objectLongitude`) if available
- [ ] Given `objectLatitude`/`objectLongitude` is null, when the card renders, then it shows "Object position: Unknown" or hides the field
- [ ] Given an LLM card has long reasoning text, when I click "See More", then the full reasoning text is revealed
- [ ] Given a detection is verified, when I look at the corresponding YOLO card, then its status badge changes to "Verified" with a checkmark icon
- [ ] Given a card renders, when I look at the styling, then it matches the existing dashboard card patterns (bg-card, border-gray-800, rounded-lg)

#### Technical Notes
- Create `src/components/features/ai-detection/DetectionCard.tsx`
- Two variants: `type: 'yolo'` and `type: 'llm'`
- YOLO card: orange left border, "🔍 DETECTED" prefix
- LLM card: red left border, "🚨 VERIFIED" prefix
- Confidence display: `(score * 100).toFixed(0)%`
- Time display: use `formatTimeAgo()` from `src/lib/utils.ts`
- See More/Less toggle for reasoning text (CSS line-clamp)
- Follow card styling from `src/app/(dashboard)/threats/page.tsx`

**Dual GPS display in card:**
```tsx
<div className="text-xs text-gray-500 space-y-1">
  <div className="flex items-center gap-1">
    <MapPin className="w-3 h-3" />
    <span>Drone: {detection.latitude?.toFixed(4)}, {detection.longitude?.toFixed(4)}</span>
  </div>
  {detection.objectLatitude && detection.objectLongitude ? (
    <div className="flex items-center gap-1">
      <Target className="w-3 h-3" />
      <span>Object: {detection.objectLatitude.toFixed(4)}, {detection.objectLongitude.toFixed(4)}</span>
    </div>
  ) : (
    <div className="flex items-center gap-1 text-gray-600">
      <Target className="w-3 h-3" />
      <span>Object position: Unknown</span>
    </div>
  )}
</div>
```

#### Dependencies
- AID-4 (types)
- Reuses `formatTimeAgo` from utils

---

### AID-13: Implement Canvas Overlay for Bounding Boxes

**Type**: Feature
**Jira Type**: Story
**Priority**: High
**Complexity**: Large
**Phase**: 2 - Real-time Detection
**Labels**: `frontend`, `components`, `canvas`, `performance`

#### Description
As a SOC operator, I want real-time bounding boxes drawn on the video overlay showing detected objects with class labels and confidence scores, so that I can visually identify what the AI has detected.

#### Acceptance Criteria
- [ ] Given a video feed is playing, when DETECTIONS WebSocket events arrive for that stream, then bounding boxes are drawn on the canvas overlay
- [ ] Given a bounding box is drawn, when I look at it, then it shows a green rectangle with class label and confidence percentage
- [ ] Given detections update at 60fps, when I watch the video, then the bounding box rendering is smooth without jank
- [ ] Given the video resizes (e.g., window resize), when the canvas redraws, then bounding boxes remain correctly positioned
- [ ] Given no detections exist, when I watch the video, then the canvas is clear (no artifacts)

#### Technical Notes
- Enhance `StreamVideoCard.tsx` with canvas rendering logic
- Canvas rendering pattern:
```typescript
// Store detection data in useRef (not state) to avoid re-renders
const detectionsRef = useRef<OverlayDetection[]>([]);

// requestAnimationFrame loop
useEffect(() => {
  const canvas = canvasRef.current;
  const ctx = canvas?.getContext('2d');
  let animationId: number;

  const draw = () => {
    if (!ctx || !canvas) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    detectionsRef.current.forEach(det => {
      const x = det.x * canvas.width;
      const y = det.y * canvas.height;
      const w = det.width * canvas.width;
      const h = det.height * canvas.height;
      ctx.strokeStyle = '#00FF00';
      ctx.lineWidth = 2;
      ctx.strokeRect(x, y, w, h);
      ctx.fillStyle = '#00FF00';
      ctx.font = '14px Arial';
      ctx.fillText(`${det.class} ${(det.score * 100).toFixed(0)}%`, x, y > 20 ? y - 5 : y + 20);
    });
    animationId = requestAnimationFrame(draw);
  };
  draw();
  return () => cancelAnimationFrame(animationId);
}, []);
```
- Coordinate mapping: normalized (0-1) → pixel space
- Handle canvas resize with ResizeObserver or window resize event

#### Dependencies
- AID-6 (VideoGrid and StreamVideoCard)
- AID-10 (detection state with overlayDetections)

---

### AID-14: Wire WebSocket Events to UI Updates

**Type**: Feature
**Jira Type**: Story
**Priority**: High
**Complexity**: Medium
**Phase**: 2 - Real-time Detection
**Labels**: `frontend`, `integration`

#### Description
As a developer, I want the WebSocket hook connected to the detection state reducer and UI components, so that real-time detection events flow from the backend to the operator's screen.

#### Acceptance Criteria
- [ ] Given the WebSocket receives a `YOLO_DETECTION` event, when the hook processes it, then the YOLO tab shows new detection cards within 2 seconds
- [ ] Given the WebSocket receives a `TRACK_CONFIRMED` event, when the hook processes it, then the LLM tab shows new verification cards and the corresponding YOLO card status updates to "Verified"
- [ ] Given the WebSocket receives a `DETECTIONS` event, when the hook processes it, then the matching video stream's canvas overlay updates with new bounding boxes
- [ ] Given the WebSocket disconnects, when the connection is lost, then a visual indicator shows "Disconnected" status

#### Technical Notes
- Wire in `AIDetectionDashboard.tsx`:
  - Pass callbacks to `useAIDetectionWebSocket`
  - Callbacks dispatch to `useDetectionReducer`
  - State flows down to child components via props
- Connection status indicator in toolbar (green dot = connected, red = disconnected)
- Ensure `startTransition` wraps non-urgent state updates (panel updates)

#### Dependencies
- AID-9 (WebSocket hook)
- AID-10 (state reducer)
- AID-11 (notification panel)
- AID-13 (canvas overlay)

---

## Phase 3: Threat Inspection & Actions (Days 5-6)

---

### AID-15: Implement Threat Inspection Modal

**Type**: Feature
**Jira Type**: Story
**Priority**: High
**Complexity**: Large
**Phase**: 3 - Threat Inspection & Actions
**Labels**: `frontend`, `components`, `modal`

#### Description
As a SOC operator, I want to inspect a verified threat in detail with an image, map showing both drone and object positions, and AI reasoning, so that I can make an informed decision about whether to approve or dismiss it.

#### Acceptance Criteria
- [ ] Given I click "Inspect Threat" on an LLM card, when the modal opens, then I see the detection snapshot image from the `imageUrl` presigned URL
- [ ] Given the modal is open, when I look at the content, then I see threat metadata: class, confidence, device name, timestamp, track ID
- [ ] Given the modal is open, when I look at the GPS section, then I see both drone position (`latitude`, `longitude`) and object position (`objectLatitude`, `objectLongitude`) with labels
- [ ] Given the modal is open, when I look at the LLM reasoning section, then the full reasoning text is displayed (expandable if long)
- [ ] Given the modal is open, when I look at the map section, then I see a MapLibre GL map with:
  - Blue marker at drone position (always shown if GPS available)
  - Red pulsing marker at object position (shown if `objectLatitude`/`objectLongitude` is not null)
  - All online device positions
- [ ] Given the modal is open, when I look at the footer, then I see "Approve Threat" and "Dismiss" buttons
- [ ] Given I press Escape or click the X button, when the modal closes, then the map is properly cleaned up (no WebGL context leak)

#### Technical Notes
- Create `src/components/features/ai-detection/ThreatInspectionModal.tsx`
- Use shadcn `Dialog` component:
```tsx
<Dialog open={!!selectedThreat} onOpenChange={(open) => !open && setSelectedThreat(null)}>
  <DialogContent className="sm:max-w-2xl max-h-[90vh] p-0 gap-0">
    <DialogHeader>...</DialogHeader>
    <ScrollArea className="max-h-[50vh] px-6">...</ScrollArea>
    <DialogFooter>...</DialogFooter>
  </DialogContent>
</Dialog>
```
- Image: `<img src={threat.imageUrl} alt="Detection snapshot" className="w-full object-cover rounded-lg" />`
- Metadata grid: 2-column layout with icons (Clock, MapPin, Video, Hash)

**Dual GPS metadata display:**
```tsx
<div className="grid grid-cols-2 gap-4 text-sm">
  <div>
    <span className="text-gray-500">Drone Position</span>
    <p>{threat.latitude?.toFixed(6)}, {threat.longitude?.toFixed(6)}</p>
  </div>
  {threat.objectLatitude && threat.objectLongitude ? (
    <div>
      <span className="text-gray-500">Object Position</span>
      <p>{threat.objectLatitude.toFixed(6)}, {threat.objectLongitude.toFixed(6)}</p>
    </div>
  ) : (
    <div>
      <span className="text-gray-500">Object Position</span>
      <p className="text-gray-600">Not resolvable</p>
    </div>
  )}
</div>
```

- Lazy load map with `next/dynamic` (SSR disabled)
- Map cleanup: `mapRef.current?.stop()` on unmount

#### Dependencies
- AID-2 (shadcn Dialog installed)
- AID-4 (types)
- AID-16 (ThreatMap component)

---

### AID-16: Implement Threat Map Component

**Type**: Feature
**Jira Type**: Story
**Priority**: High
**Complexity**: Medium
**Phase**: 3 - Threat Inspection & Actions
**Labels**: `frontend`, `components`, `map`

#### Description
As a SOC operator, I want a lightweight map in the threat inspection modal showing both the drone position and detected object position, so that I can understand the spatial context of the detection.

#### Acceptance Criteria
- [ ] Given the threat inspection modal opens, when the map loads, then it shows a dark basemap centered on the threat coordinates
- [ ] Given the map renders, when I look at it, then I see a blue marker at the drone's position (`latitude`, `longitude`)
- [ ] Given the map renders and object position is available, when I look at it, then I see a red pulsing marker at the object's position (`objectLatitude`, `objectLongitude`)
- [ ] Given the map renders and object position is null, when I look at it, then only the drone marker is shown (no red marker)
- [ ] Given the map renders, when I look at it, then I see markers for all online devices in the project
- [ ] Given the map is in a modal, when I interact with it, then scroll zoom is disabled (prevents modal scroll hijack)
- [ ] Given the modal closes, when the component unmounts, then the map instance is properly cleaned up

#### Technical Notes
- Create `src/components/features/ai-detection/ThreatMap.tsx`
- Lazy load with `next/dynamic`:
```tsx
const ThreatMap = dynamic(() => import('./ThreatMap'), {
  ssr: false,
  loading: () => <div className="h-48 animate-pulse bg-neutral-800 rounded-lg" />,
});
```
- Use `react-map-gl/maplibre` (already installed)
- Lightweight config for modal:
  - `scrollZoom={false}`
  - `dragRotate={false}`
  - `doubleClickZoom={false}`
  - `attributionControl={false}`

**Dual GPS marker rendering:**
```tsx
// Drone position marker (blue)
{threat.latitude && threat.longitude && (
  <Marker latitude={threat.latitude} longitude={threat.longitude}>
    <div className="w-4 h-4 bg-blue-500 rounded-full border-2 border-white shadow-lg" />
  </Marker>
)}

// Object position marker (red, pulsing) - only if available
{threat.objectLatitude && threat.objectLongitude && (
  <Marker latitude={threat.objectLatitude} longitude={threat.objectLongitude}>
    <div className="w-4 h-4 bg-red-500 rounded-full border-2 border-white shadow-lg animate-pulse" />
  </Marker>
)}
```

- Resize handler: `mapRef.current?.resize()` after 300ms delay
- Cleanup: `mapRef.current?.stop()` on unmount

#### Dependencies
- AID-2 (shadcn Dialog for parent modal)
- `react-map-gl` (already installed)
- `maplibre-gl` (already installed)

---

### AID-17: Implement Confirmation Dialog

**Type**: Feature
**Jira Type**: Story
**Priority**: High
**Complexity**: Small
**Phase**: 3 - Threat Inspection & Actions
**Labels**: `frontend`, `components`, `modal`

#### Description
As a SOC operator, I want a confirmation dialog before approving or dismissing threats, so that I don't accidentally perform irreversible actions.

#### Acceptance Criteria
- [ ] Given I click "Approve Threat" in the inspection modal, when the confirmation dialog opens, then I see: "Approve this threat? This will mark it as confirmed and may trigger automated responses."
- [ ] Given I click "Dismiss" on a detection card, when the confirmation dialog opens, then I see: "Dismiss this threat? This will mark it as a false positive."
- [ ] Given the confirmation dialog is open, when I click "Cancel", then the dialog closes and no action is taken
- [ ] Given the confirmation dialog is open, when I click "Confirm", then the API call is made and a loading indicator is shown
- [ ] Given the API call succeeds, when the dialog closes, then a success toast is shown via Sonner

#### Technical Notes
- Create `src/components/features/ai-detection/ConfirmDialog.tsx`
- Use shadcn `AlertDialog` (cannot be dismissed by clicking outside)
- Pattern:
```tsx
<AlertDialog open={open} onOpenChange={onOpenChange}>
  <AlertDialogContent>
    <AlertDialogHeader>
      <AlertDialogTitle>{title}</AlertDialogTitle>
      <AlertDialogDescription>{description}</AlertDialogDescription>
    </AlertDialogHeader>
    <AlertDialogFooter>
      <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
      <AlertDialogAction onClick={onConfirm} disabled={isPending}>
        {isPending ? <Loader2 className="animate-spin h-4 w-4 mr-2" /> : null}
        {actionLabel}
      </AlertDialogAction>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>
```
- Two variants: approve (default) and dismiss (destructive styling)

#### Dependencies
- AID-2 (shadcn AlertDialog installed)

---

### AID-18: Create useDetectionActions Hook

**Type**: Technical
**Jira Type**: Task
**Priority**: High
**Complexity**: Medium
**Phase**: 3 - Threat Inspection & Actions
**Labels**: `frontend`, `hooks`, `api`

#### Description
As a developer, I want mutation hooks for approving and dismissing detections with optimistic updates, so that the UI responds immediately while the API call processes in the background.

#### Acceptance Criteria
- [ ] Given I call `useApproveDetection().mutate(id)`, when the mutation runs, then the detection status optimistically updates to "approved" in the UI
- [ ] Given the API call fails, when the error is caught, then the optimistic update is rolled back and an error toast is shown
- [ ] Given I call `useDismissDetection().mutate(id)`, when the mutation runs, then the detection status optimistically updates to "dismissed"
- [ ] Given a mutation settles (success or error), when the callback runs, then React Query caches are invalidated for detection lists
- [ ] Given I call `useBulkDetectionAction().mutate({ ids, action })`, when the mutation runs, then multiple detections are updated in a single API call

#### Technical Notes
- Create `src/hooks/useDetectionActions.ts`
- Use TanStack React Query `useMutation`:
```typescript
export function useApproveDetection() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => detectionApi.approve(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: detectionKeys.all });
      const previous = queryClient.getQueriesData({ queryKey: detectionKeys.all });
      queryClient.setQueriesData({ queryKey: detectionKeys.all }, (old) => {
        // Optimistic update: change status to 'approved'
      });
      return { previous };
    },
    onError: (_err, _id, context) => {
      context?.previous.forEach(([key, data]) => queryClient.setQueryData(key, data));
      toast.error('Failed to approve threat');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: detectionKeys.all });
    },
  });
}
```
- Query key factory: `detectionKeys.all`, `detectionKeys.list(filters)`, etc.
- Toast notifications via `sonner`

#### Dependencies
- AID-4 (types)
- AID-3 (config for API_URL)

---

### AID-19: Implement Bulk Actions Component

**Type**: Feature
**Jira Type**: Story
**Priority**: Medium
**Complexity**: Medium
**Phase**: 3 - Threat Inspection & Actions
**Labels**: `frontend`, `components`

#### Description
As a SOC operator, I want to select multiple detections and approve or dismiss them in bulk, so that I can efficiently process high volumes of alerts.

#### Acceptance Criteria
- [ ] Given I look at a detection card, when I see the card, then there is a checkbox for selection
- [ ] Given I click "Select All" in the panel header, when the checkbox is toggled, then all visible detection cards are selected/deselected
- [ ] Given I have selected 1+ detections, when I look at the panel, then "Approve Selected" and "Dismiss Selected" buttons appear
- [ ] Given I click "Approve Selected", when the confirmation dialog opens, then it shows the count of selected items
- [ ] Given I confirm a bulk action, when the API call processes, then a progress indicator is shown and all selected items are updated on completion

#### Technical Notes
- Create `src/components/features/ai-detection/BulkActions.tsx`
- State: `selectedIds: Set<string>` managed in parent
- Select All: toggles all visible detection IDs
- Buttons styled with existing button patterns (outline for approve, destructive for dismiss)
- Progress: show spinner on each card being processed, or a global progress bar
- Reuse `ConfirmDialog` for bulk confirmation

#### Dependencies
- AID-11 (NotificationPanel provides the list)
- AID-12 (DetectionCard needs checkbox)
- AID-17 (ConfirmDialog)
- AID-18 (useBulkDetectionAction)

---

### AID-20: Wire Approve Action to Geospatial Map

**Type**: Feature
**Jira Type**: Story
**Priority**: Medium
**Complexity**: Medium
**Phase**: 3 - Threat Inspection & Actions
**Labels**: `frontend`, `integration`, `map`

#### Description
As a SOC operator, I want approved threats to appear as markers on the geospatial map, so that I can see the spatial distribution of confirmed threats across the operational area.

#### Acceptance Criteria
- [ ] Given I approve a threat, when the approval succeeds, then a red marker appears on the geospatial map at the threat's coordinates
- [ ] Given an approved threat marker exists, when I hover over it, then I see the threat class name
- [ ] Given an approved threat marker exists, when I click it, then I see a popup with threat details
- [ ] Given a threat is marked as "resolved" in the system, when the geospatial map updates, then the marker is removed

#### Technical Notes
- This requires integration with the existing geospatial map component
- Option 1: Store approved threats in React Query cache, pass to `GeoMap` component
- Option 2: Add a new `Source` + `Layer` in `geo-map.tsx` for approved threats
- Marker styling: red pin (similar to existing threat markers in `threats/page.tsx`)
- Data flow: approve mutation → React Query cache → geospatial map reads from cache
- Keep scope minimal for MVP: just show markers, no complex interaction

#### Dependencies
- AID-18 (useDetectionActions provides approve mutation)
- Existing `GeoMap` component (may need minor modification)

---

## Phase 4: History & Polish (Days 7-8)

---

### AID-21: Create useDetections Hook for History

**Type**: Technical
**Jira Type**: Task
**Priority**: High
**Complexity**: Medium
**Phase**: 4 - History & Polish
**Labels**: `frontend`, `hooks`, `api`

#### Description
As a developer, I want a React Query hook for paginated detection history, so that operators can browse past detections with infinite scroll.

#### Acceptance Criteria
- [ ] Given I call `useDetections(filters)`, when the hook loads, then it fetches the first page of detections from the REST API
- [ ] Given I scroll to the bottom of the detection list, when more data exists, then the next page is automatically fetched
- [ ] Given I apply a filter (e.g., class=person), when the query runs, then only matching detections are returned
- [ ] Given the query has loaded 5 pages, when I scroll further, then no more pages are fetched (maxPages limit)
- [ ] Given WebSocket data arrives, when I look at the detection list, then live detections are merged with historical data without duplicates

#### Technical Notes
- Create `src/hooks/useDetections.ts`
- Use `useInfiniteQuery` from TanStack React Query:
```typescript
export function useDetections(filters: DetectionFilters) {
  return useInfiniteQuery({
    queryKey: detectionKeys.list(filters),
    queryFn: ({ pageParam }) => detectionApi.list({ ...filters, cursor: pageParam }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    maxPages: 5,
    staleTime: 30_000,
  });
}
```
- API call: `GET /api/detections?cursor=<id>&limit=20&class=...&status=...&deviceId=...`
- Deduplication: maintain a `Set<string>` of seen detection IDs across live + history

#### Dependencies
- AID-3 (config for API_URL, DETECTION_HISTORY_PAGE_SIZE)
- AID-4 (types)

---

### AID-22: Implement Detection History UI

**Type**: Feature
**Jira Type**: Story
**Priority**: Medium
**Complexity**: Medium
**Phase**: 4 - History & Polish
**Labels**: `frontend`, `components`

#### Description
As a SOC supervisor, I want a "Fetch History" button and infinite scroll for detection history, so that I can review past threats and ensure nothing was missed.

#### Acceptance Criteria
- [ ] Given I click "Fetch History" button, when the data loads, then historical detections appear in the notification panel mixed with live data
- [ ] Given I scroll down in the detection list, when I reach the bottom, then the next page of history is automatically loaded
- [ ] Given history is loading, when I look at the bottom of the list, then I see a loading spinner
- [ ] Given all history has been loaded, when I reach the bottom, then I see "No more detections" message
- [ ] Given I change filters, when the query re-runs, then the history refetches with new filter values

#### Technical Notes
- Add "Fetch History" button to `NotificationPanel` toolbar
- Use `IntersectionObserver` or `onScroll` for infinite scroll trigger
- Loading state: show `Spinner` component at bottom of list
- Integrate with `useDetections` hook from AID-21
- Merge history data with live WebSocket data in the panel

#### Dependencies
- AID-11 (NotificationPanel)
- AID-21 (useDetections hook)

---

### AID-23: Implement Empty and Error States

**Type**: Feature
**Jira Type**: Story
**Priority**: Medium
**Complexity**: Small
**Phase**: 4 - History & Polish
**Labels**: `frontend`, `components`, `ux`

#### Description
As a SOC operator, I want graceful empty and error states, so that I understand what's happening when there are no detections or when something goes wrong.

#### Acceptance Criteria
- [ ] Given no streams are selected, when I look at the video grid, then I see "Select streams to begin monitoring" message
- [ ] Given no detections exist, when I look at the YOLO tab, then I see "Scanning airspace..." message
- [ ] Given no detections exist, when I look at the LLM tab, then I see "Waiting for confirmation..." message
- [ ] Given the WebSocket disconnects, when I look at the connection status, then I see a red indicator with "Disconnected" text
- [ ] Given the WebSocket reconnects, when the connection is restored, then the indicator turns green with "Connected" text
- [ ] Given an API call fails, when the error occurs, then a toast notification shows the error message

#### Technical Notes
- Empty states follow pattern from `src/components/features/streams/EmptyPage.tsx`
- Connection status indicator: small dot + text in toolbar
- Error toasts via `sonner` (already integrated)
- Canvas overlay: show nothing when no detections (clear canvas)

#### Dependencies
- AID-11 (NotificationPanel for empty states)
- AID-14 (WebSocket wiring for connection status)

---

### AID-24: Performance Optimization

**Type**: Technical
**Jira Type**: Task
**Priority**: High
**Complexity**: Medium
**Phase**: 4 - History & Polish
**Labels**: `frontend`, `performance`

#### Description
As a developer, I want to optimize the AI Detection page for performance, so that it remains responsive with 4 active streams and 50+ detections.

#### Acceptance Criteria
- [ ] Given 4 video streams are active, when I watch the page, then there are no dropped frames or jank in the UI
- [ ] Given 50+ detections exist in the panel, when I scroll through them, then scrolling is smooth (60fps)
- [ ] Given the WebSocket receives high-frequency updates, when React renders, then `startTransition` prevents navigation lag
- [ ] Given I use Chrome DevTools Profiler, when I profile the page, then there are no unnecessary re-renders from detection state updates
- [ ] Given the page has been open for 30 minutes, when I check memory usage, then there are no memory leaks from WebSocket or canvas

#### Technical Notes
- Optimization checklist:
  - [ ] Detection data in `useRef` (not state) for canvas rendering
  - [ ] `useMemo` for derived data (filtered detections, stats)
  - [ ] `useCallback` for stable function references passed to children
  - [ ] `startTransition` wrapping non-urgent state updates
  - [ ] Virtual scrolling for detection lists if needed (`@tanstack/react-virtual`)
  - [ ] Canvas `requestAnimationFrame` loop (not React re-renders)
  - [ ] Lazy load MapLibre GL with `next/dynamic`
- Profile with Chrome DevTools Performance tab
- Check for memory leaks with Chrome DevTools Memory tab

#### Dependencies
- All previous stories (performance optimization is a final pass)

---

### AID-25: Final Integration Testing

**Type**: Technical
**Jira Type**: Task
**Priority**: High
**Complexity**: Medium
**Phase**: 4 - History & Polish
**Labels**: `frontend`, `testing`

#### Description
As a developer, I want to verify the complete AI Detection page works end-to-end, so that all features are functional and the page is ready for deployment.

#### Acceptance Criteria
- [ ] Given I navigate to /ai-detection, when the page loads, then I see the full layout with stat cards, stream selector, video grid area, and notification panel
- [ ] Given I select 2 streams, when the videos play, then bounding boxes appear on both streams
- [ ] Given YOLO detections arrive, when I see them in the panel, then I can click "Inspect Threat" on an LLM verification
- [ ] Given the inspection modal opens, when I see the image, map, and reasoning, then I can click "Approve Threat"
- [ ] Given I approve a threat, when the confirmation dialog appears, then confirming shows a success toast and the detection status updates
- [ ] Given I select multiple detections, when I click "Approve Selected", then bulk approval works with confirmation
- [ ] Given I click "Fetch History", when the data loads, then historical detections appear with infinite scroll
- [ ] Given the WebSocket disconnects, when I see the "Disconnected" indicator, then it reconnects automatically

#### Technical Notes
- Manual testing checklist (automated tests are out of scope for MVP)
- Test with mock WebSocket data if backend is not ready
- Verify all edge cases:
  - No project active → redirect to Projects
  - No devices in project → empty state
  - WebSocket disconnection → reconnection
  - API errors → toast notifications
  - Large detection volumes → performance holds

#### Dependencies
- All previous stories (final integration test)

---

## Story Summary

| ID | Title | Phase | Priority | Complexity |
|----|-------|-------|----------|------------|
| AID-1 | Create AI Detection Page Shell | 1 | High | Small |
| AID-2 | Install shadcn/ui Dialog Components | 1 | High | Small |
| AID-3 | Add Detection Configuration | 1 | High | Small |
| AID-4 | Create Detection Type Definitions | 1 | High | Small |
| AID-5 | Implement Stream Selector Component | 1 | High | Medium |
| AID-6 | Implement Video Grid and Stream Video Card | 1 | High | Large |
| AID-7 | Add Stat Cards Row | 1 | Medium | Small |
| AID-8 | Add Search and Filter Controls | 1 | Medium | Small |
| AID-9 | Create useAIDetectionWebSocket Hook | 2 | High | Large |
| AID-10 | Create Detection State Reducer | 2 | High | Medium |
| AID-11 | Implement Notification Panel with Tabs | 2 | High | Medium |
| AID-12 | Implement Detection Card Component | 2 | High | Medium |
| AID-13 | Implement Canvas Overlay for Bounding Boxes | 2 | High | Large |
| AID-14 | Wire WebSocket Events to UI Updates | 2 | High | Medium |
| AID-15 | Implement Threat Inspection Modal | 3 | High | Large |
| AID-16 | Implement Threat Map Component | 3 | High | Medium |
| AID-17 | Implement Confirmation Dialog | 3 | High | Small |
| AID-18 | Create useDetectionActions Hook | 3 | High | Medium |
| AID-19 | Implement Bulk Actions Component | 3 | Medium | Medium |
| AID-20 | Wire Approve Action to Geospatial Map | 3 | Medium | Medium |
| AID-21 | Create useDetections Hook for History | 4 | High | Medium |
| AID-22 | Implement Detection History UI | 4 | Medium | Medium |
| AID-23 | Implement Empty and Error States | 4 | Medium | Small |
| AID-24 | Performance Optimization | 4 | High | Medium |
| AID-25 | Final Integration Testing | 4 | High | Medium |

---

## Dependency Graph

```
AID-1 ─┬─→ AID-5 ─┬─→ AID-6 ─→ AID-13 ─→ AID-14
       │          └─→ AID-14
       ├─→ AID-7
       ├─→ AID-8
       └─→ AID-11 ─→ AID-12 ─→ AID-19
                          └→ AID-15 ─→ AID-20
                               └→ AID-16

AID-2 ─┬─→ AID-15
       └─→ AID-17 ─→ AID-19

AID-3 ─┬─→ AID-9 ─→ AID-14
       ├─→ AID-10 ─→ AID-14
       ├─→ AID-18 ─→ AID-19
       └─→ AID-21 ─→ AID-22

AID-4 ─┬─→ AID-9
       ├─→ AID-10
       ├─→ AID-12
       ├─→ AID-15
       ├─→ AID-16
       ├─→ AID-18
       └─→ AID-21

AID-14 ─→ AID-23

All stories ─→ AID-24 ─→ AID-25
```

---

## Atlassian MCP Status

Atlassian MCP is not configured. To push stories to Jira automatically:
1. Get an API token from https://id.atlassian.com/manage/api-tokens
2. Configure `.mcp.json` with Atlassian MCP server credentials
3. Re-run this command with `--project <PROJECT_KEY> --epic <EPIC_KEY>`
