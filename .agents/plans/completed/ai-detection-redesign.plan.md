# Plan: AI Detection Page Redesign

## Summary

Redesign the AI Detection page from a bulky card-based list layout to a sleek, compact 3-column layout matching the PRD spec (YOLO orange panel | Video feed with bounding boxes | LLM red panel) while being visually consistent with the Control and Live Feed pages. Uses the same `font-poppins` typography system, dark theme colors (`#0C0D10`, `#12151C`, `#1E2330`), and compact inline patterns from `FlightStatsBar` and `FeedToolbar`.

## User Story

As a Surveillance Operator
I want a real-time 3-column AI detection view with live video feed, YOLO detections, and LLM-verified threats side by side
So that I can monitor, verify, and validate AI detections in a single efficient view without scrolling through bulky cards

## Metadata

| Field | Value |
|-------|-------|
| Type | REFACTOR / ENHANCEMENT |
| Complexity | HIGH |
| Systems Affected | AI Detection UI, Components, Hooks |
| Jira Issue | N/A |

---

## Patterns to Follow

### Typography (from FlightStatsBar)
```
// SOURCE: src/components/features/control/FlightStatsBar.tsx:97-119
// Labels:  text-[10px] font-normal font-poppins text-[#8C90A0] uppercase tracking-wide
// Values: text-sm font-semibold font-poppins leading-none text-white
// Status: text-[10px] font-semibold font-poppins uppercase tracking-tighter
```

### Dark Theme Colors
```
// SOURCE: src/components/features/control/Control.tsx, FlightStatsBar.tsx
// Container bg: bg-[#0C0D10] or bg-[#12151C]
// Border: border-[#1E2330] or border-zinc-800/50
// Text primary: text-white / text-[#E2E2E8]
// Text muted: text-[#8C90A0]
// Accent green: text-[#45F0CF] / text-[#2CAC73]
// Accent blue: text-[#AFC6FF] / text-[#1C93FF]
```

### Full-Bleed Layout (from Control page)
```
// SOURCE: src/app/(dashboard)/control/page.tsx:7
<div className='-m-6'>
  <ControlPage />
</div>
```

### Compact Stats Bar (from FlightStatsBar)
```
// SOURCE: src/components/features/control/FlightStatsBar.tsx:88
// h-24 bar with flex-1 stat columns, border-r dividers
```

### Sidebar Panel (from DeviceSidebar)
```
// SOURCE: src/components/features/streams/DeviceSidebar.tsx
// w-60 fixed sidebar, bg-[#0C0D10], rounded-xl, flex-shrink-0
```

---

## Files to Change

| File | Action | Purpose |
|------|--------|---------|
| `src/app/(dashboard)/ai-detection/page.tsx` | REWRITE | New 3-column layout with `-m-6` full-bleed |
| `src/components/features/ai-detection/DetectionStatsBar.tsx` | REWRITE | Compact inline stats bar (like FlightStatsBar) |
| `src/components/features/ai-detection/DetectionPanel.tsx` | CREATE | Compact detection list panel (replaces DetectionCard) |
| `src/components/features/ai-detection/DetectionItem.tsx` | CREATE | Single-line detection row (replaces bulky DetectionCard) |
| `src/components/features/ai-detection/DetectionVideoFeed.tsx` | CREATE | Center video feed with bounding box overlay |
| `src/components/features/ai-detection/DetectionToolbar.tsx` | CREATE | Top toolbar with filters, stream selector, connection status |
| `src/components/features/ai-detection/AlertBanner.tsx` | UPDATE | Minor: match font-poppins styling |
| `src/components/features/ai-detection/DetectionCard.tsx` | DELETE | Replaced by DetectionItem |
| `src/components/features/ai-detection/DetectionFilters.tsx` | DELETE | Merged into DetectionToolbar |
| `src/components/features/ai-detection/DetectionDetailModal.tsx` | KEEP | Still useful for detailed view on click |
| `src/components/features/ai-detection/DetectionMap.tsx` | KEEP | Still useful for map overlay toggle |

---

## Tasks

### Task 1: Rewrite DetectionStatsBar to Compact Inline Bar

