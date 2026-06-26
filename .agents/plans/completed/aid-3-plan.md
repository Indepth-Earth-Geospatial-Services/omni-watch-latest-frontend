# Plan: AID-3 — AI Detection Feature Enhancement

## Summary

Enhance the existing AI Detection module with map integration for detection locations, a detail modal for inspecting individual detections, real-time toast alerts for high-confidence threats, and export capability. The current implementation provides a functional live detection feed; this plan adds spatial context, deeper inspection, and alerting.

## User Story

As a Surveillance Operator
I want to see AI detections on a map and receive real-time alerts for high-confidence threats
So that I can quickly locate and assess threats spatially without switching between pages

## Metadata

| Field | Value |
|-------|-------|
| Type | ENHANCEMENT |
| Complexity | MEDIUM |
| Systems Affected | Frontend (AI Detection page, hooks, types, components) |
| Jira Issue | AID-3 |

---

## Patterns to Follow

### Page Structure
```typescript
// SOURCE: src/app/(dashboard)/dashboard/page.tsx:1-17
'use client';
import { MainLayout } from '@/components/layout/main-layout';
import { StatCard } from '@/components/features/metrics/stat-card';
import { useHook } from '@/hooks/useHook';
// ... icons from lucide-react
export default function Page() { ... }
```

### Hook Pattern (Query Key Factory)
```typescript
// SOURCE: src/hooks/useProjects.ts:12-16
const projectKeys = {
  all: ['projects'] as const,
  list: [...projectKeys.all, 'list'] as const,
  detail: (id: string) => [...projectKeys.all, id] as const,
};
```

### Feature Component Pattern
```typescript
// SOURCE: src/components/features/incidents/incident-card.tsx:1-16
"use client";
import { cn } from '@/lib/utils';
import type { ... } from '@/lib/types/...';
interface Props { ... }
export function Component({ ... }: Props) { ... }
```

### Controlled Filter Pattern
```typescript
// SOURCE: src/components/features/filters/search-filter.tsx:19-25
interface SearchFilterProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder?: string;
  filters: FilterConfig[];
}
```

### formatTimeAgo Utility
```typescript
// SOURCE: src/lib/utils.ts:24-35
export function formatTimeAgo(date: Date): string { ... }
```

---

## Files to Change

| File | Action | Purpose |
|------|--------|---------|
| `src/components/features/ai-detection/DetectionMap.tsx` | CREATE | Map component showing detection markers with dual GPS |
| `src/components/features/ai-detection/DetectionDetailModal.tsx` | CREATE | Modal for inspecting a single detection (image, bbox, GPS, reasoning) |
| `src/components/features/ai-detection/AlertBanner.tsx` | CREATE | Real-time toast/banner for high-confidence alerts |
| `src/app/(dashboard)/ai-detection/page.tsx` | UPDATE | Integrate DetectionMap, AlertBanner, and detail modal state |
| `src/hooks/useAIDetections.ts` | UPDATE | Add alert queue for high-confidence detections, sound toggle |
| `src/lib/types/threats.ts` | UPDATE | Add `DetectionAlert` type and `MapMarker` interface |

---

## Tasks

Execute in order. Each task is atomic and verifiable.

### Task 1: Add alert and map types to threats.ts

- **File**: `src/lib/types/threats.ts`
- **Action**: UPDATE
- **Implement**: Add `DetectionAlert` interface (id, detection, createdAt) and `MapMarker` interface (id, lat, lng, type, confidence, isVerified, color) for map integration
- **Mirror**: `src/lib/types/threats.ts:76-106` — follow existing `ThreatDetection` interface style
- **Validate**: `pnpm run build`

### Task 2: Enhance useAIDetections hook with alert queue and sound

- **File**: `src/hooks/useAIDetections.ts`
- **Action**: UPDATE
- **Implement**:
  - Add `alerts` state (last 5 high-confidence detections with score >= 0.85)
  - Add `soundEnabled` toggle state
  - Add `clearAlert(id)` callback
  - Play alert sound on new TRACK_CONFIRMED events when sound enabled
  - Return `alerts`, `soundEnabled`, `toggleSound`, `clearAlert` from hook
