# Plan: AID-16 — Implement Threat Map Component

## Summary

Enhance the existing `ThreatMap.tsx` component to fully satisfy the AID-16 story criteria. The component already exists with basic functionality (dark basemap, blue drone marker, red object marker, scroll zoom disabled). This plan adds the missing pieces: pulsing animation on the object marker, `MapRef` cleanup on unmount, a hover tooltip on the drone marker, and `doubleClickZoom` disabled. The parent `DetectionDetailModal.tsx` already lazy-loads ThreatMap via `next/dynamic` — no changes needed there.

## User Story

As a SOC operator,
I want a lightweight map in the threat inspection modal showing both the drone position and detected object position,
So that I can understand the spatial context of the detection.

## Metadata

| Field | Value |
|-------|-------|
| Type | ENHANCEMENT |
| Complexity | LOW |
| Systems Affected | Frontend (AI Detection module) |
| Jira Issue | AID-16 |

---

## Patterns to Follow

### Map Component Pattern (from DetectionMap.tsx)
```tsx
// SOURCE: src/components/features/ai-detection/DetectionMap.tsx:1-7
'use client';
import { useMemo } from 'react';
import Map, { Marker, NavigationControl } from 'react-map-gl/maplibre';
import { MapPin } from 'lucide-react';
import 'maplibre-gl/dist/maplibre-gl.css';
import type { ThreatDetection } from '@/lib/types/threats';
```

### MapRef Cleanup Pattern (from geo-map.tsx)
```tsx
// SOURCE: src/components/features/geospaital-map/geo-map.tsx:19,51,56-63
import Map, { Marker, NavigationControl, Source, Layer, MapRef } from 'react-map-gl/maplibre';
const mapRef = useRef<MapRef>(null);

useEffect(
  () => () => {
    mapRef.current?.stop();
  },
  []
);
```

### Hover Tooltip Pattern (from DetectionMap.tsx)
```tsx
// SOURCE: src/components/features/ai-detection/DetectionMap.tsx:60-78
<div className="group relative cursor-pointer">
  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
    <div className="bg-neutral-900/95 backdrop-blur-sm border border-gray-700/60 px-2.5 py-1.5 rounded-lg shadow-xl whitespace-nowrap">
      <p className="text-[11px] font-semibold text-gray-100 leading-none capitalize">
        {d.type} — Drone
      </p>
      <p className="text-[9px] text-gray-500 mt-0.5">
        {(d.confidence * 100).toFixed(1)}% · {d.streamId}
      </p>
    </div>
    <div className="w-0 h-0 border-l-[4px] border-l-transparent border-r-[4px] border-r-transparent border-t-[4px] border-t-neutral-900/95 mx-auto" />
  </div>
  <MapPin ... />
</div>
```

### Pulsing Marker Pattern (from geo-map.tsx dead CSS + TacticalMiniMap.tsx animate-ping)
```tsx
// SOURCE: src/components/features/geospaital-map/geo-map.tsx:786-800
// Custom keyframe (unused but intended for threat markers):
@keyframes markerPulse {
  0%   { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(239,68,68,0.7); }
  70%  { transform: scale(1);    box-shadow: 0 0 0 10px rgba(239,68,68,0); }
  100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(239,68,68,0); }
}

// SOURCE: src/components/features/geospaital-map/TacticalMiniMap.tsx:100
<div className="... animate-ping ..." />  // Expanding ring effect on dock markers
```

### Lazy Loading Pattern (from DetectionDetailModal.tsx)
```tsx
// SOURCE: src/components/features/ai-detection/DetectionDetailModal.tsx:11-14
const ThreatMap = dynamic(() => import('./ThreatMap').then((mod) => mod.ThreatMap), {
  loading: () => <div className='h-48 animate-pulse bg-neutral-800 rounded-lg border border-zinc-800/50' />,
  ssr: false,
});
```
**Already implemented — no changes needed in DetectionDetailModal.tsx.**

---

## Files to Change

