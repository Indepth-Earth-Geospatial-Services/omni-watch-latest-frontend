# Plan: AID-18 — Inline Map + "View on Map" Hover Action

## Summary

Two changes to the AI Detection page:
1. Move the map from above the 3-column layout into the **center column** (above the VideoGrid), so the YOLO and LLM notification panels remain visible when the map is open.
2. Add a **"View on Map" hover action** on each detection item in both panels. When clicked, it shows the map, zooms to the detection's object coordinates, and displays a MapLibre popup with the detection image + info.

## User Story

As a SOC operator,
I want to view a specific detection on the map without losing sight of my notification panels,
so that I can investigate spatial context while monitoring incoming alerts.

## Metadata

| Field | Value |
|-------|-------|
| Type | ENHANCEMENT |
| Complexity | MEDIUM |
| Systems Affected | Frontend (AI Detection page, DetectionMap, DetectionItem, DetectionPanel) |
| Jira Issue | AID-18 |

---

## Patterns to Follow

### Current Map Rendering (page.tsx:303-313)
```tsx
// Map currently renders ABOVE the 3-column layout:
{showMap && (
  <div className='px-4 pt-3 flex-shrink-0'>
    <MapErrorBoundary>
      <DetectionMap
        detections={filteredDetections}
        onSelectDetection={setSelectedDetection}
      />
    </MapErrorBoundary>
  </div>
)}
```

### 3-Column Layout (page.tsx:340-375)
```tsx
<div className='flex gap-4 flex-1 min-h-0 p-4 pt-3'>
  <DetectionPanel ... />   {/* Left: YOLO */}
  <VideoGrid ... />        {/* Center: Video */}
  <DetectionPanel ... />   {/* Right: Verified */}
</div>
```

### DetectionItem Hover Pattern (DetectionItem.tsx:34-38)
```tsx
<div className={cn(
  'flex items-center gap-2 px-3 py-1.5 transition-colors ...',
  'hover:bg-zinc-800/30'
)}>
```

### MapLibre Popup Pattern (from geo-map.tsx)
```tsx
import Map, { Marker, NavigationControl, Popup } from 'react-map-gl/maplibre';
<Popup
  longitude={lng}
  latitude={lat}
  anchor="bottom"
  closeOnClick={false}
  onClose={() => ...}
>
  {/* popup content */}
</Popup>
```

### flyTo Pattern (from geo-map.tsx)
```tsx
const mapRef = useRef<MapRef>(null);
mapRef.current?.flyTo({ center: [lng, lat], zoom: 16, duration: 1000 });
```

---

## Files to Change

| File | Action | Purpose |
|------|--------|---------|
| `src/app/(dashboard)/ai-detection/page.tsx` | UPDATE | Move map into center column, add `mapFocusDetection` state, pass new props |
| `src/components/features/ai-detection/DetectionItem.tsx` | UPDATE | Add "View on Map" hover button |
| `src/components/features/ai-detection/DetectionPanel.tsx` | UPDATE | Pass `onViewOnMap` callback to DetectionItem |
| `src/components/features/ai-detection/DetectionMap.tsx` | UPDATE | Add `focusDetection` prop, MapRef, flyTo, and Popup |

---

## Tasks

Execute in order. Each task is atomic and verifiable.

### Task 1: Add "View on Map" Hover Button to DetectionItem

- **File**: `src/components/features/ai-detection/DetectionItem.tsx`
- **Action**: UPDATE
- **Implement**:
  1. Add new prop: `onViewOnMap?: (detection: ThreatDetection) => void`
  2. Import `MapPin` from `lucide-react`
  3. Add a hover-visible button in the item row (near the right side, before the time display):
     ```tsx
     {onViewOnMap && d.droneLatitude != null && (
       <button
         onClick={(e) => { e.stopPropagation(); onViewOnMap(d); }}
         className='opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-zinc-700/50'
         title='View on Map'
       >
         <MapPin className='w-3 h-3 text-[#1C93FF]' />
       </button>
     )}
     ```
  4. Only show when `droneLatitude` is not null (has GPS data)
  5. Use `e.stopPropagation()` to prevent triggering the parent `onSelect` click
- **Mirror**: DetectionItem.tsx:34-38 (hover pattern)
- **Validate**: `npx tsc --noEmit`

### Task 2: Pass onViewOnMap Through DetectionPanel

- **File**: `src/components/features/ai-detection/DetectionPanel.tsx`
- **Action**: UPDATE
- **Implement**:
  1. Add new prop: `onViewOnMap?: (detection: ThreatDetection) => void`
  2. Pass it to each `<DetectionItem>`:
     ```tsx
     <DetectionItem
       key={d.id}
       detection={d}
       onSelect={onSelectDetection}
       onViewOnMap={onViewOnMap}
     />
     ```
- **Mirror**: DetectionPanel.tsx:60-61
- **Validate**: `npx tsc --noEmit`

### Task 3: Add focusDetection Prop + flyTo + Popup to DetectionMap

