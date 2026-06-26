# Plan: AID-6 — AI Detection Feature (Bug Fixes & Polish)

## Summary

The AI Detection page (`feature/ai-detection-page` branch) has a solid foundation with 9 components, a WebSocket hook, and full type definitions. However, the exploration revealed several bugs, inconsistencies, and missing patterns that need to be addressed before the feature is production-ready. This plan covers bug fixes, deduplication, missing error boundaries, and consistency improvements.

## User Story

As a Surveillance Operator
I want a reliable, bug-free AI Detection dashboard that shows real-time YOLO detections and LLM-verified threats
So that I can monitor drone feeds and respond to threats without UI glitches or missing functionality

## Metadata

| Field | Value |
|-------|-------|
| Type | ENHANCEMENT / BUG_FIX |
| Complexity | MEDIUM |
| Systems Affected | AI Detection UI, WebSocket hook, Type definitions |
| Jira Issue | AID-6 |

---

## Patterns to Follow

### Component Structure
```tsx
// SOURCE: src/components/features/control/Control.tsx
'use client';
import { useState, useCallback, useMemo } from 'react';
import { cn } from '@/lib/utils';
```

### Error Boundary Pattern
```tsx
// SOURCE: src/components/features/control/ControlErrorBoundary.tsx
export class ControlErrorBoundary extends React.Component<
  { children: React.ReactNode; panelName: string },
  { hasError: boolean; error: Error | null }
> { ... }
```

### Memo Pattern for Callbacks
```tsx
// SOURCE: src/components/features/ai-detection/DetectionToolbar.tsx
export const DetectionToolbar = memo(function DetectionToolbar({ ... }: DetectionToolbarProps) { ... });
```

### Dark Theme Color Tokens
```
// SOURCE: src/components/features/ai-detection/DetectionPanel.tsx
bg-[#0C0D10]  — panel background
border-zinc-800/50  — panel borders
bg-[#12151C]  — toolbar/stats bar bg
border-[#1E2330]  — toolbar/stats borders
text-[#E2E2E8]  — primary text
text-[#8C90A0]  — secondary text
text-[#45F0CF]  — verified/high-confidence accent
text-[#AFC6FF]  — blue accent
text-[#1C93FF]  — active/link blue
```

---

## Files to Change

| File | Action | Purpose |
|------|--------|---------|
| `src/components/features/ai-detection/lib/detection-utils.ts` | CREATE | Shared `getConfidenceColor` function |
| `src/components/features/ai-detection/DetectionItem.tsx` | UPDATE | Use shared util, fix keyboard nav |
| `src/components/features/ai-detection/DetectionDetailModal.tsx` | UPDATE | Use shared util, fix styling consistency |
| `src/components/features/ai-detection/AlertBanner.tsx` | UPDATE | Fix prevCountRef anti-pattern |
| `src/components/features/ai-detection/DetectionToolbar.tsx` | UPDATE | Remove inner container (fix double-wrap) |
| `src/components/features/ai-detection/DetectionVideoFeed.tsx` | UPDATE | Fix animation frame leak risk |
| `src/components/features/ai-detection/DetectionMap.tsx` | UPDATE | Wrap in error boundary |
| `src/app/(dashboard)/ai-detection/page.tsx` | UPDATE | Remove duplicate toolbar wrapper, add error boundary |
| `src/hooks/useAIDetections.ts` | UPDATE | Remove dead code exports |
| `src/lib/types/threats.ts` | UPDATE | Remove unused `MapMarker` type |

---

## Tasks

Execute in order. Each task is atomic and verifiable.

### Task 1: Create shared detection-utils.ts

- **File**: `src/components/features/ai-detection/lib/detection-utils.ts`
- **Action**: CREATE
- **Implement**: Extract the duplicated `getConfidenceColor` function into a shared utility. Use the color values from `DetectionItem.tsx` (the primary component): `text-[#45F0CF]` for high (≥0.8), `text-amber-400` for medium (≥0.5), `text-red-400` for low (<0.5).
- **Mirror**: `src/components/features/ai-detection/DetectionItem.tsx:12-20`
- **Validate**: `pnpm run build`

### Task 2: Fix DetectionItem — use shared util, add keyboard nav

- **File**: `src/components/features/ai-detection/DetectionItem.tsx`
- **Action**: UPDATE
- **Implement**:
  1. Replace local `getConfidenceColor` with import from `./lib/detection-utils`
  2. Add `onKeyDown` handler for Enter/Space to activate the button (currently has `role="button"` and `tabIndex={0}` but no keyboard handler)