| File | Action | Purpose |
|------|--------|---------|
| `src/components/features/ai-detection/ThreatMap.tsx` | UPDATE | Add pulsing animation, MapRef cleanup, drone hover tooltip, disable doubleClickZoom |

**No other files need changes.** `DetectionDetailModal.tsx` already lazy-loads `ThreatMap` correctly.

---

## Tasks

Execute in order. Each task is atomic and verifiable.

### Task 1: Add MapRef and Cleanup on Unmount

- **File**: `src/components/features/ai-detection/ThreatMap.tsx`
- **Action**: UPDATE
- **Implement**:
  1. Import `useRef` and `useEffect` from React
  2. Import `MapRef` from `react-map-gl/maplibre`
  3. Add `const mapRef = useRef<MapRef>(null);`
  4. Add cleanup effect: `useEffect(() => () => { mapRef.current?.stop(); }, []);`
  5. Add `ref={mapRef}` to the `<Map>` component
- **Mirror**: `src/components/features/geospaital-map/geo-map.tsx:19,51,56-63`
- **Validate**: `pnpm run build`

### Task 2: Disable Double-Click Zoom

- **File**: `src/components/features/ai-detection/ThreatMap.tsx`
- **Action**: UPDATE
- **Implement**: Add `doubleClickZoom={false}` to the `<Map>` component props (alongside existing `scrollZoom={false}` and `dragRotate={false}`)
- **Mirror**: N/A — follows same modal-safe interaction pattern as existing props
- **Validate**: `pnpm run build`

### Task 3: Add Pulsing Animation to Object Marker

- **File**: `src/components/features/ai-detection/ThreatMap.tsx`
- **Action**: UPDATE
- **Implement**:
  1. Wrap the object `MapPin` in a container div with a pulsing ring effect using Tailwind's `animate-ping` on an absolute-positioned pseudo-element
  2. Apply this pattern:
     ```tsx
     <div className="relative">
       {/* Pulsing ring */}
       <span className="absolute inset-0 -m-1 rounded-full bg-red-500/30 animate-ping" />
       {/* Pin icon */}
       <MapPin className="w-6 h-6 text-red-500 ..." />
     </div>
     ```
  3. Only render the pulse when the object marker is visible (already guarded by `objectLatitude/objectLongitude != null` check)
- **Mirror**: `src/components/features/geospaital-map/TacticalMiniMap.tsx:96-101` (animate-ping pattern on dock marker)
- **Validate**: `pnpm run build`

### Task 4: Add Hover Tooltip to Drone Marker

- **File**: `src/components/features/ai-detection/ThreatMap.tsx`
- **Action**: UPDATE
- **Implement**:
  1. Wrap the drone `MapPin` in a `group relative` container (matching object marker pattern)
  2. Add a hover tooltip with detection type, confidence, and stream ID
  3. Use the exact same tooltip structure as the object marker and `DetectionMap.tsx:60-78`
- **Mirror**: `src/components/features/ai-detection/DetectionMap.tsx:60-78` and `src/components/features/ai-detection/ThreatMap.tsx:52-63` (existing object tooltip)
- **Validate**: `pnpm run build`

---

## Final State of ThreatMap.tsx

After all tasks, the component should:

