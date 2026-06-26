# Plan: AI Detection Stream Grid UI Update

## Summary

Update the AI detection page's `VideoGrid` and `StreamVideoCard` components to enforce a proper 16:9 aspect ratio on all streams, prevent distortion from vertical stretching, and add an expand/collapse feature so a user can focus on a single stream while hiding the others.

## User Story

As a user monitoring multiple drone feeds,
I want each stream to display in a proper 16:9 aspect ratio without distortion,
and be able to expand any stream to fill the entire grid space,
so that I can focus on a specific feed and then return to the multi-stream grid view.

## Metadata

| Field | Value |
|-------|-------|
| Type | ENHANCEMENT |
| Complexity | MEDIUM |
| Systems Affected | AI Detection video grid |
| Jira Issue | N/A |

---

## Current State

- `VideoGrid.tsx` (`src/components/features/ai-detection/VideoGrid.tsx:62-73`) renders a CSS grid with responsive columns but **no aspect ratio enforcement on the grid itself**.
- `StreamVideoCard.tsx` (`src/components/features/ai-detection/StreamVideoCard.tsx:144`) uses `aspect-video` (16:9) on the video container, BUT the outer `div` (line 112) has no height constraint — when the grid has many rows, the card stretches vertically, causing the video area to distort or overflow.
- There is **no expand/collapse functionality** — all selected streams always show in the grid.

---

## Files to Change

| File | Action | Purpose |
|------|--------|---------|
| `src/components/features/ai-detection/VideoGrid.tsx` | UPDATE | Add `expandedStreamKey` state, expand/collapse logic, pass callbacks to cards |
| `src/components/features/ai-detection/StreamVideoCard.tsx` | UPDATE | Add expand button (maximize icon) and collapse button (minimize icon) in header, accept `onExpand`/`onCollapse`/`isExpanded` props |
| `src/app/(dashboard)/ai-detection/page.tsx` | NO CHANGE | VideoGrid manages its own expanded state internally — no page-level changes needed |

---

## Tasks

### Task 1: Add expand/collapse state and logic to VideoGrid

- **File**: `src/components/features/ai-detection/VideoGrid.tsx`
- **Action**: UPDATE
- **Implement**:
  1. Add `expandedStreamKey` state (`useState<string | null>(null)`)
  2. When a stream is expanded, render only that one `StreamVideoCard` in a full-size container (no grid, just a single card filling the space)
  3. When collapsed (`expandedStreamKey === null`), render the normal responsive grid
  4. Pass `onExpand`, `onCollapse`, `isExpanded` props to each `StreamVideoCard`
  5. Ensure the grid enforces 16:9 by wrapping in a container that constrains height proportionally, or using `aspect-video` on grid cells

**Grid aspect ratio approach**: Use `aspect-video` (16:9) on each grid cell container so cards maintain proper proportions regardless of available space. The grid itself uses `flex-1 min-h-0` to fill available height, and each cell's height is driven by its width via the aspect ratio.

**Expanded view**: When expanded, render the single `StreamVideoCard` with `className='w-full h-full'` and no grid wrapper, filling the entire center column.

### Task 2: Add expand/collapse buttons to StreamVideoCard

- **File**: `src/components/features/ai-detection/StreamVideoCard.tsx`
- **Action**: UPDATE
- **Implement**:
  1. Add props: `onExpand?: () => void`, `onCollapse?: () => void`, `isExpanded?: boolean`
  2. In the header bar (line 122-141), add an expand button (Maximize2 icon) when not expanded
  3. When expanded, show a minimize/collapse button (Minimize2 icon) instead
  4. Import `Maximize2` and `Minimize2` from `lucide-react`
  5. Style buttons to match existing header aesthetics (small, zinc-500 hover:text-zinc-300)

### Task 3: Verify and validate

- **File**: N/A
- **Action**: VALIDATE
- **Implement**: Run `pnpm run build` to verify no type errors, then visually confirm:
  - Grid cells maintain 16:9 ratio
  - Expand button appears on each card header
  - Clicking expand shows only that stream filling the space
  - Collapse button returns to grid view
  - No distortion on any screen size

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

- [ ] Each stream in the grid displays in 16:9 aspect ratio without distortion
- [ ] Grid cells adapt to available space while maintaining 16:9
- [ ] Each `StreamVideoCard` header has an expand (maximize) button
- [ ] Clicking expand hides all other streams and fills the center column with the selected stream
- [ ] A collapse (minimize) button appears on the expanded stream to return to grid view
- [ ] No vertical stretching or aspect ratio distortion at any screen size
- [ ] Build passes with no type errors