- **Mirror**: `src/components/features/ai-detection/DetectionItem.tsx:40-55` (the div with role/button)
- **Validate**: `pnpm run build`

### Task 3: Fix DetectionDetailModal — use shared util, fix styling

- **File**: `src/components/features/ai-detection/DetectionDetailModal.tsx`
- **Action**: UPDATE
- **Implement**:
  1. Replace local `getConfidenceColor` with import from `./lib/detection-utils`
  2. Change `bg-card border border-gray-800` to `bg-[#0C0D10] border border-zinc-800/50` to match the rest of the AI detection UI
  3. Change quote style from double to single quotes for class strings (consistency)
- **Mirror**: `src/components/features/ai-detection/DetectionPanel.tsx:14-15` (panel styling)
- **Validate**: `pnpm run build`

### Task 4: Fix AlertBanner prevCountRef anti-pattern

- **File**: `src/components/features/ai-detection/AlertBanner.tsx`
- **Action**: UPDATE
- **Implement**: Change `const prevCountRef = { current: 0 }` (line 22) to `const prevCountRef = useRef(0)` so the ref persists across renders and correctly tracks the previous alert count for sound triggering.
- **Mirror**: `src/hooks/useAIDetections.ts:73-74` (proper useRef usage pattern)
- **Validate**: `pnpm run build`

### Task 5: Fix toolbar double-wrap in page.tsx

- **File**: `src/app/(dashboard)/ai-detection/page.tsx`
- **Action**: UPDATE
- **Implement**: Remove the outer `<div className='flex items-center justify-between px-3 py-2 bg-[#12151C] border border-[#1E2330] rounded-lg ...'>` wrapper around `DetectionToolbar` + `StreamSelector`. Instead, use a simple `<div className='flex items-center justify-between gap-3'>` without background/border styling, since `DetectionToolbar` already renders its own styled container.
- **Mirror**: `src/components/features/ai-detection/DetectionToolbar.tsx:35` (existing container)
- **Validate**: `pnpm run build`

### Task 6: Fix DetectionVideoFeed animation frame leak

- **File**: `src/components/features/ai-detection/DetectionVideoFeed.tsx`
- **Action**: UPDATE
- **Implement**: Move the `requestAnimationFrame` loop into a separate `useEffect` that depends on both `detections` and `canvasRef.current`, so the animation frame ID is always tracked for cleanup regardless of `mediaStream` state. Add a `rafIdRef` to store and cancel the frame.
- **Mirror**: `src/components/features/control/DockMonitor.tsx` (video + canvas pattern)
- **Validate**: `pnpm run build`

### Task 7: Add error boundary around DetectionMap

- **File**: `src/app/(dashboard)/ai-detection/page.tsx`
- **Action**: UPDATE
- **Implement**: Wrap the `{showMap && <DetectionMap ... />}` block in a simple inline error boundary or create a lightweight `AIDetectionErrorBoundary` component. The map imports `maplibre-gl` which can fail to load. On error, show a fallback message instead of crashing the page.
- **Mirror**: `src/components/features/control/ControlErrorBoundary.tsx`
- **Validate**: `pnpm run build`

### Task 8: Clean up dead code in hook and types

- **File**: `src/hooks/useAIDetections.ts`
- **Action**: UPDATE
- **Implement**: Remove `getDetectionsByStream` and `getStats` from the return value (they are never called — the page duplicates this logic with `useMemo`).
- **Mirror**: N/A (dead code removal)
- **Validate**: `pnpm run build`

### Task 9: Remove unused MapMarker type

- **File**: `src/lib/types/threats.ts`
- **Action**: UPDATE
- **Implement**: Remove the `MapMarker` interface (lines 120-128) since it is never imported or used anywhere.
- **Mirror**: N/A (dead code removal)
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

- [ ] All 9 tasks completed
- [ ] `pnpm run build` passes with no errors
- [ ] `pnpm run lint` passes with no errors
- [ ] `getConfidenceColor` exists in exactly one place (`detection-utils.ts`)
- [ ] No double-wrapped toolbar in the AI Detection page
- [ ] AlertBanner sound only plays on new alerts (prevCountRef works)
- [ ] DetectionMap crash does not take down the entire page
- [ ] Keyboard users can activate DetectionItem with Enter/Space
- [ ] DetectionDetailModal styling matches the rest of the AI detection UI
- [ ] No unused exports or types remain