- **File**: `src/components/features/ai-detection/DetectionMap.tsx`
- **Action**: UPDATE
- **Implement**:
  1. Import `useRef, useEffect` from React, `Popup` and `MapRef` from react-map-gl
  2. Add new prop: `focusDetection?: ThreatDetection | null`
  3. Add `mapRef = useRef<MapRef>(null)`
  4. Add cleanup effect: `useEffect(() => () => { mapRef.current?.stop(); }, []);`
  5. Add focus effect: when `focusDetection` changes, call `mapRef.current?.flyTo(...)` centered on `focusDetection.objectLatitude/objectLongitude` (fall back to drone coords), zoom 17, duration 1000
  6. Add `ref={mapRef}` to the `<Map>` component
  7. Add a `Popup` that renders when `focusDetection` is set, positioned at the object coordinates (or drone coordinates as fallback):
     ```tsx
     {focusDetection && (
       <Popup
         longitude={focusDetection.objectLongitude ?? focusDetection.droneLongitude!}
         latitude={focusDetection.objectLatitude ?? focusDetection.droneLatitude!}
         anchor="bottom"
         closeOnClick={false}
         onClose={() => onCloseFocus?.()}
         className="z-20"
       >
         <div className="p-2 max-w-[220px]">
           {focusDetection.imageUrl && (
             <img src={focusDetection.imageUrl} alt="" className="w-full h-auto rounded mb-2" />
           )}
           <p className="text-xs font-semibold capitalize">{focusDetection.type}</p>
           <p className="text-[10px] text-gray-500">{(focusDetection.confidence * 100).toFixed(1)}% · {focusDetection.streamId}</p>
         </div>
       </Popup>
     )}
     ```
  8. Add `onCloseFocus?: () => void` prop for when the popup is closed
- **Mirror**: DetectionMap.tsx (existing), geo-map.tsx (Popup + MapRef patterns)
- **Validate**: `npx tsc --noEmit`

### Task 4: Move Map into Center Column + Wire Up State

- **File**: `src/app/(dashboard)/ai-detection/page.tsx`
- **Action**: UPDATE
- **Implement**:
  1. Add new state: `const [mapFocusDetection, setMapFocusDetection] = useState<ThreatDetection | null>(null)`
  2. Add handler: `handleViewOnMap` that sets the focus detection AND enables the map:
     ```tsx
     const handleViewOnMap = useCallback((detection: ThreatDetection) => {
       setMapFocusDetection(detection);
       setShowMap(true);
     }, []);
     ```
  3. Remove the current map block (lines 303-313) from above the 3-column layout
  4. Insert the map inside the center column, above the VideoGrid:
     ```tsx
     {/* Center: Map + Video Grid */}
     <div className='flex flex-col flex-1 min-h-0 gap-3'>
       {showMap && (
         <MapErrorBoundary>
           <DetectionMap
             detections={filteredDetections}
             onSelectDetection={setSelectedDetection}
             focusDetection={mapFocusDetection}
             onCloseFocus={() => setMapFocusDetection(null)}
           />
         </MapErrorBoundary>
       )}
       <VideoGrid
         selectedStreamKeys={selectedStreamIds}
         streams={streams}
         devices={djiDevices}
         detections={videoDetections}
       />
     </div>
     ```
  5. Pass `onViewOnMap={handleViewOnMap}` to both `<DetectionPanel>` components
  6. When the user clicks the Map toggle button to turn the map OFF, also clear `mapFocusDetection`
- **Mirror**: page.tsx:303-313 (current map), page.tsx:340-375 (3-column layout)
- **Validate**: `npx tsc --noEmit`

---

## Final State

### page.tsx Center Column
```tsx
{/* Center: Map + Video Grid */}
<div className='flex flex-col flex-1 min-h-0 gap-3'>
  {showMap && (
    <MapErrorBoundary>
      <DetectionMap
        detections={filteredDetections}
        onSelectDetection={setSelectedDetection}
        focusDetection={mapFocusDetection}
        onCloseFocus={() => setMapFocusDetection(null)}
      />
    </MapErrorBoundary>
  )}
  <VideoGrid ... />
</div>
```

### DetectionItem Hover
```tsx
<div className='group relative ...'>
  {/* ...existing content... */}
  {onViewOnMap && d.droneLatitude != null && (
    <button
      onClick={(e) => { e.stopPropagation(); onViewOnMap(d); }}
      className='opacity-0 group-hover:opacity-100 transition-opacity ...'
      title='View on Map'
    >
      <MapPin className='w-3 h-3 text-[#1C93FF]' />
    </button>
  )}
</div>
```

---

## Validation

```bash
# Type check
npx tsc --noEmit

# Lint (ThreatMap)
npx next lint --file src/components/features/ai-detection/DetectionMap.tsx
npx next lint --file src/components/features/ai-detection/DetectionItem.tsx
npx next lint --file src/components/features/ai-detection/DetectionPanel.tsx
```

---

## Acceptance Criteria

- [ ] Map renders inside the center column (above VideoGrid), not above the 3-column layout
- [ ] YOLO and LLM panels remain visible when map is open
- [ ] DetectionItem shows a blue MapPin icon on hover (only when GPS data exists)
- [ ] Clicking "View on Map" opens the map and zooms to the detection's coordinates
- [ ] A popup appears on the map showing the detection image, type, confidence, and stream
- [ ] Closing the popup clears the focus state
- [ ] Toggling the map OFF clears the focus state
- [ ] `stopPropagation` prevents the item click from opening the detail modal
- [ ] Type check passes
- [ ] Lint passes
