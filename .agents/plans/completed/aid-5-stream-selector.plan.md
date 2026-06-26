# Plan: AID-5 — Stream Selector Component

## Summary

Build a `StreamSelector` multi-select dropdown component that lets SOC operators select up to 4 drone streams for AI detection monitoring. The component uses the existing Radix `DropdownMenu` with `CheckboxItem` pattern, sources devices from `useProject()` + `useDJIDevices()`, and persists selection via `sessionStorage`. State is managed in the parent AI detection page.

## User Story

As a SOC operator,
I want to select up to 4 drone streams from a multi-select dropdown,
so that I can choose which video feeds to monitor for AI detection.

## Metadata

| Field | Value |
|-------|-------|
| Type | NEW_CAPABILITY |
| Complexity | MEDIUM |
| Systems Affected | Frontend (components, page, hooks) |
| Jira Issue | AID-5 |

---

## Patterns to Follow

### Multi-Set Toggle Pattern (from ProjectTable)
```tsx
// SOURCE: src/feature-unbording/components/project-components/ProjectTable.tsx
const [selected, setSelected] = useState<Set<string>>(new Set());

const toggleSelect = (id: string) => {
  setSelected((prev) => {
    const next = new Set(prev);
    next.has(id) ? next.delete(id) : next.add(id);
    return next;
  });
};
```

### Radix DropdownMenuCheckboxItem
```tsx
// SOURCE: src/components/ui/dropdown-menu.tsx:93-115
<DropdownMenuCheckboxItem
  checked={selected.has(id)}
  onCheckedChange={() => toggleSelect(id)}
>
  {label}
</DropdownMenuCheckboxItem>
```

### Project Device Resolution
```tsx
// SOURCE: src/app/(dashboard)/live-feed/page.tsx:35-43
const projectSnSet = useMemo(
  () => new Set(activeProject?.devices.map((d) => d.device.device_sn) ?? []),
  [activeProject]
);
const projectDevices = useMemo(
  () => djiDevices.filter((d) => projectSnSet.has(d.deviceSn)),
  [djiDevices, projectSnSet]
);
```

### sessionStorage Persistence
```tsx
// SOURCE: src/providers/ProjectProvider.tsx:74-92
const stored = sessionStorage.getItem(KEY);
sessionStorage.setItem(KEY, JSON.stringify(value));
sessionStorage.removeItem(KEY);
```

### Toolbar Button Styling
```tsx
// SOURCE: src/components/features/ai-detection/DetectionToolbar.tsx:86-96
<button className={`flex items-center gap-1.5 px-2 py-1 rounded-md text-[10px] font-poppins font-semibold transition-colors ${active ? 'bg-[#1C93FF]/15 text-[#1C93FF] border border-[#1C93FF]/30' : 'text-zinc-500 hover:text-zinc-300 border border-transparent'}`}>
```

---

## Files to Change

| File | Action | Purpose |
|------|--------|---------|
| `src/components/features/ai-detection/StreamSelector.tsx` | CREATE | Multi-select dropdown component |
| `src/app/(dashboard)/ai-detection/page.tsx` | UPDATE | Add stream selection state, wire to StreamSelector and video grid |

---

## Tasks

### Task 1: Create StreamSelector Component

- **File**: `src/components/features/ai-detection/StreamSelector.tsx`
- **Action**: CREATE
- **Implement**:
  - Props: `selectedIds: Set<string>`, `onSelectionChange: (ids: Set<string>) => void`, `devices: DJIDevice[]` (already filtered to project), `maxSelections?: number` (default 4)
  - Use Radix `DropdownMenu` + `DropdownMenuTrigger` + `DropdownMenuContent` + `DropdownMenuCheckboxItem` from `@/components/ui/dropdown-menu`
  - Trigger button shows: "Select Streams" with count badge when > 0, styled like DetectionToolbar buttons
  - Each item shows device nickname/name + online status indicator (green dot for online, gray for offline)
  - Filter: only show online devices (`device.status === true`)
  - Enforce max 4: when at limit, uncheckable items show tooltip/text "Maximum 4 streams reached"
  - Include "Select All" / "Clear All" actions at top of dropdown via `DropdownMenuLabel` + buttons
  - Use `DropdownMenuSeparator` between actions and device list
  - Style: follow existing `selectCls` pattern from DetectionVideoFeed for consistent look
