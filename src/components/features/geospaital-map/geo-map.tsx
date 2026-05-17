'use client';
import { useTelemetry } from '@/hooks/useTelemetry';
import { useDJIDevices, useBoundDevices } from '@/hooks/useDJIDevices';
import { useFlightAreas, useSyncFlightAreas, useElementGroups } from '@/hooks/useMapElements';
import { DJI_CONFIG } from '@/lib/dji/config';
import { LayoutTemplate } from 'lucide-react';
import 'maplibre-gl/dist/maplibre-gl.css';
import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Map, {
  Marker,
  NavigationControl,
  Popup,
  MapRef,
  Source,
  Layer,
} from 'react-map-gl/maplibre';
import { feedData } from '@/lib/data';
import { UnifiedStream } from '@/lib/types';

type DronePositionType = {
  longitude: number;
  latitude: number;
  sn: string;
  nickname: string;
  incidents?: any[];
};

// Custom pulse marker component moved outside - prevents recreation on every render
const PulseMarker = memo(
  ({
    drone,
    onClick,
  }: {
    drone: DronePositionType;
    onClick: (drone: DronePositionType) => void;
  }) => {
    const handleClick = (e: any) => {
      e.originalEvent?.stopPropagation();
      onClick(drone);
    };

    return (
      <Marker
        longitude={drone.longitude}
        latitude={drone.latitude}
        anchor='center'
        onClick={handleClick}
      >
        <div className='cursor-pointer size-[20px] bg-red-500 rounded-full relative shadow-[0_0_0_rgba(239,68,68,1)] animate-[markerPulse_2s_ease_infinite]' />
      </Marker>
    );
  },
  // Custom comparison - only re-render if position actually changes
  (prevProps, nextProps) => {
    return (
      prevProps.drone.sn === nextProps.drone.sn &&
      prevProps.drone.longitude === nextProps.drone.longitude &&
      prevProps.drone.latitude === nextProps.drone.latitude
    );
  }
);

PulseMarker.displayName = 'PulseMarker';

