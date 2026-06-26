# Plan: AID-15 — Threat Inspection Modal

## Summary

Enhance the existing `DetectionDetailModal` to become the full Threat Inspection Modal by adding a lazy-loaded MapLibre GL map showing drone + object positions, and "Approve Threat" / "Dismiss" action buttons in the footer. The existing modal already renders detection image, metadata, GPS coordinates, and LLM reasoning — this plan adds the missing spatial context (map) and operator actions (approve/dismiss).

## User Story

As a SOC operator
I want to inspect a verified threat in detail with an image, map showing both drone and object positions, and AI reasoning
So that I can make an informed decision about whether to approve or dismiss it

## Metadata

| Field | Value |
|-------|-------|
| Type | ENHANCEMENT |
| Complexity | MEDIUM |
| Systems Affected | AI Detection frontend (modal, map, page wiring) |
| Jira Issue | AID-15 |

---

## Patterns to Follow

### Modal Structure (Pattern B — standalone fixed-position)
```tsx
// SOURCE: src/components/features/ai-detection/DetectionDetailModal.tsx:48-56
<div className='fixed inset-0 z-50 flex items-center justify-center'>
  <div className='absolute inset-0 bg-black/60 backdrop-blur-sm' onClick={onClose} />
  <div className='relative z-10 w-full max-w-2xl max-h-[90vh] overflow-y-auto mx-4 bg-[#0C0D10] border border-zinc-800/50 rounded-xl shadow-2xl'>
    {/* Header */}
    {/* Content */}
    {/* Footer */}
  </div>
</div>
```

### Approve/Dismiss Button Pattern
```tsx
// SOURCE: src/components/features/control/DebugActivationModal.tsx:72-89
<div className='flex gap-3 px-6 pb-6'>
  <button onClick={onClose}
    className='flex-1 py-2.5 rounded-lg border border-zinc-700 text-zinc-400 text-[11px] font-bold uppercase tracking-widest hover:border-zinc-500 hover:text-zinc-200 transition-colors'>
    Cancel
  </button>
  <button onClick={onConfirm}
    className='flex-1 py-2.5 rounded-lg bg-amber-500/20 border border-amber-500/50 text-amber-400 text-[11px] font-black uppercase tracking-widest hover:bg-amber-500/30 hover:border-amber-400 transition-colors shadow-[0_0_20px_rgba(245,158,11,0.1)]'>
    Activate
  </button>
</div>
```

### Map in Detection Context
```tsx
// SOURCE: src/components/features/ai-detection/DetectionMap.tsx:4-14,40-50
import Map, { Marker, NavigationControl } from 'react-map-gl/maplibre';
import 'maplibre-gl/dist/maplibre-gl.css';
const MAP_STYLE = 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json';
// <Map initialViewState={{ longitude, latitude, zoom }} mapStyle={MAP_STYLE}>
//   <NavigationControl position="top-left" />
//   {markers.map(...)}
// </Map>
```

### Lazy Loading with next/dynamic (ssr: false for MapLibre)
```tsx
// SOURCE: src/app/(website)/page.tsx:48-51 (adapted with ssr: false)
import dynamic from 'next/dynamic';
const ThreatMap = dynamic(() => import('./ThreatMap'), {
  loading: () => <div className='h-48 animate-pulse bg-neutral-800 rounded-lg' />,
  ssr: false,
});
```

### Toast Notifications
```tsx
// SOURCE: src/components/features/control/TakeoffToPointModal.tsx
import { toast } from 'sonner';
toast.success('Threat approved successfully');
toast.error('Failed to approve threat');
```

### Dual GPS Display
```tsx
// SOURCE: src/components/features/ai-detection/DetectionDetailModal.tsx:142-159
<div className='grid grid-cols-2 gap-2 text-sm'>
  <div>
    <span className='text-zinc-500'>Drone: </span>
    <span className='font-mono text-[#E2E2E8]'>
      {d.droneLatitude?.toFixed(6)}, {d.droneLongitude?.toFixed(6)}
    </span>
  </div>
  <div>
    <span className='text-zinc-500'>Object: </span>
    <span className='font-mono text-[#E2E2E8]'>
      {d.objectLatitude?.toFixed(6) ?? 'N/A'}
    </span>
  </div>
</div>
```

---

## Files to Change

| File | Action | Purpose |
|------|--------|---------|
| `src/components/features/ai-detection/ThreatMap.tsx` | CREATE | Lightweight MapLibre GL map for modal — shows drone (blue) + object (red) markers |
| `src/components/features/ai-detection/DetectionDetailModal.tsx` | UPDATE | Add lazy-loaded ThreatMap, add Approve/Dismiss footer buttons, accept onApprove/onDismiss props |
| `src/app/(dashboard)/ai-detection/page.tsx` | UPDATE | Pass onApprove/onDismiss callbacks to DetectionDetailModal, add approve/dismiss handler state |

---

## Tasks

Execute in order. Each task is atomic and verifiable.

### Task 1: Create ThreatMap Component

- **File**: `src/components/features/ai-detection/ThreatMap.tsx`
- **Action**: CREATE
- **Implement**: Create a lightweight MapLibre GL map component for the threat inspection modal. The component receives a single `ThreatDetection` and renders:
  - Dark basemap (CartoDB dark-matter, same as `DetectionMap.tsx:14`)
  - Blue marker at drone position (`droneLatitude`, `droneLongitude`) — always shown if GPS available
  - Red pulsing marker at object position (`objectLatitude`, `objectLongitude`) — shown only if not null
  - `NavigationControl` at top-left
  - Scroll zoom disabled (prevents modal scroll hijack)
  - Drag rotate disabled
  - Attribution control disabled
  - Fixed height `h-48` with rounded corners and border