```tsx
'use client';

import { useRef, useEffect } from 'react';
import Map, { Marker, NavigationControl, type MapRef } from 'react-map-gl/maplibre';
import { MapPin } from 'lucide-react';
import 'maplibre-gl/dist/maplibre-gl.css';
import type { ThreatDetection } from '@/lib/types/threats';

interface ThreatMapProps {
  detection: ThreatDetection;
}

const MAP_STYLE = 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json';

export function ThreatMap({ detection }: ThreatMapProps) {
  const mapRef = useRef<MapRef>(null);

  // Cleanup: cancel in-flight map animation on unmount
  useEffect(
    () => () => {
      mapRef.current?.stop();
    },
    []
  );

  const droneLat = detection.droneLatitude ?? 4.8242;
  const droneLng = detection.droneLongitude ?? 7.0336;

  return (
    <div className='h-48 w-full rounded-lg border border-zinc-800/50 overflow-hidden'>
      <Map
        ref={mapRef}
        initialViewState={{
          longitude: droneLng,
          latitude: droneLat,
          zoom: 16,
        }}
        mapStyle={MAP_STYLE}
        style={{ width: '100%', height: '100%' }}
        scrollZoom={false}
        dragRotate={false}
        doubleClickZoom={false}
        attributionControl={false}
      >
        <NavigationControl position='top-left' />

        {/* Drone marker with hover tooltip */}
        <Marker longitude={droneLng} latitude={droneLat} anchor='bottom'>
          <div className='group relative'>
            <div className='absolute bottom-full left-1/2 -translate-x-1/2 mb-1 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10'>
              <div className='bg-neutral-900/95 backdrop-blur-sm border border-gray-700/60 px-2.5 py-1.5 rounded-lg shadow-xl whitespace-nowrap'>
                <p className='text-[11px] font-semibold text-gray-100 leading-none capitalize'>
                  {detection.type} — Drone
                </p>
                <p className='text-[9px] text-gray-500 mt-0.5'>
                  {(detection.confidence * 100).toFixed(1)}% · {detection.streamId}
                </p>
              </div>
              <div className='w-0 h-0 border-l-[4px] border-l-transparent border-r-[4px] border-r-transparent border-t-[4px] border-t-neutral-900/95 mx-auto' />
            </div>
            <MapPin
              className='w-6 h-6 text-blue-500 drop-shadow-[0_2px_6px_rgba(0,0,0,0.5)]'
              strokeWidth={1.5}
              fill='rgba(59,130,246,0.25)'
            />
          </div>
        </Marker>

        {/* Object marker with pulsing ring and hover tooltip */}
        {detection.objectLatitude != null && detection.objectLongitude != null && (
          <Marker
            longitude={detection.objectLongitude}
            latitude={detection.objectLatitude}
            anchor='bottom'
          >
            <div className='group relative'>
              <div className='absolute bottom-full left-1/2 -translate-x-1/2 mb-1 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10'>
                <div className='bg-neutral-900/95 backdrop-blur-sm border border-gray-700/60 px-2.5 py-1.5 rounded-lg shadow-xl whitespace-nowrap'>
                  <p className='text-[11px] font-semibold text-gray-100 leading-none capitalize'>
                    {detection.type} — Object
                  </p>
                  <p className='text-[9px] text-gray-500 mt-0.5'>
                    {(detection.confidence * 100).toFixed(1)}% · {detection.streamId}
                  </p>
                </div>
                <div className='w-0 h-0 border-l-[4px] border-l-transparent border-r-[4px] border-r-transparent border-t-[4px] border-t-neutral-900/95 mx-auto' />
              </div>
              <div className='relative'>
                <span className='absolute -inset-1 rounded-full bg-red-500/30 animate-ping' />
                <MapPin
                  className='w-6 h-6 text-red-500 drop-shadow-[0_2px_6px_rgba(0,0,0,0.5)]'
                  strokeWidth={1.5}
                  fill='rgba(239,68,68,0.25)'
                />
              </div>
            </div>
          </Marker>
        )}
      </Map>
    </div>
  );
}
```

---

## Validation

```bash
# Type check + build
pnpm run build

# Lint
pnpm run lint
```

---

## Acceptance Criteria

- [ ] All 4 tasks completed
- [ ] Type check passes (`pnpm run build`)
- [ ] Lint passes (`pnpm run lint`)
- [ ] Dark basemap centered on threat coordinates ✓
- [ ] Blue marker at drone position with hover tooltip ✓
- [ ] Red pulsing marker at object position (only when coordinates available) ✓
- [ ] Scroll zoom disabled ✓
- [ ] Double-click zoom disabled ✓
- [ ] Drag rotate disabled ✓
- [ ] Attribution control disabled ✓
- [ ] MapRef cleanup on unmount (`mapRef.current?.stop()`) ✓
- [ ] Lazy loaded via `next/dynamic` in DetectionDetailModal (already done) ✓
- [ ] Follows existing codebase patterns ✓