- **File**: `src/components/features/ai-detection/DetectionStatsBar.tsx`
- **Action**: REWRITE
- **Implement**: Replace 5-card grid with a single-row compact bar matching `FlightStatsBar` pattern:
  - Container: `relative flex items-center w-full h-14 bg-[#12151C] border border-[#1E2330] rounded-lg overflow-hidden`
  - 5 equal columns with `border-r border-zinc-800/40` dividers
  - Each column: icon (16px, `text-[#AFC6FF]`), value (`text-sm font-semibold font-poppins text-white`), label (`text-[10px] font-normal font-poppins text-[#8C90A0] uppercase tracking-wide`)
  - Live status dot in top-left corner (green pulsing when connected)
  - Remove `StatCard` import, use inline layout
- **Mirror**: `src/components/features/control/FlightStatsBar.tsx:87-126`
- **Validate**: `pnpm run build`

### Task 2: Create DetectionItem (Compact Single-Line Row)

- **File**: `src/components/features/ai-detection/DetectionItem.tsx`
- **Action**: CREATE
- **Implement**: A single-line compact row for each detection:
  - Container: `flex items-center gap-3 px-3 py-2 hover:bg-zinc-800/30 transition-colors border-b border-zinc-800/30 cursor-pointer`
  - Left: Type badge (colored dot `w-2 h-2 rounded-full` + text `text-xs font-poppins text-[#E2E2E8]`)
  - Center: Confidence (`text-xs font-mono font-poppins` with color coding), Track ID (`text-[10px] font-poppins text-[#8C90A0]`), Stream ID (`text-[10px] font-poppins text-[#8C90A0]`)
  - Right: Timestamp (`text-[10px] font-poppins text-zinc-500`), Verification status indicator (green checkmark or orange dot)
  - Compact thumbnail (40x30px, `rounded border border-zinc-700`) if imageUrl exists
  - On hover: show "View" button (`text-[10px] font-poppins`)
  - On click: open DetectionDetailModal
  - LLM reasoning: show first 40 chars truncated, expand on click (not a separate section)
- **Mirror**: `src/components/features/streams/DeviceSidebar.tsx:80-100` (compact row pattern)
- **Validate**: `pnpm run build`

### Task 3: Create DetectionPanel (Scrollable Detection List)

- **File**: `src/components/features/ai-detection/DetectionPanel.tsx`
- **Action**: CREATE
- **Implement**: A side panel component that wraps a scrollable list of DetectionItems:
  - Props: `title`, `accentColor` (orange for YOLO, red for LLM), `detections[]`, `count`, `onSelectDetection`
  - Container: `flex flex-col bg-[#0C0D10] border border-zinc-800/50 rounded-xl overflow-hidden`
  - Header: `flex items-center justify-between px-3 py-2 border-b border-zinc-800/50`
    - Title: `text-xs font-semibold font-poppins uppercase tracking-wider` with colored left border (`border-l-2`)
    - Count badge: `text-[10px] font-poppins px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400`
  - Content: `flex-1 overflow-y-auto` with DetectionItem list
  - Empty state: centered text with icon (`text-[10px] font-poppins text-zinc-500`)
  - New item animation: subtle slide-in from top
- **Mirror**: `src/components/features/streams/DeviceSidebar.tsx` (panel structure)
- **Validate**: `pnpm run build`

### Task 4: Create DetectionVideoFeed (Center Video with Bounding Boxes)

- **File**: `src/components/features/ai-detection/DetectionVideoFeed.tsx`
- **Action**: CREATE
- **Implement**: Center video feed with real-time bounding box overlay:
  - Container: `relative bg-[#0C0E12] overflow-hidden flex flex-col rounded-xl border border-zinc-800/50`
  - Top bar (stream controls): `flex items-center gap-2 px-3 py-2 bg-[#12151C] border-b border-zinc-800/60`
    - Stream selector dropdown (styled like Control page `selectCls`)
    - Start/Stop button
    - Quality indicator
  - Video area: `<video>` element with `object-fit: contain`
  - Canvas overlay for bounding boxes (drawn in requestAnimationFrame loop)
  - Bounding box colors: orange for YOLO, red for LLM verified, with class label + confidence text
  - Bottom HUD overlay: connection status, active stream ID, detection count
  - Empty state: scanline pattern with "Select a stream to begin monitoring" text
  - Reuse existing `WebRTCPlayer` component for stream connection
- **Mirror**: `src/components/features/control/MissionControlViewport.tsx:100-200` (video area pattern)
- **Validate**: `pnpm run build`

### Task 5: Create DetectionToolbar (Top Filter Bar)