- **Mirror**: `src/components/features/ai-detection/DetectionMap.tsx:1-115` — reuse marker pattern, basemap URL, import structure
- **Props interface**:
  ```tsx
  interface ThreatMapProps {
    detection: ThreatDetection;
  }
  ```
- **Center map**: Use drone position as center; fallback to `[7.0336, 4.8242]` (Nigeria default from DetectionMap:31)
- **Zoom**: `16` for single point
- **Validate**: `pnpm run build`

### Task 2: Enhance DetectionDetailModal with Map and Action Buttons

- **File**: `src/components/features/ai-detection/DetectionDetailModal.tsx`
- **Action**: UPDATE
- **Implement**:
  1. Add new props: `onApprove?: (detection: ThreatDetection) => void` and `onDismiss?: (detection: ThreatDetection) => void`
  2. Add lazy-loaded `ThreatMap` between the GPS section and LLM Reasoning section:
     ```tsx
     import dynamic from 'next/dynamic';
     const ThreatMap = dynamic(() => import('./ThreatMap'), {
       loading: () => <div className='h-48 animate-pulse bg-neutral-800 rounded-lg border border-zinc-800/50' />,
       ssr: false,
     });
     ```
  3. Render map only when detection has GPS data:
     ```tsx
     {d.droneLatitude != null && d.droneLongitude != null && (
       <div className='bg-zinc-900/50 rounded-lg p-3 border border-zinc-800/50'>
         <div className='flex items-center gap-1 text-xs text-[#8C90A0] mb-2'>
           <MapPin className='w-3 h-3' />
           Location
         </div>
         <ThreatMap detection={d} />
       </div>
     )}
     ```
  4. Add action buttons footer (only for verified threats, i.e., `d.isVerified === true`):
     ```tsx
     {d.isVerified && (onApprove || onDismiss) && (
       <div className='flex gap-3 p-4 border-t border-zinc-800/50'>
         {onDismiss && (
           <button onClick={() => onDismiss(d)}
             className='flex-1 py-2.5 rounded-lg border border-zinc-700 text-zinc-400 text-[11px] font-bold uppercase tracking-widest hover:border-zinc-500 hover:text-zinc-200 transition-colors'>
             Dismiss
           </button>
         )}
         {onApprove && (
           <button onClick={() => onApprove(d)}
             className='flex-1 py-2.5 rounded-lg bg-red-500/20 border border-red-500/50 text-red-400 text-[11px] font-black uppercase tracking-widest hover:bg-red-500/30 hover:border-red-400 transition-colors shadow-[0_0_20px_rgba(239,68,68,0.1)]'>
             Approve Threat
           </button>
         )}
       </div>
     )}
     ```
  5. Add `MapPin` to the lucide-react imports (already imported on line 4)
  6. Add `useCallback` import if needed for button handlers
- **Mirror**: `src/components/features/control/DebugActivationModal.tsx:72-89` — button styling pattern
- **Validate**: `pnpm run build`

### Task 3: Wire Approve/Dismiss Callbacks in Page

- **File**: `src/app/(dashboard)/ai-detection/page.tsx`
- **Action**: UPDATE
- **Implement**:
  1. Add `useCallback` handlers for approve and dismiss:
     ```tsx
     const handleApproveThreat = useCallback((detection: ThreatDetection) => {
       // TODO: Wire to useDetectionActions hook (AID-18) when available
       // For now: log to console and show toast
       console.log('[AID-15] Approve threat:', detection.id);
       toast.success(`Threat approved: ${detection.type} (#${detection.trackId})`);
       setSelectedDetection(null);
     }, []);

     const handleDismissThreat = useCallback((detection: ThreatDetection) => {
       // TODO: Wire to useDetectionActions hook (AID-18) when available
       console.log('[AID-15] Dismiss threat:', detection.id);
       toast.success(`Threat dismissed: ${detection.type} (#${detection.trackId})`);
       setSelectedDetection(null);
     }, []);
     ```
  2. Add `toast` import: `import { toast } from 'sonner'`
  3. Pass callbacks to `DetectionDetailModal`:
     ```tsx
     <DetectionDetailModal
       detection={selectedDetection}
       onClose={() => setSelectedDetection(null)}
       onApprove={handleApproveThreat}
       onDismiss={handleDismissThreat}
     />
     ```
- **Mirror**: `src/app/(dashboard)/ai-detection/page.tsx:367-371` — existing modal usage
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

- [ ] ThreatMap component renders a dark basemap with blue drone marker and red pulsing object marker
- [ ] ThreatMap is lazy-loaded with `next/dynamic` (ssr: false) and shows skeleton while loading
- [ ] DetectionDetailModal shows the map between GPS and LLM Reasoning sections
- [ ] Map only renders when detection has GPS data (droneLatitude/droneLongitude not null)
- [ ] "Approve Threat" button appears in modal footer for verified threats
- [ ] "Dismiss" button appears in modal footer for verified threats
- [ ] Buttons follow existing styling patterns (uppercase, tracking-widest, colored borders)
- [ ] Clicking "Approve Threat" shows toast and closes modal
- [ ] Clicking "Dismiss" shows toast and closes modal
- [ ] Map cleans up properly on modal close (no WebGL context leak)
- [ ] Escape key still closes modal
- [ ] Type check passes (`pnpm run build`)
- [ ] Lint passes (`pnpm run lint`)