- **Mirror**: `src/components/ui/dropdown-menu.tsx:93-115` (CheckboxItem pattern), `src/components/features/streams/DeviceSidebar.tsx:87-156` (device list with status)
- **Validate**: `npx tsc --noEmit`

### Task 2: Wire Stream Selection into AI Detection Page

- **File**: `src/app/(dashboard)/ai-detection/page.tsx`
- **Action**: UPDATE
- **Implement**:
  - Import `useDJIDevices` from `@/hooks/useDJIDevices`
  - Import `StreamSelector` from `@/components/features/ai-detection/StreamSelector`
  - Add device resolution logic (same pattern as live-feed page:35-43):
    ```tsx
    const { data: djiDevices = [] } = useDJIDevices({ refetchInterval: 5_000 });
    const projectSnSet = useMemo(
      () => new Set(activeProject?.devices.map((d) => d.device.device_sn) ?? []),
      [activeProject]
    );
    const projectDevices = useMemo(
      () => djiDevices.filter((d) => projectSnSet.has(d.deviceSn)),
      [djiDevices, projectSnSet]
    );
    ```
  - Add `selectedStreamIds` state with `useState<Set<string>>(() => { ... sessionStorage read ... })` for persistence
  - Add `useEffect` to persist `selectedStreamIds` to `sessionStorage` on change
  - Derive `streamOptions` from `selectedStreamIds` (not from detections)
  - Replace the current `DetectionToolbar` section: add `StreamSelector` inside the toolbar area
  - Remove the single-select `<select>` from `DetectionVideoFeed` (the stream selection now lives in the toolbar)
  - Pass `selectedStreamIds` and `streamOptions` down to `DetectionVideoFeed` and any video grid components
  - When a stream is deselected, its video card should be removed from the grid (this happens naturally if the grid renders based on `selectedStreamIds`)
- **Mirror**: `src/app/(dashboard)/live-feed/page.tsx:18-46` (device resolution + state)
- **Validate**: `npx tsc --noEmit`

### Task 3: Update DetectionVideoFeed to Accept Multi-Stream Props

- **File**: `src/components/features/ai-detection/DetectionVideoFeed.tsx`
- **Action**: UPDATE
- **Implement**:
  - Currently renders a single stream with a `<select>` dropdown. Refactor to:
    - Accept `selectedStreamIds: Set<string>` prop instead of single `activeStreamId`
    - Accept `devices: DJIDevice[]` to show device names as labels
    - Render a single selected stream (the first in the set, or allow tab/switch between them)
    - Remove the `<select>` element from the top bar (selection now in toolbar)
    - Show stream count in top bar: "Live Feed — 2 streams selected"
  - For now, render the **first selected stream** in the main video area (multi-stream grid is AID-6's responsibility)
  - Keep canvas overlay and bounding box drawing working for the active stream
- **Mirror**: `src/components/features/ai-detection/DetectionVideoFeed.tsx:120-136` (current select pattern to remove)
- **Validate**: `npx tsc --noEmit`

---

## Validation

```bash
# Type check
npx tsc --noEmit

# Lint
pnpm run lint
```

---

## Acceptance Criteria

- [ ] `StreamSelector` component exists at `src/components/features/ai-detection/StreamSelector.tsx`
- [ ] Dropdown shows online project devices with status indicators
- [ ] Max 4 selection enforced with "Maximum 4 streams reached" feedback
- [ ] Deselecting a stream removes its video card from the grid
- [ ] Stream selection persists across page navigation (sessionStorage)
- [ ] `npx tsc --noEmit` passes with no errors
- [ ] Component follows existing Radix DropdownMenu patterns
- [ ] Styling matches existing DetectionToolbar aesthetic
