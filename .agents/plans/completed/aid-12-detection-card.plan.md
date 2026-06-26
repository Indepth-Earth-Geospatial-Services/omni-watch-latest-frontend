# Plan: AID-12 — Detection Card Component

## Summary

Create a `DetectionCard` component that displays a single `ThreatDetection` as a self-contained card. This sits between the existing compact `DetectionItem` (list row) and the full `DetectionDetailModal` (overlay) in terms of detail level. It shows thumbnail, type badge, confidence, status, track/stream IDs, timestamp, optional reasoning preview, and GPS coordinates. The card is clickable and opens the detail modal. Built using shadcn `Card`/`CardContent` to match `IncidentCard` and `MetricCard` patterns.

## User Story

As a Surveillance Operator
I want to view AI detections as individual cards with key details at a glance
So that I can quickly scan and assess threats without opening each detail modal

## Metadata

| Field | Value |
|-------|-------|
| Type | NEW_CAPABILITY |
| Complexity | LOW |
| Systems Affected | AI Detection UI |
| Jira Issue | AID-12 |

---

## Patterns to Follow

### Card wrapper (shadcn pattern)
```tsx
// SOURCE: src/components/features/incidents/incident-card.tsx:42-47
<Card className={cn(
  "incident-item p-4 bg-card border-l-4 transition-all hover:translate-x-1",
  getStatusColor(status).split(' ')[1],
  className
)}>
  <CardContent className="p-0">
```

### Click + keyboard accessibility
```tsx
// SOURCE: src/components/features/ai-detection/DetectionItem.tsx:26-42
const handleKeyDown = (e: React.KeyboardEvent) => {
  if (onSelect && (e.key === 'Enter' || e.key === ' ')) {
    e.preventDefault();
    onSelect(d);
  }
};

<div
  onClick={onSelect ? () => onSelect(d) : undefined}
  onKeyDown={handleKeyDown}
  role={onSelect ? 'button' : undefined}
  tabIndex={onSelect ? 0 : undefined}
>
```

### Type dot color mapping
```tsx
// SOURCE: src/components/features/ai-detection/DetectionItem.tsx:13-21
const typeDotColor: Record<string, string> = {
  person: 'bg-blue-400',
  vehicle: 'bg-green-400',
  boat: 'bg-cyan-400',
  weapon: 'bg-red-400',
  suspicious: 'bg-orange-400',
  drone: 'bg-purple-400',
  animal: 'bg-yellow-400',
};
```

### Confidence color utility
```tsx
// SOURCE: src/components/features/ai-detection/lib/detection-utils.ts:1-4
export function getConfidenceColor(confidence: number): string {
  if (confidence >= 0.8) return 'text-[#45F0CF]';
  if (confidence >= 0.5) return 'text-amber-400';
  return 'text-red-400';
}
```

### Status badge
```tsx
// SOURCE: src/components/features/ai-detection/DetectionDetailModal.tsx:61-68
<span className={cn(
  'text-xs px-2 py-0.5 rounded text-white',
  d.isVerified ? 'bg-green-500' : 'bg-orange-500'
)}>
  {d.isVerified ? 'Verified' : 'Pending'}
</span>
```

### Image thumbnail with fallback
```tsx
// SOURCE: src/components/features/ai-detection/DetectionItem.tsx:48-56
{d.imageUrl ? (
  <div className='w-8 h-6 rounded overflow-hidden border border-zinc-700/50 bg-zinc-900'>
    <img src={d.imageUrl} alt='' className='w-full h-full object-cover' loading='lazy' />
  </div>
) : (
  <div className='w-8 h-6 rounded border border-zinc-800 bg-zinc-900 flex items-center justify-center'>
    <ImageOff className='w-2.5 h-2.5 text-zinc-700' />
  </div>
)}
```

### Time formatting
```tsx
// SOURCE: src/lib/utils.ts:24-35
export function formatTimeAgo(date: Date): string {
  const now = new Date()
  const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))
  if (diffInMinutes < 1) return "Just now"
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`
  const diffInHours = Math.floor(diffInMinutes / 60)
  if (diffInHours < 24) return `${diffInHours}h ago`
  const diffInDays = Math.floor(diffInHours / 24)
  return `${diffInDays}d ago`
}
```

### GPS coordinate display
```tsx
// SOURCE: src/components/features/ai-detection/DetectionDetailModal.tsx:142-159
{d.droneLatitude != null && d.droneLongitude != null
  ? `${d.droneLatitude.toFixed(6)}, ${d.droneLongitude.toFixed(6)}`
  : 'N/A'}
