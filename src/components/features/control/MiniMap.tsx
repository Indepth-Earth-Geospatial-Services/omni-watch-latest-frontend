'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import Map, { Marker, Source, Layer, type MapRef } from 'react-map-gl/maplibre';
import type { MapLayerMouseEvent } from 'react-map-gl/maplibre';
import type { StyleSpecification } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { Globe, HardDrive, Layers, Moon, MousePointerClick, Navigation, Plane, Target } from 'lucide-react';
import type { ProcessedDroneData } from '@/hooks/useTelemetry';

export interface TacticalMiniMapProps {
  droneData?: ProcessedDroneData | null;
  dockData?: ProcessedDroneData | null;
  /** Target GPS during takeoff-to-point — shows destination marker + route line */
  targetLat?: number;
  targetLng?: number;
  /** Where the drone lifted off from — anchors the historical flight path polyline */
  originLat?: number;
  originLng?: number;
  /** Ordered list of destinations the drone has already been commanded to fly to */
  waypoints?: Array<{ lat: number; lng: number }>;
  /** Called when the user right-clicks the map to select a target coordinate */
  onRightClick?: (lat: number, lng: number) => void;
  /**
   * When the parent hides this component with CSS (display:none) and later reveals
   * it, pass this flag so the map can resize its canvas to fill the container again.
   */
  visible?: boolean;
  /** Controlled map style — lifted to parent so both instances stay in sync */
  mapStyle?: MapStyleKey;
  onMapStyleChange?: (style: MapStyleKey) => void;
  className?: string;
}

type MapStyleKey = 'dark' | 'satellite';

