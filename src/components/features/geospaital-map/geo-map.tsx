'use client';
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
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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

  // ── UI state ─────────────────────────────────────────────────────────────────
  const [viewMode, setViewMode] = useState<MapViewMode>('multi');
  const [selectedDrone, setSelectedDrone] = useState<DronePositionType | null>(null);
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
    x: number; y: number; elementId: string; elementName: string;
  } | null>(null);

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

  // ── Seed fleet from REST API — shows devices in panel before WS events arrive ──
  useEffect(() => {
    if (!djiDevices.length) return;
    setDronePositions((prev) => {
      const next = { ...prev };
      let changed = false;
      djiDevices
        .filter((d) => d.status)
        .forEach((d) => {
          if (!next[d.deviceSn]) {
            next[d.deviceSn] = {
              sn: d.deviceSn,
              nickname: d.nickname || d.deviceName,
              longitude: 0,
              latitude: 0,
              heading: 0,
              altitude: 0,
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
        const t = getProcessedDroneData(sn);
        if (!t) return;
        const hasValidGPS = t.latitude !== 0 || t.longitude !== 0;
        const nickname =
          deviceList.find((d) => d.id === sn)?.metadata?.alias ?? (prev[sn]?.nickname ?? sn);
        next[sn] = {
          sn,
          nickname,
          longitude: hasValidGPS ? t.longitude : (prev[sn]?.longitude ?? 0),
          latitude: hasValidGPS ? t.latitude : (prev[sn]?.latitude ?? 0),
          heading: t.heading,
          altitude: t.altitude,
          hasGPS: hasValidGPS || (prev[sn]?.hasGPS ?? false),
        };
      });
      return next;
    });
  }, [droneUpdates, getProcessedDroneData, deviceList]);

  // ── Single-mode: auto-follow tracked drone ────────────────────────────────────
  const trackedLat = selectedDrone ? dronePositions[selectedDrone.sn]?.latitude : undefined;
  const trackedLng = selectedDrone ? dronePositions[selectedDrone.sn]?.longitude : undefined;

  useEffect(() => {
    if (viewMode !== 'single' || trackedLat === undefined || trackedLng === undefined) return;
    mapRef.current?.easeTo({ center: [trackedLng, trackedLat], duration: 800 });
  }, [viewMode, trackedLat, trackedLng]);

  // ── Selected drone full telemetry ─────────────────────────────────────────────
  const selectedDroneInfo: SelectedDroneInfo | null = useMemo(() => {
    if (!selectedDrone) return null;
    const t = getProcessedDroneData(selectedDrone.sn);
    const nickname =
      deviceList.find((d) => d.id === selectedDrone.sn)?.metadata?.alias ?? selectedDrone.sn;
    return {
      nickname,
      serialNumber: selectedDrone.sn,
      latitude: selectedDrone.latitude.toFixed(6),
      longitude: selectedDrone.longitude.toFixed(6),
      battery: t?.battery ?? 0,
      altitude: t?.altitude ?? 0,
      direction: t?.direction ?? 'N',
      heading: t?.heading ?? 0,
      speed: t?.speed ?? 0,
      modeCode: t?.modeCode ?? 0,
    };
  }, [selectedDrone, getProcessedDroneData, deviceList]);

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

  const flyToDrone = useCallback((drone: DronePositionType) => {
    mapRef.current?.flyTo({
      center: [drone.longitude, drone.latitude],
      zoom: 18,
      duration: 2000,
      essential: true,
    });
    setSelectedDrone(drone);
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
      const features = mapRef.current?.queryRenderedFeatures(
        [point.x, point.y],
        { layers: ['map-elements-points'] }
      );
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
      const features = mapRef.current?.queryRenderedFeatures(
        [e.point.x, e.point.y],
        { layers: ['map-elements-points'] }
      );
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
        onMove={(evt) => setViewState(evt.viewState)}
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
              isSelected={selectedDrone?.sn === drone.sn}
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
            <Layer
              id='map-elements-points'
              type='circle'
              filter={['==', '$type', 'Point']}
              paint={{
                'circle-radius': 6,
                'circle-color': ['get', 'color'],
                'circle-stroke-width': 2,
                'circle-stroke-color': '#ffffff',
              }}
            />
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

      {/* Bottom-left overlays: altitude gauge + compass (shown when a drone is selected) */}
      {selectedDroneInfo && (
        <div className='absolute bottom-8 left-4 z-10 flex items-end gap-3'>
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
        selectedSn={selectedDrone?.sn ?? null}
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