- **Mirror**: `src/hooks/useAIDetections.ts:64-153` — extend existing hook return shape
- **Validate**: `pnpm run build`

### Task 3: Create DetectionMap component

- **File**: `src/components/features/ai-detection/DetectionMap.tsx`
- **Action**: CREATE
- **Implement**:
  - Accept `detections: ThreatDetection[]` prop
  - Render a MapLibre GL map (dark style: `https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json`)
  - Plot markers for each detection with dual GPS (drone position = blue pin, object position = red pin)
  - Color-code markers: orange = YOLO pending, green = verified
  - Click marker opens DetectionDetailModal
  - Reuse MapLibre from existing `maplibre-gl` dependency
  - Use `'use client'` directive
- **Mirror**: `src/components/features/geospaital-map/geo-map.tsx` — follow MapLibre init pattern
- **Validate**: `pnpm run build`

### Task 4: Create DetectionDetailModal component

- **File**: `src/components/features/ai-detection/DetectionDetailModal.tsx`
- **Action**: CREATE
- **Implement**:
  - Accept `detection: ThreatDetection | null` and `onClose: () => void` props
  - Render modal overlay with detection details: image, bounding box visualization, GPS coordinates, confidence score, LLM reasoning, timestamps
  - Use `cn()` utility for conditional classes
  - Close on Escape key and backdrop click
  - Show "Open in Geospatial Map" link that navigates to `/geospatial` with coordinates as query params
- **Mirror**: `src/components/features/incidents/incident-card.tsx:1-76` — follow card styling + `cn()` pattern
- **Validate**: `pnpm run build`

### Task 5: Create AlertBanner component

- **File**: `src/components/features/ai-detection/AlertBanner.tsx`
- **Action**: CREATE
- **Implement**:
  - Accept `alerts: DetectionAlert[]`, `onDismiss: (id: string) => void`, `soundEnabled: boolean`, `onToggleSound: () => void` props
  - Render a fixed-position banner at top of page showing recent alerts
  - Each alert shows: type, confidence %, stream ID, "View" button
  - Sound toggle button with speaker icon
  - Auto-dismiss alerts after 30 seconds
  - Use `sonner` toast library (already in deps) for additional notifications
- **Mirror**: `src/components/features/metrics/stat-card.tsx:59-67` — follow icon + color pattern
- **Validate**: `pnpm run build`

### Task 6: Update AI Detection page with map, modal, and alerts

- **File**: `src/app/(dashboard)/ai-detection/page.tsx`
- **Action**: UPDATE
- **Implement**:
  - Import DetectionMap, DetectionDetailModal, AlertBanner
  - Add `selectedDetection` state for modal
  - Add `showMap` toggle state
  - Integrate AlertBanner above the stats bar
  - Add "Show Map" / "Hide Map" toggle button in header
  - Render DetectionMap when `showMap` is true (below filters, above detection list)
  - Pass `onSelect` callback from DetectionCard to set `selectedDetection`
  - Render DetectionDetailModal when `selectedDetection` is non-null
  - Pass alert props from useAIDetections
- **Mirror**: `src/app/(dashboard)/ai-detection/page.tsx:80-139` — extend existing page layout
- **Validate**: `pnpm run build`

### Task 7: Update DetectionCard to be clickable

- **File**: `src/components/features/ai-detection/DetectionCard.tsx`
- **Action**: UPDATE
- **Implement**:
  - Add optional `onSelect?: (detection: ThreatDetection) => void` prop
  - Wrap card in a `<button>` or add `onClick` handler when `onSelect` is provided
  - Add cursor-pointer and hover state enhancement
- **Mirror**: `src/components/features/incidents/incident-card.tsx:1-76` — follow interactive card pattern
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

- [ ] All 7 tasks completed
- [ ] `pnpm run build` passes with no errors
- [ ] DetectionMap renders markers with correct GPS positions
- [ ] DetectionDetailModal opens on card click, shows full detection info
- [ ] AlertBanner shows high-confidence alerts with sound toggle
- [ ] Map can be toggled on/off from the page header
- [ ] Clicking "Open in Geospatial Map" navigates with coordinates
- [ ] All components follow existing codebase patterns (naming, styling, imports)