const MAP_STYLES: Record<MapStyleKey, string | StyleSpecification> = {
  dark: 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json',
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

const STYLE_OPTIONS: { key: MapStyleKey; icon: React.ElementType; label: string }[] = [
  { key: 'satellite', icon: Globe, label: 'Satellite' },
  { key: 'dark', icon: Moon, label: 'Dark' },
];

const ALT_MAX = 400;
const AIRBORNE_ALT_M = 60;
const DJI_MAX_RANGE_M = 7000;

function circleGeoJSON(
  centerLng: number,
  centerLat: number,
  radiusM: number,
  points = 64
): GeoJSON.Feature<GeoJSON.Polygon> {
  const coords: [number, number][] = [];
  for (let i = 0; i <= points; i++) {
    const angle = (i / points) * 2 * Math.PI;
    const dLat = (radiusM / 111320) * Math.cos(angle);
    const dLng =
      (radiusM / (111320 * Math.cos((centerLat * Math.PI) / 180))) * Math.sin(angle);
    coords.push([centerLng + dLng, centerLat + dLat]);
  }
  return {
    type: 'Feature',
    geometry: { type: 'Polygon', coordinates: [coords] },
    properties: {},
  };
}

const TacticalMiniMap = ({
  droneData,
  dockData,
  targetLat,
  targetLng,
  originLat,
  originLng,
  waypoints = [],
  onRightClick,
  visible,
  mapStyle,
  onMapStyleChange,
  className,
}: TacticalMiniMapProps) => {
  const mapRef = useRef<MapRef>(null);
  const hasAutoZoomed = useRef(false);
  const hasAutoZoomedToDrone = useRef(false);
  const prevDroneOnline = useRef(false);
  const prevHasTarget = useRef(false);
  const prevVisible = useRef(visible !== false); // true on first render unless explicitly false
  // Use controlled style from parent when provided; fall back to dark
  const activeStyle: MapStyleKey = mapStyle ?? 'dark';
  const [pickerOpen, setPickerOpen] = useState(false);

  // ─── Drone position ───────────────────────────────────────────────────────
  const droneLat = droneData?.latitude ?? 0;
  const droneLng = droneData?.longitude ?? 0;
  const heading = droneData?.heading ?? 0;
  const altitude = droneData?.altitude ?? 0;
  const droneOnline = droneData?.online ?? false;
  const hasPosition = droneLat !== 0 || droneLng !== 0;
  const isAirborne = altitude > AIRBORNE_ALT_M;
  const altPct = Math.min((altitude / ALT_MAX) * 100, 100);

  // ─── Dock position ────────────────────────────────────────────────────────
  const dockLat = dockData?.latitude ?? 0;
  const dockLng = dockData?.longitude ?? 0;
  const hasDockPos = dockLat !== 0 || dockLng !== 0;
  const dockOnline = dockData?.online ?? false;

  // ─── Destination target ───────────────────────────────────────────────────
  const hasTarget = targetLat != null && targetLng != null && targetLat !== 0 && targetLng !== 0;

  // ─── Range circle (centered on dock, fallback to drone) ───────────────────
  const rangeCircle = useMemo(() => {
    const cLng = hasDockPos ? dockLng : hasPosition ? droneLng : null;
    const cLat = hasDockPos ? dockLat : hasPosition ? droneLat : null;
    if (cLng == null || cLat == null) return null;
    return {
      type: 'FeatureCollection' as const,
      features: [circleGeoJSON(cLng, cLat, DJI_MAX_RANGE_M)],
    };
  }, [hasDockPos, dockLng, dockLat, hasPosition, droneLng, droneLat]);

  // ─── Route line: drone → target ───────────────────────────────────────────
  const routeGeoJson =
    hasTarget && hasPosition
      ? {
          type: 'FeatureCollection' as const,
          features: [
            {
              type: 'Feature' as const,
              geometry: {
                type: 'LineString' as const,
                coordinates: [
                  [droneLng, droneLat],
                  [targetLng!, targetLat!],
                ],
              },
              properties: {},
            },
          ],
        }
      : null;

  // ─── Historical flight path: origin → completed waypoints → current target ─
  const hasOrigin = originLat != null && originLng != null && (originLat !== 0 || originLng !== 0);
  const flightPathGeoJson = useMemo(() => {
    if (!hasOrigin) return null;
    const coords: [number, number][] = [[originLng!, originLat!]];
    for (const wpt of waypoints) coords.push([wpt.lng, wpt.lat]);
    if (hasTarget) coords.push([targetLng!, targetLat!]);
    if (coords.length < 2) return null;
    return {
      type: 'FeatureCollection' as const,
      features: [{
        type: 'Feature' as const,
        geometry: { type: 'LineString' as const, coordinates: coords },
        properties: {},
      }],
    };
  }, [hasOrigin, originLat, originLng, waypoints, hasTarget, targetLat, targetLng]);

  // ─── Initial view ─────────────────────────────────────────────────────────
  const hasAnyPos = hasPosition || hasDockPos;
  const initLat = hasPosition ? droneLat : hasDockPos ? dockLat : 20;
  const initLng = hasPosition ? droneLng : hasDockPos ? dockLng : 0;
  const initZoom = hasAnyPos ? 16 : 2;
  const initPitch = hasAnyPos ? 45 : 0;

  // ─── Resize canvas when the parent un-hides this component ────────────────
  // MapLibre computes the canvas at 0×0 while display:none. A resize() call
  // after the container is shown again restores correct dimensions.
  useEffect(() => {
    const isNowVisible = visible !== false;
    const becameVisible = isNowVisible && !prevVisible.current;
    prevVisible.current = isNowVisible;
    if (becameVisible) {
      // RAF ensures the browser has finished the layout pass before we measure
      requestAnimationFrame(() => {
        mapRef.current?.resize();
      });
    }
  }, [visible]);

  // ─── Viewport tracking: zoom to drone/dock, fit to show route when active ─
  useEffect(() => {
    if (!mapRef.current) return;

    const droneJustCameOnline = droneOnline && !prevDroneOnline.current;
    prevDroneOnline.current = droneOnline;

    const targetJustAppeared = hasTarget && !prevHasTarget.current;
    prevHasTarget.current = hasTarget;

    if (hasTarget && hasPosition && (targetJustAppeared || droneJustCameOnline || !hasAutoZoomed.current)) {
      // A mission target just appeared (or drone came online with active target):
      // fit the viewport to show both the drone and the target point simultaneously.
      hasAutoZoomed.current = true;
      hasAutoZoomedToDrone.current = true;
      mapRef.current.fitBounds(
        [
          [Math.min(droneLng, targetLng!), Math.min(droneLat, targetLat!)],
          [Math.max(droneLng, targetLng!), Math.max(droneLat, targetLat!)],
        ],
        { padding: 80, maxZoom: 16, duration: 1500 }
      );
    } else if (hasPosition && droneOnline && (droneJustCameOnline || !hasAutoZoomedToDrone.current)) {
      // Drone has a GPS fix and we haven't zoomed to it yet (covers the case where
      // the drone came online before telemetry arrived and the dock zoom already ran).
      hasAutoZoomed.current = true;
      hasAutoZoomedToDrone.current = true;
      mapRef.current.flyTo({ center: [droneLng, droneLat], zoom: 17, pitch: 45, duration: 1500 });
    } else if (hasPosition && droneOnline && !hasTarget) {
      // No active mission target — continuously track drone position.
      mapRef.current.easeTo({ center: [droneLng, droneLat], duration: 800 });
    } else if (hasDockPos && !hasAutoZoomed.current) {
      hasAutoZoomed.current = true;
      mapRef.current.flyTo({ center: [dockLng, dockLat], zoom: 16, pitch: 45, duration: 1500 });
    }
  }, [
    droneLat, droneLng, hasPosition, droneOnline,
    hasTarget, targetLat, targetLng,
    dockLat, dockLng, hasDockPos,
  ]);

  // ─── Right-click handler ──────────────────────────────────────────────────
  const handleContextMenu = (e: MapLayerMouseEvent) => {
    e.originalEvent.preventDefault();
    if (onRightClick) onRightClick(e.lngLat.lat, e.lngLat.lng);
  };

  const showRightClickHint = !!onRightClick && hasAnyPos;

  return (
    <div
      className={`relative bg-[#0C0E12] border border-zinc-800/50 rounded-t-md overflow-hidden shadow-2xl${className ? ` ${className}` : ''}`}
      style={className ? undefined : { width: '301px', height: '342px', borderRadius: '8px' }}
    >
      {/* ── Base map ───────────────────────────────────────────── */}
      <Map
        ref={mapRef}
        initialViewState={{
          longitude: initLng,
          latitude: initLat,
          zoom: initZoom,
          pitch: initPitch,
        }}
        style={{ width: '100%', height: '100%' }}
        mapStyle={MAP_STYLES[activeStyle]}
        attributionControl={false}
        onContextMenu={handleContextMenu}
      >
        {/* DJI max-range circle */}
        {rangeCircle && (
          <Source id='range' type='geojson' data={rangeCircle}>
            <Layer
              id='range-fill'
              type='fill'
              paint={{ 'fill-color': '#3b82f6', 'fill-opacity': 0.04 }}
            />
            <Layer
              id='range-line'
              type='line'
              paint={{
                'line-color': '#3b82f6',
                'line-width': 1.5,
                'line-dasharray': [4, 3],
                'line-opacity': 0.35,
              }}
            />
          </Source>
        )}

        {/* Historical flight path — solid white polyline through all commanded legs */}
        {flightPathGeoJson && (
          <Source id='flight-path' type='geojson' data={flightPathGeoJson}>
            <Layer
              id='flight-path-line'
              type='line'
              paint={{
                'line-color': '#ffffff',
                'line-width': 1,
                'line-opacity': 0.25,
              }}
            />
          </Source>
        )}

        {/* Route line — drone to active mission target */}
        {routeGeoJson && (
          <Source id='route' type='geojson' data={routeGeoJson}>
            <Layer
              id='route-line'
              type='line'
              paint={{
                'line-color': '#f59e0b',
                'line-width': 1.5,
                'line-dasharray': [4, 3],
                'line-opacity': 0.7,
              }}
            />
          </Source>
        )}

        {/* Launch origin marker */}
        {hasOrigin && (
          <Marker longitude={originLng!} latitude={originLat!} anchor='center'>
            <div className='relative flex items-center justify-center'>
              <div className='w-6 h-6 rounded-full border border-violet-400/70 bg-violet-950/90 flex items-center justify-center drop-shadow-[0_0_8px_rgba(167,139,250,0.7)]'>
                <Navigation size={11} className='text-violet-300' />
              </div>
            </div>
          </Marker>
        )}

        {/* Past waypoint markers — intermediate destinations already commanded */}
        {waypoints.map((wpt, i) => (
          <Marker key={`wpt-${i}`} longitude={wpt.lng} latitude={wpt.lat} anchor='center'>
            <div className='relative flex items-center justify-center'>
              <div className='w-5 h-5 rounded-full border border-slate-400/60 bg-slate-900/90 flex items-center justify-center drop-shadow-[0_0_6px_rgba(148,163,184,0.5)]'>
                <span className='text-[8px] font-black text-slate-300'>{i + 1}</span>
              </div>
            </div>
          </Marker>
        ))}

        {/* Dock marker */}
        {hasDockPos && (
          <Marker longitude={dockLng} latitude={dockLat} anchor='center'>
            <div className='relative flex items-center justify-center'>
              {dockOnline && (
                <div className='absolute w-10 h-10 rounded-full border-2 border-emerald-500/40 animate-ping' />
              )}
              <div className='w-7 h-7 rounded-full border border-emerald-500/60 bg-emerald-950/90 flex items-center justify-center drop-shadow-[0_0_8px_rgba(16,185,129,0.8)]'>
                <HardDrive size={14} className='text-emerald-400' />
              </div>
            </div>
          </Marker>
        )}

        {/* Destination marker */}
        {hasTarget && (
          <Marker longitude={targetLng!} latitude={targetLat!} anchor='center'>
            <div className='relative flex items-center justify-center'>
              <div className='absolute w-8 h-8 rounded-full border border-amber-400/40 animate-ping' />
              <div className='w-6 h-6 rounded-full border border-amber-400/80 bg-amber-950/90 flex items-center justify-center drop-shadow-[0_0_10px_rgba(251,191,36,0.7)]'>
                <Target size={12} className='text-amber-400' />
              </div>
            </div>
          </Marker>
        )}

        {/* Drone marker — rotates with heading */}
        {hasPosition && (
          <Marker longitude={droneLng} latitude={droneLat} anchor='center'>
            <div
              style={{ transform: `rotate(${heading}deg)` }}
              className='transition-transform duration-700 ease-out drop-shadow-[0_0_8px_rgba(59,130,246,0.9)]'
            >
              <Plane className='text-blue-500 fill-blue-500' size={28} />
            </div>
          </Marker>
        )}
      </Map>

      {/* ── HUD overlays (pointer-events-none) ────────────────── */}
      <div className='absolute inset-0 z-10 pointer-events-none'>
        {/* Vignette */}
        <div className='absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_30%,rgba(12,14,18,0.65)_100%)]' />

        {/* Altitude bar */}
        <div className='absolute right-4 top-1/2 -translate-y-1/2 flex flex-col items-center gap-2'>
          <span className='text-[8px] font-black text-white/30 uppercase tracking-[0.2em]'>Alt</span>
          <span
            className={`text-[10px] font-mono font-bold ${isAirborne ? 'text-blue-400' : hasPosition ? 'text-zinc-400' : 'text-zinc-600'}`}
          >
            {hasPosition ? `${altitude.toFixed(0)}m` : '—'}
          </span>
          <div className='relative h-36 w-[3px] bg-white/5 rounded-full overflow-hidden'>
            <div className='absolute inset-0 flex flex-col justify-between py-1'>
              {[...Array(5)].map((_, i) => (
                <div key={i} className='w-full h-[1px] bg-white/20' />
              ))}
            </div>
            <div
              className='absolute bottom-0 w-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.6)] transition-all duration-700'
              style={{ height: `${altPct}%` }}
            />
          </div>
        </div>

        {/* Legend */}
        {(hasPosition || hasDockPos || hasTarget || hasOrigin) && (
          <div className='absolute bottom-10 right-4 flex flex-col gap-1.5'>
            {hasPosition && (
              <div className='flex items-center gap-1.5'>
                <Plane size={10} className='text-blue-400 fill-blue-400' />
                <span className='text-[8px] font-mono text-blue-400/70 uppercase tracking-wide'>Drone</span>
              </div>
            )}
            {hasDockPos && (
              <div className='flex items-center gap-1.5'>
                <HardDrive size={10} className='text-emerald-400' />
                <span className='text-[8px] font-mono text-emerald-400/70 uppercase tracking-wide'>Dock</span>
              </div>
            )}
            {hasOrigin && (
              <div className='flex items-center gap-1.5'>
                <Navigation size={10} className='text-violet-400' />
                <span className='text-[8px] font-mono text-violet-400/70 uppercase tracking-wide'>Launch</span>
              </div>
            )}
            {hasTarget && (
              <div className='flex items-center gap-1.5'>
                <Target size={10} className='text-amber-400' />
                <span className='text-[8px] font-mono text-amber-400/70 uppercase tracking-wide'>Target</span>
              </div>
            )}
          </div>
        )}

        {/* Top-left state badge */}
        <div className='absolute top-3 left-3 flex flex-col gap-1'>
          <div className='w-2.5 h-2.5 border-t-2 border-l-2 border-white/30 rounded-tl' />
          <span className='text-[8px] font-mono text-white/25 uppercase tracking-wider'>
            {isAirborne ? 'Airborne' : hasPosition ? 'GPS Lock' : hasDockPos ? 'Dock Only' : 'No Signal'}
          </span>
        </div>

        {/* Right-click hint */}
        {showRightClickHint && (
          <div className='absolute top-3 right-10 flex items-center gap-1 bg-black/50 backdrop-blur-sm rounded px-1.5 py-0.5 border border-white/10'>
            <MousePointerClick size={8} className='text-white/40' />
            <span className='text-[7px] font-mono text-white/30 uppercase tracking-wider'>
              Right-click to target
            </span>
          </div>
        )}

        {/* Bottom-right corner bracket */}
        <div className='absolute bottom-3 right-3 w-2.5 h-2.5 border-b-2 border-r-2 border-white/30 rounded-br' />
      </div>

      {/* ── Style switcher ─────────────────────────────────────── */}
      <div className='absolute bottom-3 left-3 z-20 flex flex-col items-start gap-1.5'>
        {pickerOpen && (
          <div className='flex flex-col gap-1.5 mb-0.5'>
            {STYLE_OPTIONS.map(({ key, icon: Icon, label }) => {
              const isActive = activeStyle === key;
              return (
                <button
                  key={key}
                  onClick={() => {
                    onMapStyleChange?.(key);
                    setPickerOpen(false);
                  }}
                  title={label}
                  className={`w-7 h-7 rounded-full flex items-center justify-center transition-all duration-150 border backdrop-blur-sm shadow-lg ${
                    isActive
                      ? 'bg-blue-500/30 border-blue-400/60 text-blue-300'
                      : 'bg-black/50 border-white/15 text-white/50 hover:bg-white/10 hover:border-white/30 hover:text-white'
                  }`}
                >
                  <Icon size={13} />
                </button>
              );
            })}
          </div>
        )}

        <button
          onClick={() => setPickerOpen((p) => !p)}
          title='Switch map style'
          className={`w-7 h-7 rounded-full flex items-center justify-center transition-all duration-150 border backdrop-blur-sm shadow-lg ${
            pickerOpen
              ? 'bg-white/20 border-white/30 text-white'
              : 'bg-black/50 border-white/15 text-white/50 hover:bg-white/10 hover:border-white/30 hover:text-white'
          }`}
        >
          <Layers size={13} />
        </button>
      </div>
    </div>
  );
};

export default TacticalMiniMap;
