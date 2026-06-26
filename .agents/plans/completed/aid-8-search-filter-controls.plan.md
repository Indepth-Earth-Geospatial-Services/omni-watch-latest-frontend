# Plan: AID-8 — Search and Time Range Filter Controls

## Summary

Add a text search input and time range filter dropdown to the AI Detection page toolbar. Search filters the YOLO/LLM detection panels by class name (person, vehicle, etc.) without affecting video overlay rendering. Time range filter restricts visible detections to a configurable window (Today / Last Hour / Last 24h / All) using in-memory filtering on the WebSocket-fed `detections` array.

## User Story

As a SOC operator
I want to search detections by class and filter by time range
So that I can quickly find specific threats without losing situational awareness on video feeds

## Metadata

| Field | Value |
|-------|-------|
| Type | ENHANCEMENT |
| Complexity | LOW |
| Systems Affected | Frontend (AI Detection page, DetectionToolbar) |
| Jira Issue | AID-8 |

---

## Design Decisions

1. **Search filters panels only** — `yoloDetections` and `verifiedDetections` are filtered by search term. `VideoGrid` continues receiving unfiltered `detections` for bounding box overlays. This preserves situational awareness while allowing operators to browse specific classes.

2. **No device filter** — `StreamSelector` already handles stream/device filtering. Adding a separate device dropdown would be redundant.

3. **Time range is in-memory** — All filtering happens on the `detections` array from `useAIDetections()` (max 200 items). No database queries, no API calls. Just `Date.now()` comparisons against `d.detectedAt`.

4. **Use DetectionToolbar styling** — New controls match existing toolbar conventions (`bg-zinc-900`, `text-xs font-poppins`, `border-zinc-800`), not the `SearchFilter` component style.

---

## Patterns to Follow

### Select Styling (DetectionToolbar)
```typescript
// SOURCE: src/components/features/ai-detection/DetectionToolbar.tsx:18-19
const selectCls =
  'bg-zinc-900 border border-zinc-800 rounded-md px-2 py-1 text-xs font-poppins text-zinc-400 focus:outline-none focus:border-zinc-600 cursor-pointer';
```

### Filter State Pattern (AI Detection Page)
```typescript
// SOURCE: src/app/(dashboard)/ai-detection/page.tsx:78-79
const [statusFilter, setStatusFilter] = useState('all');
const [typeFilter, setTypeFilter] = useState('all');
```

### filteredDetections useMemo
```typescript
// SOURCE: src/app/(dashboard)/ai-detection/page.tsx:119-133
const filteredDetections = useMemo(() => {
  return detections.filter((d) => {
    const matchesStream = selectedStreamIds.size === 0 || selectedStreamIds.has(d.streamId);
    const matchesStatus = statusFilter === 'all' || ...;
    const matchesType = typeFilter === 'all' || d.type === typeFilter;
    return matchesStream && matchesStatus && matchesType;
  });
}, [detections, selectedStreamIds, statusFilter, typeFilter]);
```

### Time Calculation Pattern
```typescript
// SOURCE: src/app/(dashboard)/ai-detection/page.tsx:136-137
const now = new Date();
const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
```

---

## Files to Change

| File | Action | Purpose |
|------|--------|---------|
| `src/components/features/ai-detection/DetectionToolbar.tsx` | UPDATE | Add search input + time range dropdown props and UI |
| `src/app/(dashboard)/ai-detection/page.tsx` | UPDATE | Add state, update filteredDetections, split panel vs video filtering |

---

## Tasks

### Task 1: Extend DetectionToolbar Props

- **File**: `src/components/features/ai-detection/DetectionToolbar.tsx`
- **Action**: UPDATE
- **Implement**: Add new props to `DetectionToolbarProps`:
  ```typescript
  searchTerm: string;
  onSearchChange: (value: string) => void;
  timeRange: string;
  onTimeRangeChange: (value: string) => void;
  ```
- **Mirror**: `src/components/features/ai-detection/DetectionToolbar.tsx:7-16` — extend existing interface
- **Validate**: `pnpm run build`

### Task 2: Add Search Input to DetectionToolbar