```

---

## Files to Change

| File | Action | Purpose |
|------|--------|---------|
| `src/components/features/ai-detection/DetectionCard.tsx` | CREATE | New card component for individual detections |
| `src/app/(dashboard)/ai-detection/page.tsx` | UPDATE | Import and optionally render DetectionCard (e.g., in a grid view mode) |

---

## Tasks

### Task 1: Create DetectionCard component

- **File**: `src/components/features/ai-detection/DetectionCard.tsx`
- **Action**: CREATE
- **Implement**:
  - `'use client'` directive at top
  - Props interface `DetectionCardProps` with:
    - `detection: ThreatDetection` — the detection data
    - `onSelect?: (detection: ThreatDetection) => void` — click handler (opens detail modal)
    - `className?: string` — external override
  - Use shadcn `Card` + `CardContent` from `@/components/ui/card`
  - Use `cn()` from `@/lib/utils` for class composition
  - Import icons from `lucide-react`: `MapPin`, `Clock`, `Shield`, `ImageOff`, `CheckCircle`, `Crosshair`
  - Import `getConfidenceColor` from `./lib/detection-utils`
  - Import `formatTimeAgo` from `@/lib/utils`
  - Import `ThreatDetection` type from `@/lib/types/threats`

  - **Layout** (top to bottom):
    1. **Thumbnail section**: If `imageUrl` exists, show 16:9 aspect-ratio image with `object-cover`, `rounded-t-lg`, `border-b`. If no image, show placeholder with `ImageOff` icon on `bg-zinc-900`.
    2. **Content section** (inside `CardContent className="p-3"`):
       - **Header row**: Type colored dot (`typeDotColor` map from DetectionItem) + capitalized type name + status badge (green "Verified" / orange "Pending") + confidence score using `getConfidenceColor`
       - **Metadata row**: Track ID (`#trackId` in `font-mono`) + stream ID (truncated) + timestamp via `formatTimeAgo`
       - **GPS row** (only if drone lat/lng non-null): `MapPin` icon + drone coordinates formatted to 6 decimals
       - **Reasoning preview** (only if `isVerified && reasoning`): Truncated to ~80 chars with `line-clamp-2`, `text-[10px]`, `text-green-500/60`
    3. **Visual accent**: `border-l-4` with `border-l-orange-500` for pending, `border-l-red-500` for verified (matching DetectionPanel accent pattern)
  - **Interactivity**:
    - Card wrapper gets `onClick`, `onKeyDown`, `role="button"`, `tabIndex={0}` when `onSelect` is provided (mirror DetectionItem pattern exactly)
    - Hover state: `hover:bg-zinc-800/20 transition-colors`
  - **Accessibility**: `handleKeyDown` for Enter/Space with `e.preventDefault()` on Space
  - **Export**: Named export `export function DetectionCard(...)`

- **Mirror**: `src/components/features/incidents/incident-card.tsx:1-76` (Card/CardContent usage), `src/components/features/ai-detection/DetectionItem.tsx:13-96` (detection display logic)
- **Validate**: `pnpm run build`

### Task 2: Wire DetectionCard into AI Detection page

- **File**: `src/app/(dashboard)/ai-detection/page.tsx`
- **Action**: UPDATE
- **Implement**:
  - Import `DetectionCard` from `@/components/features/ai-detection/DetectionCard`
  - Add a view mode toggle state: `const [viewMode, setViewMode] = useState<'panel' | 'grid'>('panel')`
  - Add grid view toggle button in the toolbar area (next to existing map toggle)
  - When `viewMode === 'grid'`, replace the 3-column DetectionPanel layout with a responsive grid of DetectionCard components:
    - Grid: `grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3`
    - Render `filteredDetections.map(d => <DetectionCard key={d.id} detection={d} onSelect={setSelectedDetection} />)`
    - Show empty state when no detections match filters
  - When `viewMode === 'panel'`, keep existing 3-column layout unchanged
  - The existing `DetectionDetailModal` already handles `selectedDetection` state, so no changes needed there

- **Mirror**: `src/app/(dashboard)/ai-detection/page.tsx:271-305` (existing 3-column layout)
- **Validate**: `pnpm run build`

---

## Validation

```bash
# Type check
pnpm run build

# Lint (if configured)
pnpm run lint
```

---

## Acceptance Criteria

- [ ] `DetectionCard.tsx` exists at `src/components/features/ai-detection/DetectionCard.tsx`
- [ ] Component renders all ThreatDetection fields: thumbnail, type, confidence, status, trackId, streamId, timestamp, GPS, reasoning
- [ ] Type color dots match existing `typeDotColor` mapping
- [ ] Confidence colors use `getConfidenceColor` from detection-utils
- [ ] Status badge: green "Verified" / orange "Pending" matching DetectionDetailModal pattern
- [ ] Clickable with `onClick`, `onKeyDown`, `role="button"`, `tabIndex={0}` when `onSelect` provided
- [ ] Keyboard accessible: Enter and Space trigger `onSelect`
- [ ] Uses shadcn `Card`/`CardContent` from `@/components/ui/card`
- [ ] Uses `cn()` from `@/lib/utils`
- [ ] Uses `font-poppins` for body text, `font-mono` for data values
- [ ] `border-l-4` accent: orange for pending, red for verified
- [ ] Image fallback shows `ImageOff` icon when `imageUrl` is null
- [ ] Reasoning preview truncated with `line-clamp-2`
- [ ] GPS coordinates formatted to 6 decimals with `MapPin` icon
- [ ] Grid view toggle works in AI Detection page
- [ ] Grid view shows DetectionCard components in responsive grid
- [ ] Panel view (default) remains unchanged
- [ ] `pnpm run build` passes without errors