function GeoMap() {
  const mapRef = useRef<MapRef>(null);

  const [selectedDrone, setSelectedDrone] = useState<DronePositionType | null>(null);

  // DJI Cloud hooks — always called (Rules of Hooks); feature flag selects which result is used
  const { data: djiDevices = [] } = useDJIDevices();
  const { data: boundDevices = [] } = useBoundDevices();
  const { data: flightAreas = [] } = useFlightAreas();
  const { data: elementGroups = [] } = useElementGroups();
  const { mutate: syncGeofences, isPending: isSyncing } = useSyncFlightAreas();

  const [showElements, setShowElements] = useState(true);

  // Use static data if DJI Cloud is disabled, mapping it to UnifiedStream structure
  const deviceList: UnifiedStream[] = useMemo(() => {
    if (DJI_CONFIG.USE_DJI_CLOUD) {
      return djiDevices.map((device) => ({
        id: device.deviceSn,
        name: device.deviceName,
        type: 'DRONE', // DJI devices are primarily drones in this context
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
      raw: {} as any, // Mock raw data
      metadata: { alias: drone.name },
    }));
  }, [djiDevices]);

  const [selectedStyle, setSelectedStyle] = useState('dark');
  const [viewState, setViewState] = useState({
    longitude: 7.0336,
    latitude: 4.8242,
    zoom: 14,
  });

  const { droneUpdates, getProcessedDroneData } = useTelemetry();

  // Store drone positions directly from telemetry updates
  const [dronePositions, setDronePositions] = useState<Record<string, DronePositionType>>({});

  // Track previous telemetry to avoid unnecessary updates
  const prevTelemetryRef = useRef<Record<string, string>>({});

  // Update drone positions from telemetry - simplified to use droneUpdates directly
  useEffect(() => {
    const updatedPositions: Record<string, DronePositionType> = {};
    let hasChanges = false;

    // Iterate through all drones that have sent telemetry
    droneUpdates.forEach((_update, sn) => {
      const telemetry = getProcessedDroneData(sn);

      if (telemetry) {
        const currentKey = `${telemetry.latitude},${telemetry.longitude}`;
        const prevKey = prevTelemetryRef.current[sn];

        // Only update if position actually changed
        if (currentKey !== prevKey) {
          hasChanges = true;
          prevTelemetryRef.current[sn] = currentKey;
        }

        const deviceNickname = deviceList.find((device) => device.id === sn)?.metadata?.alias || sn;

        updatedPositions[sn] = {
          sn: sn,
          nickname: deviceNickname,
          longitude: telemetry.longitude,
          latitude: telemetry.latitude,
        };
      }
    });

    // Only trigger re-render if positions actually changed
    if (hasChanges) {
      setDronePositions(updatedPositions);
    }
  }, [droneUpdates, getProcessedDroneData, deviceList]);

  // Get selected drone info for info panel
  const selectedDroneInfo = useMemo(() => {
    if (!selectedDrone) return null;

    // Get telemetry data for the selected drone
    const telemetry = getProcessedDroneData(selectedDrone.sn);
    const deviceNickname =
      deviceList.find((device) => device.id === selectedDrone.sn)?.metadata?.alias ||
      selectedDrone.sn;

    return {
      nickname: deviceNickname, // Use serial number as nickname
      serialNumber: selectedDrone.sn,
      latitude: selectedDrone.latitude.toFixed(6),
      longitude: selectedDrone.longitude.toFixed(6),
      battery: telemetry?.battery || 0,
      altitude: telemetry?.altitude || 0,
      direction: telemetry?.direction || 'N',
      incidents: selectedDrone?.incidents || [],
    };
  }, [selectedDrone, getProcessedDroneData]);

  const styles: Record<string, any> = {
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

  // Fit map to show all drones
  const fitToAllDrones = useCallback(() => {
    const positions = Object.values(dronePositions);
    if (positions.length === 0) return;

    const longitudes = positions.map((d) => d.longitude);
    const latitudes = positions.map((d) => d.latitude);

    const minLng = Math.min(...longitudes);
    const maxLng = Math.max(...longitudes);
    const minLat = Math.min(...latitudes);
    const maxLat = Math.max(...latitudes);

    setViewState((prev) => ({
      ...prev,
      longitude: (minLng + maxLng) / 2,
      latitude: (minLat + maxLat) / 2,
      zoom: positions.length === 1 ? 16 : 14,
    }));
  }, [dronePositions]);

  // Fly to specific drone with smooth animation
  const flyToDrone = useCallback((drone: DronePositionType) => {
    // Use maplibre's flyTo for smooth animation
    mapRef.current?.flyTo({
      center: [drone.longitude, drone.latitude],
      zoom: 18,
      duration: 2000, // 2 second smooth animation
      essential: true,
    });
    setSelectedDrone(drone);
  }, []);

  // Handle basemap change
  const handleBasemapChange = useCallback((event: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedStyle(event.target.value);
  }, []);

  // Memoize drone positions array for stable reference
  const dronePositionsArray = useMemo(() => Object.values(dronePositions), [dronePositions]);

  // Convert element groups to GeoJSON Features
  const mapElementsGeoJSON = useMemo(() => {
    const features: any[] = [];
    elementGroups.forEach((group) => {
      group.elements.forEach((el) => {
        if (el.resource?.content) {
          features.push({
            ...el.resource.content,
            id: el.id,
            properties: {
              ...el.resource.content.properties,
              name: el.name,
              groupId: group.id,
              groupName: group.name,
            },
          });
        }
      });
    });
    return {
      type: 'FeatureCollection',
      features,
    };
  }, [elementGroups]);

  return (
    <section className='h-[67dvh] relative w-full'>
      {/* Map Component */}
      <Map
        ref={mapRef}
        {...viewState}
        onMove={(evt) => setViewState(evt.viewState)}
        mapStyle={styles[selectedStyle]}
        style={{ width: '100%', height: '100%' }}
      >
        <NavigationControl position='top-left' />

        {/* Render all drone markers */}
        {dronePositionsArray.map((drone) => (
          <PulseMarker key={drone.sn} drone={drone} onClick={flyToDrone} />
        ))}

        {/* Map Elements (Points, Lines, Polygons from DJI Cloud) */}
        {showElements && (
          <Source id='map-elements' type='geojson' data={mapElementsGeoJSON as any}>
            {/* Polygons */}
            <Layer
              id='map-elements-polygons'
              type='fill'
              filter={['==', '$type', 'Polygon']}
              paint={{
                'fill-color': ['get', 'color'],
                'fill-opacity': 0.3,
              }}
            />
            <Layer
              id='map-elements-polygons-outline'
              type='line'
              filter={['==', '$type', 'Polygon']}
              paint={{
                'line-color': ['get', 'color'],
                'line-width': 2,
              }}
            />

            {/* Lines */}
            <Layer
              id='map-elements-lines'
              type='line'
              filter={['==', '$type', 'LineString']}
              paint={{
                'line-color': ['get', 'color'],
                'line-width': 3,
              }}
            />

            {/* Points (Circles) */}
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

        {/* Flight area markers — DJI geofences (shown when USE_DJI_CLOUD=true) */}
        {DJI_CONFIG.USE_DJI_CLOUD &&
          flightAreas.map((area) => {
            // Extract a lat/lng anchor from the content if available, otherwise skip rendering
            const content = area.content as any;
            const lng: number | undefined = content?.longitude ?? content?.center?.longitude;
            const lat: number | undefined = content?.latitude ?? content?.center?.latitude;
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

        {/* Popup for selected drone */}
        {selectedDrone && selectedDroneInfo && (
          <Popup
            longitude={selectedDrone.longitude}
            latitude={selectedDrone.latitude}
            onClose={() => setSelectedDrone(null)}
            anchor='bottom'
            className='drone-popup'
          >
            <div className='bg-neutral-950 text-white p-3 rounded-lg min-w-[250px]'>
              <h3 className='font-semibold text-lg mb-2'>{selectedDroneInfo.nickname}</h3>
              <div className='text-xs text-gray-400 mb-2'>
                SN: {selectedDroneInfo.serialNumber.slice(-8)}
              </div>
              <div className='border-t border-gray-700 pt-2 text-sm space-y-1'>
                <div>
                  <span className='text-gray-400'>Lat:</span>{' '}
                  <span className='font-mono'>{selectedDroneInfo.latitude}</span>
                </div>
                <div>
                  <span className='text-gray-400'>Lng:</span>{' '}
                  <span className='font-mono'>{selectedDroneInfo.longitude}</span>
                </div>
              </div>

              <div className='border-t border-gray-700 mt-2 pt-2 text-sm space-y-2'>
                <div className='flex justify-between items-center'>
                  <span className='text-gray-400'>Incidents</span>
                  <div className='font-mono'>({selectedDrone.incidents?.length ?? 0})</div>
                </div>

                {/* Scrollable incident icons */}
                <div className='flex overflow-x-auto space-x-4 py-2 scrollbar-thin scrollbar-thumb-gray-700'>
                  {selectedDrone.incidents?.map((incident, index) => (
                    <div
                      key={incident.id || index}
                      className='flex flex-col items-center flex-shrink-0'
                    >
                      <div className='w-10 h-10 rounded-full bg-red-500 flex items-center justify-center text-white font-bold'>
                        ⚠️
                      </div>
                      <span className='text-xs mt-1 text-gray-400'>{index + 1}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </Popup>
        )}
      </Map>

      {/* Controls Panel */}
      <div className='absolute top-4 right-4 bg-neutral-950 p-4 rounded-lg shadow-lg z-10 min-w-64'>
        <div className='flex items-center gap-2 mb-4'>
          <LayoutTemplate className='w-5 h-5' />
          <h3 className='font-semibold'>Controls</h3>
        </div>

        {/* Basemap Switcher */}
        <div className='mb-4'>
          <label className='block text-sm font-medium mb-1'>Basemap Style</label>
          <select
            value={selectedStyle}
            onChange={handleBasemapChange}
            className='w-full p-2 border bg-slate-800 rounded text-sm'
          >
            <option value='dark'>Dark</option>
            <option value='positron'>Positron</option>
            <option value='satellite'>Satellite</option>
          </select>
        </div>

        {/* Layers Toggles */}
        <div className='mb-4 space-y-2'>
          <label className='block text-sm font-medium mb-1'>Layers</label>
          <label className='flex items-center space-x-2 text-sm cursor-pointer'>
            <input
              type='checkbox'
              checked={showElements}
              onChange={(e) => setShowElements(e.target.checked)}
              className='rounded border-gray-700 bg-slate-800'
            />
            <span>
              Map Elements ({elementGroups.reduce((acc, g) => acc + g.elements.length, 0)})
            </span>
          </label>
        </div>

        {/* Info Panel */}
        <div className='mb-4 p-2 bg-neutral-950 rounded text-sm'>
          {selectedDroneInfo ? (
            <>
              <div className='font-medium mb-2'>Selected Asset:</div>
              <div className='mb-1'>
                <span className='text-gray-400'>Name:</span>{' '}
                <span className='font-mono'>{selectedDroneInfo.nickname}</span>
              </div>
              <div className='mb-1 text-xs text-gray-400'>
                SN: {selectedDroneInfo.serialNumber.slice(-8)}
              </div>
              <div className='border-t border-gray-700 mt-2 pt-2'>
                <div>
                  <span className='text-gray-400'>Lat:</span>{' '}
                  <span className='font-mono'>{selectedDroneInfo.latitude}</span>
                </div>
                <div>
                  <span className='text-gray-400'>Lng:</span>{' '}
                  <span className='font-mono'>{selectedDroneInfo.longitude}</span>
                </div>
              </div>
            </>
          ) : (
            <div className='text-gray-400 text-center py-2'>Click asset to view details</div>
          )}
          <div className='mt-2 pt-2 border-t border-gray-700 text-xs text-gray-400'>
            Active Asset: {Object.keys(dronePositions).length}
          </div>
        </div>

        {/* Controls */}
        <div className='flex gap-2 mb-4'>
          <button
            onClick={fitToAllDrones}
            disabled={Object.keys(dronePositions).length === 0}
            className='flex-1 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-600 disabled:cursor-not-allowed text-white py-2 px-3 rounded text-sm transition-colors'
          >
            Zoom Extent
          </button>
        </div>

        {/* Sync flight areas to devices — DJI Cloud only */}
        {DJI_CONFIG.USE_DJI_CLOUD && (
          <div className='mb-4'>
            <button
              onClick={() =>
                syncGeofences({
                  device_sn: boundDevices.map((d) => d.deviceSn),
                })
              }
              disabled={isSyncing || boundDevices.length === 0}
              className='w-full bg-orange-600 hover:bg-orange-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white py-2 px-3 rounded text-sm transition-colors'
            >
              {isSyncing ? 'Syncing...' : `Sync Geofences (${flightAreas.length})`}
            </button>
            {boundDevices.length === 0 && (
              <p className='text-xs text-gray-500 mt-1 text-center'>No bound devices</p>
            )}
          </div>
        )}

        {/* Drone List */}
        <div className='h-full overflow-auto'>
          <h4 className='font-medium mb-2'>Active Asset ({dronePositionsArray.length})</h4>
          <div className='max-h-40 overflow-y-auto space-y-1'>
            {dronePositionsArray.map((drone) => {
              const telemetry = getProcessedDroneData(drone.sn);

              return (
                <button
                  key={drone.sn}
                  onClick={() => flyToDrone(drone)}
                  className='w-full text-left p-2 hover:bg-gray-600 rounded text-sm flex justify-between items-center transition-colors'
                >
                  <div className='flex-1 truncate'>
                    <div className='font-medium'>{drone.nickname}</div>
                    <div className='text-xs text-gray-400'>SN: {drone.sn.slice(-8)}</div>
                  </div>
                  <div className='flex items-center gap-2'>
                    {telemetry?.isRecent && (
                      <span className='w-2 h-2 bg-green-500 rounded-full'></span>
                    )}
                    <span className='text-xs text-gray-500'>→</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Pulse Animation & Popup Styles */}
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

        /* Dark theme popup styling */
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
          padding: 10px !important;
        }
      `}</style>
    </section>
  );
}

export default GeoMap;