- **File**: `src/components/features/ai-detection/DetectionToolbar.tsx`
- **Action**: UPDATE
- **Implement**: Add search `<input>` in the center section (before the existing filter `<select>` elements). Use the existing `selectCls` pattern for consistent styling. Add `Search` icon from lucide-react.
- **Layout**: Search input placed before Status filter, same flex row
- **Mirror**: `src/components/features/filters/search-filter.tsx:39-48` — search input pattern (icon + input)
- **Validate**: `pnpm run build`

### Task 3: Add Time Range Dropdown to DetectionToolbar

- **File**: `src/components/features/ai-detection/DetectionToolbar.tsx`
- **Action**: UPDATE
- **Implement**: Add time range `<select>` after the Type filter. Options: All / Today / Last Hour / Last 24h. Use `selectCls` styling.
- **Mirror**: `src/components/features/ai-detection/DetectionToolbar.tsx:58-66` — existing select pattern
- **Validate**: `pnpm run build`

### Task 4: Add Filter State to AI Detection Page

- **File**: `src/app/(dashboard)/ai-detection/page.tsx`
- **Action**: UPDATE
- **Implement**: Add two new state variables:
  ```typescript
  const [searchTerm, setSearchTerm] = useState('');
  const [timeRange, setTimeRange] = useState('all');
  ```
- **Mirror**: `src/app/(dashboard)/ai-detection/page.tsx:78-79` — existing filter state pattern
- **Validate**: `pnpm run build`

### Task 5: Update filteredDetections with Search and Time Range

- **File**: `src/app/(dashboard)/ai-detection/page.tsx`
- **Action**: UPDATE
- **Implement**: Extend `filteredDetections` useMemo to include:
  - `matchesSearch`: `searchTerm === '' || d.type.toLowerCase().includes(searchTerm.toLowerCase())`
  - `matchesTimeRange`: computed threshold based on `timeRange` value:
    - `'all'` → no filter
    - `'today'` → `d.detectedAt >= todayStart`
    - `'1h'` → `d.detectedAt >= new Date(Date.now() - 3600000)`
    - `'24h'` → `d.detectedAt >= new Date(Date.now() - 86400000)`
  - Add `searchTerm` and `timeRange` to useMemo dependencies
- **Mirror**: `src/app/(dashboard)/ai-detection/page.tsx:119-133` — existing filter logic
- **Validate**: `pnpm run build`

### Task 6: Split Panel vs Video Filtering

- **File**: `src/app/(dashboard)/ai-detection/page.tsx`
- **Action**: UPDATE
- **Implement**: 
  - `filteredDetections` = all filters (stream + status + type + search + time) → used for panels
  - Create `videoDetections` = stream filter only → used for VideoGrid overlays
  - Update VideoGrid to receive `videoDetections` instead of `filteredDetections`
- **Rationale**: Search/time filtering should not hide bounding box overlays on video feeds
- **Mirror**: `src/app/(dashboard)/ai-detection/page.tsx:257-261` — VideoGrid usage
- **Validate**: `pnpm run build`

### Task 7: Pass New Props to DetectionToolbar

- **File**: `src/app/(dashboard)/ai-detection/page.tsx`
- **Action**: UPDATE
- **Implement**: Pass `searchTerm`, `onSearchChange`, `timeRange`, `onTimeRangeChange` to DetectionToolbar component
- **Mirror**: `src/app/(dashboard)/ai-detection/page.tsx:198-208` — existing toolbar props
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

- [ ] Search input appears in toolbar before existing filter dropdowns
- [ ] Typing in search input filters YOLO/LLM panels by class name (case-insensitive)
- [ ] Video grid overlays remain unfiltered when search is active
- [ ] Time range dropdown appears in toolbar with options: All / Today / Last Hour / Last 24h
- [ ] Selecting a time range filters panels to show only detections within that window
- [ ] Time range filter does not affect video grid overlays
- [ ] All existing filters (status, type, stream) continue working
- [ ] Type check passes (`pnpm run build`)
- [ ] Lint passes (`pnpm run lint`)