- **File**: `src/components/features/ai-detection/DetectionToolbar.tsx`
- **Action**: CREATE
- **Implement**: Compact top toolbar matching FeedToolbar style:
  - Container: `flex items-center justify-between px-3 py-2 bg-[#12151C] border border-[#1E2330] rounded-lg flex-shrink-0`
  - Left: Title "AI Detection" + connection status indicator (pulsing dot + "Live"/"Disconnected")
  - Center: Compact filter pills (Status, Type, Stream) — inline dropdowns styled like FeedToolbar toggle
  - Right: Map toggle button, Sound toggle button
  - All text: `font-poppins`, labels `text-[10px] uppercase tracking-wide text-[#8C90A0]`
  - Dropdowns: `bg-zinc-900 border border-zinc-800 rounded-lg` with `text-xs font-poppins`
- **Mirror**: `src/components/features/streams/FeedToolbar.tsx:1-85`
- **Validate**: `pnpm run build`

### Task 6: Rewrite Main Page to 3-Column Layout

- **File**: `src/app/(dashboard)/ai-detection/page.tsx`
- **Action**: REWRITE
- **Implement**: Complete layout redesign:
  - Wrap in `-m-6` for full-bleed (like Control page)
  - Structure:
    ```
    <MainLayout title="AI & Object Detection" subtitle="Intelligent threat detection and object recognition">
      <div className="-m-6">
        <div className="flex flex-col h-[calc(100vh-10rem)] font-poppins">
          <DetectionToolbar />
          <DetectionStatsBar />
          <div className="flex gap-4 flex-1 min-h-0 p-4">
            <DetectionPanel title="YOLO Detections" accentColor="orange" ... />
            <DetectionVideoFeed ... />
            <DetectionPanel title="Verified Threats" accentColor="red" ... />
          </div>
        </div>
      </div>
    </MainLayout>
    ```
  - Map toggle: when enabled, overlay DetectionMap as a slide-over panel (not replacing content)
  - AlertBanner stays as fixed overlay
  - DetectionDetailModal stays as click-through
  - State: manage selectedDetection, streamFilter, typeFilter, statusFilter, showMap, soundEnabled
- **Mirror**: `src/app/(dashboard)/control/page.tsx:7` + `src/app/(dashboard)/live-feed/page.tsx:145`
- **Validate**: `pnpm run build`

### Task 7: Update AlertBanner Typography

- **File**: `src/components/features/ai-detection/AlertBanner.tsx`
- **Action**: UPDATE
- **Implement**: Add `font-poppins` to all text elements and match sizing:
  - Alert title: `text-xs font-semibold font-poppins text-red-200 capitalize` (was `text-sm`)
  - Alert detail: `text-[10px] font-poppins text-red-300/70` (was `text-xs`)
  - View button: `text-[10px] font-poppins px-2 py-1` (was `text-xs px-3 py-1.5`)
  - Sound toggle: match the pill-button style from DetectionToolbar
- **Mirror**: `src/components/features/control/FlightStatsBar.tsx:97-99`
- **Validate**: `pnpm run build`

### Task 8: Clean Up Obsolete Files

- **File**: `src/components/features/ai-detection/DetectionCard.tsx`
- **Action**: DELETE (or keep as deprecated import)
- **Implement**: Remove the bulky card component. Its logic (type colors, confidence colors) moves to DetectionItem.

- **File**: `src/components/features/ai-detection/DetectionFilters.tsx`
- **Action**: DELETE (or keep as deprecated import)
- **Implement**: Filter logic moves into DetectionToolbar.

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

- [ ] All tasks completed
- [ ] Type check passes (`pnpm run build`)
- [ ] 3-column layout: YOLO panel (left) | Video feed (center) | LLM panel (right)
- [ ] Compact stats bar matching FlightStatsBar style
- [ ] Compact detection items (single-line rows, not big cards)
- [ ] All text uses `font-poppins` with correct sizes (`text-[10px]`, `text-xs`, `text-sm`)
- [ ] Dark theme colors consistent with Control/Live Feed (`#0C0D10`, `#12151C`, `#1E2330`)
- [ ] Live video feed with bounding box overlay in center
- [ ] Validation actions (click to view detail, expand reasoning)
- [ ] Connection status indicator (pulsing dot)
- [ ] Map overlay toggle (slide-over, not replacing layout)
- [ ] Alert banner with sound toggle
- [ ] No big cards — all content is compact and inline
- [ ] Responsive: panels stack vertically on smaller screens
