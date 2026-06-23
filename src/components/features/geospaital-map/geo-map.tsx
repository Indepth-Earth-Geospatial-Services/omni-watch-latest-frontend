'use client';
import { MapPin } from 'lucide-react';
import { toast } from 'sonner';
import { useTelemetry } from '@/hooks/useTelemetry';
import { useDJIDevices, useBoundDevices } from '@/hooks/useDJIDevices';
import {
  useFlightAreas,
  useSyncFlightAreas,
  useElementGroups,
  useAddElement,
  useDeleteElement,
} from '@/hooks/useMapElements';
import { useAuth } from '@/providers/AuthProvider';
import { DJI_CONFIG } from '@/lib/config/config';
import { feedData } from '@/lib/data';
import type { UnifiedStream } from '@/lib/types';
import 'maplibre-gl/dist/maplibre-gl.css';
import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from 'react';
import Map, { Marker, NavigationControl, Source, Layer, MapRef } from 'react-map-gl/maplibre';
import type { MapLayerMouseEvent } from 'maplibre-gl';
import type { DronePositionType, SelectedDroneInfo, MapViewMode, PendingPoint } from './map-types';
import { DroneMarker } from './DroneMarker';
import { DroneInfoPopup } from './DroneInfoPopup';
import { TelemetryPanel } from './TelemetryPanel';
import { MapCompass } from './MapCompass';
import { AltitudeIndicator } from './AltitudeIndicator';
import { AddElementPanel } from './AddElementPanel';
import { ElementContextMenu } from './ElementContextMenu';
import { WaylinePanel } from './WaylinePanel';
import { useWaylines, useWaylineRoute } from '@/hooks/useWaylines';

const MAP_STYLES: Record<string, string | object> = {
  dark: 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json',
  positron: 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json',
  satellite: {
    version: 8,
    sources: {
      esri: {
        type: 'raster',
        tiles: [
          'https://services.arcgisonline.com/arcgis/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
        ],
        tileSize: 256,
      },
    },
    layers: [{ id: 'esri', type: 'raster', source: 'esri' }],
  },
};

