# Plan: AID-6 — Video Grid and Stream Video Card

## Summary

Replace the current single-stream `DetectionVideoFeed` with a responsive multi-stream video grid. Each selected stream gets its own `StreamVideoCard` with a live WebRTC feed, canvas overlay for bounding boxes, and device metadata. The `VideoGrid` component handles responsive grid layout (1→2→4 columns). The existing `DetectionVideoFeed` is replaced in the page layout.

## User Story

As a SOC operator
I want to see live WebRTC video feeds in a responsive grid with bounding box canvas overlays
So that I can visually monitor multiple streams with real-time detection visualization

## Metadata

| Field | Value |
|-------|-------|
| Type | NEW_CAPABILITY |
| Complexity | MEDIUM |
| Systems Affected | AI Detection UI, Video Grid, WebRTC |
| Jira Issue | AID-6 |

---

## Patterns to Follow

### Grid Layout Pattern
```tsx
// SOURCE: src/components/features/streams/MultiFeedView.tsx:43
grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4
```

### Card Structure Pattern
```tsx
// SOURCE: src/components/features/streams/FeedCard.tsx:36-38
<div className='flex flex-col bg-zinc-900/40 border border-zinc-800/50 rounded-xl overflow-hidden transition-colors'>
```

### WebRTC Player Integration
```tsx
// SOURCE: src/components/features/ai-detection/DetectionVideoFeed.tsx:120-127
<WebRTCPlayer
  key={whepUrl}
  url={whepUrl}
  onStateChange={handleStateChange}
  onMediaStream={handleMediaStream}
/>
```

### Canvas Overlay Pattern
```tsx
// SOURCE: src/components/features/ai-detection/DetectionVideoFeed.tsx:160-167
<video ref={videoRef} autoPlay muted playsInline className='w-full h-full object-contain' />
<canvas ref={canvasRef} className='absolute inset-0 pointer-events-none w-full h-full' />
```

### Bounding Box Drawing
```typescript
// SOURCE: src/components/features/ai-detection/DetectionVideoFeed.tsx:52-91
// requestAnimationFrame loop with normalized coords (0-1) * canvas dimensions
```

### Memo Pattern for Components
```tsx
// SOURCE: src/components/features/streams/MultiFeedView.tsx:20
export const MultiFeedView = memo(function MultiFeedView({ ... }: MultiFeedViewProps) { ... });
```

### Dark Theme Color Tokens
```
bg-[#0C0D10]  — panel background
bg-[#12151C]  — header/toolbar bg
border-zinc-800/50  — panel borders
text-[#E2E2E8]  — primary text
text-[#8C90A0]  — secondary text
text-[#45F0CF]  — verified/high-confidence accent
text-[#AFC6FF]  — blue accent
```

---

## Files to Change

| File | Action | Purpose |
|------|--------|---------|
| `src/components/features/ai-detection/StreamVideoCard.tsx` | CREATE | Individual stream card with video + canvas overlay |
| `src/components/features/ai-detection/VideoGrid.tsx` | CREATE | Responsive grid layout wrapping StreamVideoCards |
| `src/app/(dashboard)/ai-detection/page.tsx` | UPDATE | Replace DetectionVideoFeed with VideoGrid |

---

## Tasks

Execute in order. Each task is atomic and verifiable.

### Task 1: Create StreamVideoCard component

- **File**: `src/components/features/ai-detection/StreamVideoCard.tsx`
- **Action**: CREATE
- **Implement**:
  - Props interface `StreamVideoCardProps`: `streamId: string`, `device?: DJIDevice`, `detections: ThreatDetection[]`, `className?: string`
  - Headless `<WebRTCPlayer>` integration (build WHEP URL from streamId using `buildWhepUrl` pattern from DetectionVideoFeed.tsx:15-18)
  - `<video>` element with `ref`, `autoPlay`, `muted`, `playsInline`, `object-contain`
  - `<canvas>` overlay positioned absolutely over video for bounding box rendering
  - `requestAnimationFrame` loop in `useEffect` depending on `detections` — draw bounding boxes with normalized coords (copy pattern from DetectionVideoFeed.tsx:52-91)
  - MediaStream attachment effect (copy from DetectionVideoFeed.tsx:100-104)
  - Header bar: device name/nickname + stream ID + connection status dot
  - Connecting overlay (Loader2 spinner), error overlay (VideoOff icon)
  - Bottom HUD: detection count
  - Cleanup: WebRTCPlayer unmount closes peer connection (handled by component)
- **Mirror**: `src/components/features/ai-detection/DetectionVideoFeed.tsx` (video+canvas+WebRTC pattern), `src/components/features/streams/FeedCard.tsx:36-89` (card structure)
- **Validate**: `npm run build`

### Task 2: Create VideoGrid component

- **File**: `src/components/features/ai-detection/VideoGrid.tsx`
- **Action**: CREATE
- **Implement**:
  - Props interface `VideoGridProps`: `selectedStreamIds: Set<string>`, `devices: DJIDevice[]`, `detections: ThreatDetection[]`
  - Memoized component using `memo(function VideoGrid(...) { ... })`
  - Responsive grid: `grid grid-cols-1 lg:grid-cols-2 gap-4 flex-1 min-h-0`
  - Map over `selectedStreamIds`, find matching device from `devices` array, filter detections by `streamId`
  - Render `<StreamVideoCard>` for each stream, keyed by `streamId`
  - Empty state when no streams selected (matching existing empty state pattern from DetectionVideoFeed.tsx:189-199)
- **Mirror**: `src/components/features/streams/MultiFeedView.tsx:20-56` (grid + memo pattern)
- **Validate**: `npm run build`

### Task 3: Update AI Detection page to use VideoGrid

- **File**: `src/app/(dashboard)/ai-detection/page.tsx`
- **Action**: UPDATE
- **Implement**:
  - Replace `import { DetectionVideoFeed }` with `import { VideoGrid }`
  - In the 3-column layout section, replace `<DetectionVideoFeed>` with `<VideoGrid>`
  - Pass props: `selectedStreamIds`, `devices={projectDevices}`, `detections={filteredDetections}`
  - Remove the center column flex-1 sizing if VideoGrid handles its own layout, or keep the flex container and let VideoGrid fill it
- **Mirror**: `src/app/(dashboard)/ai-detection/page.tsx:207-211` (current DetectionVideoFeed usage)
- **Validate**: `npm run build`

---

## Validation

```bash
# Type check
npm run build

# Lint
npm run lint
```

---

## Acceptance Criteria

- [ ] All 3 tasks completed
- [ ] `npm run build` passes with no errors
- [ ] `StreamVideoCard` renders a single stream with video + canvas overlay
- [ ] `VideoGrid` renders selected streams in a responsive grid (1→2 columns)
- [ ] Each card shows device name as label
- [ ] Canvas overlay is positioned on top of video for bounding box rendering
- [ ] Unmounting a card closes WebRTC peer connection (handled by WebRTCPlayer)
- [ ] Empty state shown when no streams selected
- [ ] Connection status indicator per card (connecting/playing/error)