function GeoMap() {
  const mapRef = useRef<MapRef>(null);
  const prevTelemetryRef = useRef<Record<string, string>>({});
  const hasAutoFocusedRef = useRef(false);
  const [, startMapTransition] = useTransition();

  // Cancel any in-flight map animation so MapLibre tears down its window-level
  // pointer listeners cleanly before the component unmounts (prevents navigation lock).
  useEffect(
    () => () => {
      mapRef.current?.stop();
    },
    []
  );

  // ── UI state ─────────────────────────────────────────────────────────────────
  const [viewMode, setViewMode] = useState<MapViewMode>('multi');
  const [selectedDrone, setSelectedDrone] = useState<DronePositionType | null>(null);
  // Tracks which drone is highlighted in the TelemetryPanel — independent of the map popup.
  const [panelSelectedSn, setPanelSelectedSn] = useState<string | null>(null);
  const [dronePositions, setDronePositions] = useState<Record<string, DronePositionType>>({});
  const [selectedStyle, setSelectedStyle] = useState('dark');
  const [showElements, setShowElements] = useState(true);
  const [viewState, setViewState] = useState({ longitude: 7.0336, latitude: 4.8242, zoom: 14 });

  // ── Draw / Add-element state ──────────────────────────────────────────────────
  const [isDrawMode, setIsDrawMode] = useState(false);
  const [pendingPoint, setPendingPoint] = useState<PendingPoint | null>(null);
  const [drawGroupId, setDrawGroupId] = useState('');
  const [drawElementName, setDrawElementName] = useState('');

  // ── Element context-menu state (right-click / double-tap to delete) ───────────
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    elementId: string;
    elementName: string;
  } | null>(null);

  // ── Active wayline route overlay ──────────────────────────────────────────────
  const [activeWaylineId, setActiveWaylineId] = useState<string | null>(null);

  // ── Data hooks ────────────────────────────────────────────────────────────────
  const { user } = useAuth();
  const { data: djiDevices = [] } = useDJIDevices();
  const { data: boundDevices = [] } = useBoundDevices();
  const { data: flightAreas = [] } = useFlightAreas();
  const { data: elementGroups = [] } = useElementGroups();
  const { mutate: syncGeofences, isPending: isSyncing } = useSyncFlightAreas();
  const { mutate: addMapElement, isPending: isAddingElement } = useAddElement();
  const { mutate: deleteMapElement, isPending: isDeletingElement } = useDeleteElement();
  const { droneUpdates, getProcessedDroneData } = useTelemetry();
  const { data: waylines = [], isLoading: isLoadingWaylines } = useWaylines();
  const { data: activeRoute, isFetching: isLoadingRoute } = useWaylineRoute(activeWaylineId);

  // ── Nickname lookup list ──────────────────────────────────────────────────────
  const deviceList: UnifiedStream[] = useMemo(() => {
    if (DJI_CONFIG.USE_DJI_CLOUD) {
      return djiDevices.map((device) => ({
        id: device.deviceSn,
        name: device.deviceName,
        type: 'DRONE',
        isOnline: device.status,
        raw: device,
        metadata: { alias: device.nickname },
      }));
    }
    return feedData.map((drone) => ({
      id: String(drone.sn),
      name: drone.name,
      type: drone.feedType,
      isOnline: drone.status === 'online',
      raw: {} as object,
      metadata: { alias: drone.name },
    }));
  }, [djiDevices]);

  // SNs of domain-0 devices (aircraft only) — excludes RC/dock from fleet + WS processing.
  const droneSnSet = useMemo(
    () => new Set(djiDevices.filter((d) => d.domain === '0').map((d) => d.deviceSn)),
    [djiDevices]
  );

  // ── Seed fleet from REST API — shows devices in panel before WS events arrive ──
  useEffect(() => {
    if (!djiDevices.length) return;
    setDronePositions((prev) => {
      const next = { ...prev };
      let changed = false;
      djiDevices
        .filter((d) => d.status && d.domain === '0') // aircraft only — exclude RC / dock
        .forEach((d) => {
          if (!next[d.deviceSn]) {
            next[d.deviceSn] = {
              sn: d.deviceSn,
              nickname: d.nickname || d.deviceName,
              longitude: 0,
              latitude: 0,
              heading: 0,
              altitude: null,
              hasGPS: false,
            };
            changed = true;
          }
        });
      return changed ? next : prev;
    });
  }, [djiDevices]);

  // ── Sync drone positions from WebSocket telemetry ─────────────────────────────
  useEffect(() => {
    if (!droneUpdates.size) return;

    // Detect changes first (avoids state update when nothing moved)
    const changedSns: string[] = [];
    droneUpdates.forEach((_update, sn) => {
      const t = getProcessedDroneData(sn);
      if (!t) return;
      const key = `${t.latitude},${t.longitude},${t.heading},${t.altitude}`;
      if (key !== prevTelemetryRef.current[sn]) {
        prevTelemetryRef.current[sn] = key;
        changedSns.push(sn);
      }
    });
    if (!changedSns.length) return;

    setDronePositions((prev) => {
      const next = { ...prev }; // preserve REST-seeded entries
      droneUpdates.forEach((_update, sn) => {
        if (!droneSnSet.has(sn)) return; // skip RC / dock OSD — aircraft only
        const t = getProcessedDroneData(sn);
        if (!t) return;
        // useTelemetry returns sticky last-valid coords — trust lat/lng directly.
        const hasGPS = t.latitude !== 0 || t.longitude !== 0 || (prev[sn]?.hasGPS ?? false);
        const nickname =
          deviceList.find((d) => d.id === sn)?.metadata?.alias ?? prev[sn]?.nickname ?? sn;
        next[sn] = {
          sn,
          nickname,
          longitude: t.longitude,
          latitude: t.latitude,
          heading: t.heading,
          altitude: t.altitude,
          hasGPS,
        };
      });
      return next;
    });
  }, [droneUpdates, getProcessedDroneData, deviceList, droneSnSet]);

  // ── Single-mode: auto-follow tracked drone ────────────────────────────────────
  const trackedLat = panelSelectedSn ? dronePositions[panelSelectedSn]?.latitude : undefined;
  const trackedLng = panelSelectedSn ? dronePositions[panelSelectedSn]?.longitude : undefined;

  useEffect(() => {
    if (viewMode !== 'single' || trackedLat === undefined || trackedLng === undefined) return;
    mapRef.current?.easeTo({ center: [trackedLng, trackedLat], duration: 800 });
  }, [viewMode, trackedLat, trackedLng]);

  // ── Selected drone full telemetry ─────────────────────────────────────────────
  const panelDrone = panelSelectedSn ? dronePositions[panelSelectedSn] : null;
  const selectedDroneInfo: SelectedDroneInfo | null = useMemo(() => {
    if (!panelDrone) return null;
    const t = getProcessedDroneData(panelDrone.sn);
    const nickname =
      deviceList.find((d) => d.id === panelDrone.sn)?.metadata?.alias ?? panelDrone.sn;
    return {
      nickname,
      serialNumber: panelDrone.sn,
      latitude: panelDrone.latitude.toFixed(6),
      longitude: panelDrone.longitude.toFixed(6),
      battery: t?.battery ?? 0,
      altitude: t?.altitude ?? null,
      direction: t?.direction ?? 'N',
      heading: t?.heading ?? 0,
      speed: t?.speed ?? 0,
      modeCode: t?.modeCode ?? 0,
    };
  }, [panelDrone, getProcessedDroneData, deviceList]);

  // ── GeoJSON FeatureCollection from element groups ─────────────────────────────
  const mapElementsGeoJSON = useMemo(
    () => ({
      type: 'FeatureCollection' as const,
      features: elementGroups.flatMap((group) =>
        group.elements
          .filter((el) => el.resource?.content)
          .map((el) => ({
            ...el.resource.content,
            id: el.id,
            properties: {
              ...el.resource.content.properties,
              name: el.name,
              groupId: group.id,
              groupName: group.name,
              elementId: el.id,
            },
          }))
      ),
    }),
    [elementGroups]
  );

  const dronePositionsArray = useMemo(() => Object.values(dronePositions), [dronePositions]);

  // ── Wayline route GeoJSON — rebuilt only when the active route changes ─────────
  const waylineGeoJSON = useMemo(() => {
    if (!activeRoute || activeRoute.length < 2) return null;
    return {
      type: 'FeatureCollection' as const,
      features: [
        {
          type: 'Feature' as const,
          geometry: {
            type: 'LineString' as const,
            coordinates: activeRoute.map((p) => [p.lng, p.lat]),
          },
          properties: { kind: 'route' },
        },
        ...activeRoute.map((p) => ({
          type: 'Feature' as const,
          geometry: { type: 'Point' as const, coordinates: [p.lng, p.lat] },
          properties: { kind: 'waypoint', index: p.index, alt: p.alt },
        })),
      ],
    };
  }, [activeRoute]);

  // ── One-shot auto-fly: snap to the drone the moment its first GPS fix arrives ──
  // Only triggers when there is exactly ONE drone in the project.
  // The ref prevents re-firing after the initial fly-to, keeping the user free to pan.
  useEffect(() => {
    if (hasAutoFocusedRef.current) return;
    if (dronePositionsArray.length !== 1) return;
    const [drone] = dronePositionsArray;
    if (!drone.hasGPS) return;
    mapRef.current?.flyTo({
      center: [drone.longitude, drone.latitude],
      zoom: 17,
      duration: 2000,
      essential: true,
    });
    hasAutoFocusedRef.current = true;
  }, [dronePositionsArray]);

  const elementCount = useMemo(
    () => elementGroups.reduce((acc, g) => acc + g.elements.length, 0),
    [elementGroups]
  );

  // ── Map interaction handlers ──────────────────────────────────────────────────
  const fitToAllDrones = useCallback(() => {
    const positions = Object.values(dronePositions).filter((d) => d.hasGPS);
    if (!positions.length) return;
    const lngs = positions.map((d) => d.longitude);
    const lats = positions.map((d) => d.latitude);
    setViewState((prev) => ({
      ...prev,
      longitude: (Math.min(...lngs) + Math.max(...lngs)) / 2,
      latitude: (Math.min(...lats) + Math.max(...lats)) / 2,
      zoom: positions.length === 1 ? 16 : 14,
    }));
  }, [dronePositions]);

  const fitToRoute = useCallback(() => {
    if (!activeRoute || activeRoute.length === 0) return;
    const lngs = activeRoute.map((p) => p.lng);
    const lats = activeRoute.map((p) => p.lat);
    const minLng = Math.min(...lngs),
      maxLng = Math.max(...lngs);
    const minLat = Math.min(...lats),
      maxLat = Math.max(...lats);
    mapRef.current?.fitBounds(
      [
        [minLng, minLat],
        [maxLng, maxLat],
      ],
      { padding: 80, duration: 1200, maxZoom: 18 }
    );
  }, [activeRoute]);

  // Auto-fit map to show the full route whenever a new route loads
  useEffect(() => {
    if (!activeRoute || activeRoute.length === 0) return;
    const lngs = activeRoute.map((p) => p.lng);
    const lats = activeRoute.map((p) => p.lat);
    mapRef.current?.fitBounds(
      [
        [Math.min(...lngs), Math.min(...lats)],
        [Math.max(...lngs), Math.max(...lats)],
      ],
      { padding: 80, duration: 1200, maxZoom: 18 }
    );
  }, [activeRoute]);

  const flyToDrone = useCallback((drone: DronePositionType) => {
    mapRef.current?.flyTo({
      center: [drone.longitude, drone.latitude],
      zoom: 18,
      duration: 2000,
      essential: true,
    });
    setSelectedDrone(drone); // opens the map popup
    setPanelSelectedSn(drone.sn); // highlights the panel button
  }, []);

  const handleMapClick = useCallback(
    (e: MapLayerMouseEvent) => {
      if (!isDrawMode) return;
      setPendingPoint({ lng: e.lngLat.lng, lat: e.lngLat.lat });
    },
    [isDrawMode]
  );

  // ── Draw mode helpers ─────────────────────────────────────────────────────────
  const toggleDrawMode = useCallback(() => {
    setIsDrawMode((prev) => {
      if (prev) {
        // Leaving draw mode — clear state
        setPendingPoint(null);
        setDrawGroupId('');
        setDrawElementName('');
      }
      return !prev;
    });
  }, []);

  const handleSaveElement = useCallback(() => {
    if (!pendingPoint || !drawGroupId || !drawElementName.trim()) return;

    addMapElement(
      {
        groupId: drawGroupId,
        payload: {
          id: crypto.randomUUID(),
          name: drawElementName.trim(),
          resource: {
            type: 0,
            content: {
              type: 'Feature',
              properties: { color: '#2D8CF0', clampToGround: true },
              geometry: {
                type: 'Point',
                coordinates: [pendingPoint.lng, pendingPoint.lat],
                radius: 0,
              },
            },
            user_name: user?.username ?? 'user',
          },
        },
      },
      {
        onSuccess: () => {
          setIsDrawMode(false);
          setPendingPoint(null);
          setDrawGroupId('');
          setDrawElementName('');
        },
      }
    );
  }, [pendingPoint, drawGroupId, drawElementName, addMapElement, user]);

  // ── Element context-menu handlers ────────────────────────────────────────────
  const openContextMenu = useCallback(
    (point: { x: number; y: number }) => {
      if (!showElements || isDrawMode) return;
      const features = mapRef.current?.queryRenderedFeatures([point.x, point.y], {
        layers: ['map-elements-points'],
      });
      if (!features?.length) return;
      const f = features[0];
      const elementId = String(f.properties?.elementId ?? '');
      const elementName = String(f.properties?.name ?? 'Element');
      if (!elementId) return;
      setContextMenu({ x: point.x, y: point.y, elementId, elementName });
    },
    [showElements, isDrawMode]
  );

  const handleContextMenu = useCallback(
    (e: MapLayerMouseEvent) => {
      e.originalEvent.preventDefault();
      openContextMenu(e.point);
    },
    [openContextMenu]
  );

  const handleDblClick = useCallback(
    (e: MapLayerMouseEvent) => {
      const features = mapRef.current?.queryRenderedFeatures([e.point.x, e.point.y], {
        layers: ['map-elements-points'],
      });
      if (!features?.length) return;
      // Prevent map zoom-in only when tapping an element
      e.originalEvent.preventDefault();
      openContextMenu(e.point);
    },
    [openContextMenu]
  );

  const handleDeleteElement = useCallback(() => {
    if (!contextMenu) return;
    deleteMapElement(contextMenu.elementId, {
      onSuccess: () => setContextMenu(null),
      onError: () => toast.error('Failed to delete element — please try again'),
    });
  }, [contextMenu, deleteMapElement]);

  // ── Render ────────────────────────────────────────────────────────────────────
  return (
    <section className='h-[67dvh] relative w-full'>
      <Map
        ref={mapRef}
        {...viewState}
        onMove={(evt) => startMapTransition(() => setViewState(evt.viewState))}
        mapStyle={MAP_STYLES[selectedStyle] as string}
        style={{ width: '100%', height: '100%' }}
        cursor={isDrawMode ? 'crosshair' : 'grab'}
        onClick={handleMapClick}
        onContextMenu={handleContextMenu}
        onDblClick={handleDblClick}
      >
        <NavigationControl position='top-left' />

        {/* Drone markers — only shown once a valid GPS fix is received */}
        {dronePositionsArray
          .filter((drone) => drone.hasGPS)
          .map((drone) => (
            <DroneMarker
              key={drone.sn}
              drone={drone}
              isSelected={panelSelectedSn === drone.sn}
              showAltitude={viewMode === 'multi'}
              onClick={flyToDrone}
            />
          ))}

        {/* Pending point preview when in draw mode */}
        {isDrawMode && pendingPoint && (
          <Marker longitude={pendingPoint.lng} latitude={pendingPoint.lat} anchor='bottom'>
            <div className='flex flex-col items-center'>
              <div className='w-3 h-3 rounded-full bg-blue-400 border-2 border-white shadow-lg animate-bounce' />
            </div>
          </Marker>
        )}

        {/* GeoJSON element groups (points, lines, polygons) */}
        {showElements && (
          <Source id='map-elements' type='geojson' data={mapElementsGeoJSON as never}>
            <Layer
              id='map-elements-polygons'
              type='fill'
              filter={['==', '$type', 'Polygon']}
              paint={{ 'fill-color': ['get', 'color'], 'fill-opacity': 0.3 }}
            />
            <Layer
              id='map-elements-polygons-outline'
              type='line'
              filter={['==', '$type', 'Polygon']}
              paint={{ 'line-color': ['get', 'color'], 'line-width': 2 }}
            />
            <Layer
              id='map-elements-lines'
              type='line'
              filter={['==', '$type', 'LineString']}
              paint={{ 'line-color': ['get', 'color'], 'line-width': 3 }}
            />
            {/* Points are rendered as interactive React Markers below — no circle layer needed */}
          </Source>
        )}

        {/* Flight-area geofence markers */}
        {DJI_CONFIG.USE_DJI_CLOUD &&
          flightAreas.map((area) => {
            const content = area.content as Record<string, unknown> | null;
            const lng =
              (content?.longitude as number | undefined) ??
              (content?.center as Record<string, number> | undefined)?.longitude;
            const lat =
              (content?.latitude as number | undefined) ??
              (content?.center as Record<string, number> | undefined)?.latitude;
            if (lng === undefined || lat === undefined) return null;
            return (
              <Marker key={area.id} longitude={lng} latitude={lat} anchor='center'>
                <div
                  title={area.name}
                  className={`flex items-center justify-center w-8 h-8 rounded-full border-2 text-xs font-bold cursor-default ${
                    area.status === 1
                      ? 'border-red-500 bg-red-500/20 text-red-400'
                      : 'border-gray-500 bg-gray-500/20 text-gray-400'
                  }`}
                >
                  ⛔
                </div>
              </Marker>
            );
          })}

        {/* Map element pins — point elements as interactive red location pins */}
        {showElements &&
          elementGroups.flatMap((group) =>
            group.elements
              .filter((el) => el.resource?.content?.geometry?.type === 'Point')
              .map((el) => {
                const [eLng, eLat] = el.resource.content.geometry.coordinates as [number, number];
                return (
                  <Marker
                    key={el.id}
                    longitude={eLng}
                    latitude={eLat}
                    anchor='bottom'
                    onClick={(e) => {
                      e.originalEvent.stopPropagation();
                      mapRef.current?.flyTo({
                        center: [eLng, eLat],
                        zoom: 18,
                        duration: 1200,
                        essential: true,
                      });
                    }}
                  >
                    <div
                      className='group relative flex flex-col items-center cursor-pointer select-none'
                      onContextMenu={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        e.nativeEvent.stopPropagation();
                        if (!showElements || isDrawMode) return;
                        const mapRect = mapRef.current?.getContainer().getBoundingClientRect();
                        if (!mapRect) return;
                        setContextMenu({
                          x: e.clientX - mapRect.left,
                          y: e.clientY - mapRect.top,
                          elementId: el.id,
                          elementName: el.name,
                        });
                      }}
                    >
                      {/* Hover tooltip */}
                      <div className='absolute bottom-full left-1/2 -translate-x-1/2 mb-1 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10'>
                        <div className='bg-neutral-900/95 backdrop-blur-sm border border-gray-700/60 px-2.5 py-1.5 rounded-lg shadow-xl whitespace-nowrap'>
                          <p className='text-[11px] font-semibold text-gray-100 leading-none'>
                            {el.name}
                          </p>
                          <p className='text-[9px] text-gray-500 mt-0.5'>{group.name}</p>
                          <p className='text-[9px] text-gray-600 font-mono mt-0.5'>
                            {eLat.toFixed(5)}, {eLng.toFixed(5)}
                          </p>
                        </div>
                        <div className='w-0 h-0 border-l-[4px] border-l-transparent border-r-[4px] border-r-transparent border-t-[4px] border-t-neutral-900/95 mx-auto' />
                      </div>
                      {/* Pin icon */}
                      <MapPin
                        className='w-8 h-8 text-red-500 drop-shadow-[0_2px_6px_rgba(0,0,0,0.5)] transition-all duration-150 group-hover:scale-110 group-hover:-translate-y-0.5'
                        strokeWidth={1.5}
                        fill='rgba(239,68,68,0.15)'
                      />
                    </div>
                  </Marker>
                );
              })
          )}

        {/* Wayline route overlay */}
        {waylineGeoJSON && (
          <Source id='wayline-route' type='geojson' data={waylineGeoJSON as never}>
            {/* Dark casing behind the line for contrast on satellite view */}
            <Layer
              id='wayline-casing'
              type='line'
              filter={['==', ['get', 'kind'], 'route']}
              layout={{ 'line-cap': 'round', 'line-join': 'round' }}
              paint={{ 'line-color': '#05253d', 'line-width': 8 }}
            />
            {/* Main dashed route line */}
            <Layer
              id='wayline-line'
              type='line'
              filter={['==', ['get', 'kind'], 'route']}
              layout={{ 'line-cap': 'round', 'line-join': 'round' }}
              paint={{ 'line-color': '#1C93FF', 'line-width': 3, 'line-dasharray': [5, 3] }}
            />
            {/* Waypoint pin — outer shadow halo */}
            <Layer
              id='wayline-waypoint-halo'
              type='circle'
              filter={[
                'all',
                ['==', ['get', 'kind'], 'waypoint'],
                ['!=', ['get', 'index'], 0],
                ['!=', ['get', 'index'], -1],
              ]}
              paint={{
                'circle-radius': 13,
                'circle-color': 'rgba(28, 147, 255, 0.18)',
                'circle-stroke-width': 0,
              }}
            />
            {/* Waypoint pin — filled circle */}
            <Layer
              id='wayline-waypoints'
              type='circle'
              filter={['==', ['get', 'kind'], 'waypoint']}
              paint={{
                'circle-radius': 9,
                'circle-color': '#1C93FF',
                'circle-stroke-color': '#ffffff',
                'circle-stroke-width': 2,
              }}
            />
            {/* Waypoint number label (1-based) */}
            <Layer
              id='wayline-waypoint-labels'
              type='symbol'
              filter={['==', ['get', 'kind'], 'waypoint']}
              layout={{
                'text-field': ['to-string', ['+', ['get', 'index'], 1]],
                'text-size': 9,
                'text-font': ['Open Sans Bold', 'Arial Unicode MS Bold'],
                'text-anchor': 'center',
                'text-allow-overlap': true,
                'text-ignore-placement': true,
              }}
              paint={{ 'text-color': '#ffffff' }}
            />
          </Source>
        )}

        {/* Start (S) and End (E) markers for the active wayline */}
        {activeRoute && activeRoute.length > 0 && (
          <>
            <Marker longitude={activeRoute[0].lng} latitude={activeRoute[0].lat} anchor='bottom'>
              <div className='flex flex-col items-center'>
                <div className='bg-emerald-500 text-white text-[10px] font-black px-2 py-0.5 rounded-t-lg rounded-b-sm shadow-lg select-none border border-emerald-400 whitespace-nowrap'>
                  START
                </div>
                <div className='w-0 h-0 border-l-[5px] border-l-transparent border-r-[5px] border-r-transparent border-t-[6px] border-t-emerald-500' />
              </div>
            </Marker>
            {activeRoute.length > 1 && (
              <Marker
                longitude={activeRoute[activeRoute.length - 1].lng}
                latitude={activeRoute[activeRoute.length - 1].lat}
                anchor='bottom'
              >
                <div className='flex flex-col items-center'>
                  <div className='bg-red-500 text-white text-[10px] font-black px-2 py-0.5 rounded-t-lg rounded-b-sm shadow-lg select-none border border-red-400 whitespace-nowrap'>
                    END
                  </div>
                  <div className='w-0 h-0 border-l-[5px] border-l-transparent border-r-[5px] border-r-transparent border-t-[6px] border-t-red-500' />
                </div>
              </Marker>
            )}
          </>
        )}

        {/* Selected drone popup */}
        {selectedDrone && selectedDroneInfo && (
          <DroneInfoPopup
            drone={selectedDrone}
            info={selectedDroneInfo}
            onClose={() => setSelectedDrone(null)}
          />
        )}
      </Map>

      {/* Add-element panel — floats at top-center when draw mode is active */}
      {isDrawMode && (
        <AddElementPanel
          elementGroups={elementGroups}
          selectedGroupId={drawGroupId}
          elementName={drawElementName}
          hasClickTarget={pendingPoint !== null}
          isPending={isAddingElement}
          onGroupChange={setDrawGroupId}
          onNameChange={setDrawElementName}
          onSave={handleSaveElement}
          onCancel={toggleDrawMode}
        />
      )}

      {/* Wayline route panel — floats top-left below the map navigation control */}
      <WaylinePanel
        waylines={waylines}
        isLoading={isLoadingWaylines}
        activeWaylineId={activeWaylineId}
        activeRoute={activeRoute}
        isLoadingRoute={isLoadingRoute}
        onSelect={setActiveWaylineId}
        onFitRoute={fitToRoute}
      />

      {/* Bottom-left overlays: altitude gauge + compass (shown when a drone is selected) */}
      {selectedDroneInfo && (
        <div className='absolute bottom-16 left-4 z-10 flex items-end gap-3'>
          <AltitudeIndicator altitude={selectedDroneInfo.altitude} />
          <MapCompass heading={selectedDroneInfo.heading} />
        </div>
      )}

      {/* Element context menu — right-click or double-tap a point to delete */}
      {contextMenu && showElements && (
        <ElementContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          elementName={contextMenu.elementName}
          isPending={isDeletingElement}
          onDelete={handleDeleteElement}
          onClose={() => setContextMenu(null)}
        />
      )}

      {/* Right-side telemetry + controls panel */}
      <TelemetryPanel
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        isDrawMode={isDrawMode}
        onToggleDrawMode={toggleDrawMode}
        selectedStyle={selectedStyle}
        onStyleChange={setSelectedStyle}
        showElements={showElements}
        onShowElementsChange={setShowElements}
        elementCount={elementCount}
        selectedDroneInfo={selectedDroneInfo}
        dronePositionsArray={dronePositionsArray}
        getProcessedDroneData={getProcessedDroneData}
        onFitToAllDrones={fitToAllDrones}
        onFlyToDrone={flyToDrone}
        selectedSn={panelSelectedSn}
        flightAreas={flightAreas}
        isSyncing={isSyncing}
        onSyncGeofences={syncGeofences}
        boundDevices={boundDevices}
      />

      {/* Global animation + popup styles */}
      <style jsx global>{`
        @keyframes markerPulse {
          0% {
            transform: scale(0.95);
            box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.7);
          }
          70% {
            transform: scale(1);
            box-shadow: 0 0 0 10px rgba(239, 68, 68, 0);
          }
          100% {
            transform: scale(0.95);
            box-shadow: 0 0 0 0 rgba(239, 68, 68, 0);
          }
        }

        .drone-popup .maplibregl-popup-content {
          background-color: transparent !important;
          padding: 0 !important;
          box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.5) !important;
        }
        .drone-popup .maplibregl-popup-close-button {
          color: #fff !important;
          font-size: 20px !important;
          margin: 4px 8px !important;
          padding: 4px 8px !important;
          right: 4px !important;
          top: 4px !important;
        }
        .drone-popup .maplibregl-popup-close-button:hover {
          background-color: rgba(255, 255, 255, 0.1) !important;
          border-radius: 4px !important;
        }
        .drone-popup .maplibregl-popup-tip {
          border-top-color: #0f172a !important;
        }
      `}</style>
    </section>
  );
}

export default GeoMap;
