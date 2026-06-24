'use client';

import React, { useEffect, useRef, useState } from 'react';
import Map, { Marker, Source, Layer, type MapRef } from 'react-map-gl/maplibre';
import type { StyleSpecification } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { Globe, HardDrive, Layers, Moon, Plane, Target } from 'lucide-react';
import type { ProcessedDroneData } from '@/hooks/useTelemetry';

export interface TacticalMiniMapProps {
  droneData?: ProcessedDroneData | null;
  dockData?: ProcessedDroneData | null;
  /** Target GPS during takeoff-to-point — shows destination marker + route line */
  targetLat?: number;
  targetLng?: number;
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
  { key: 'dark',      icon: Moon,  label: 'Dark'      },
];

const ALT_MAX = 400;
// Mirror the HTML reference: altitude threshold for "airborne" state
const AIRBORNE_ALT_M = 60;

const TacticalMiniMap = ({ droneData, dockData, targetLat, targetLng, className }: TacticalMiniMapProps) => {
  const mapRef        = useRef<MapRef>(null);
  const hasAutoZoomed = useRef(false); // fire flyTo only once per mount
  const [activeStyle, setActiveStyle] = useState<MapStyleKey>('dark');
  const [pickerOpen, setPickerOpen]   = useState(false);

  // ─── Drone position ───────────────────────────────────────────────────────
  const droneLat    = droneData?.latitude  ?? 0;
  const droneLng    = droneData?.longitude ?? 0;
  const heading     = droneData?.heading   ?? 0;
  const altitude    = droneData?.altitude  ?? 0;
  const hasPosition = droneLat !== 0 || droneLng !== 0;
  const isAirborne  = altitude > AIRBORNE_ALT_M;
  const altPct      = Math.min((altitude / ALT_MAX) * 100, 100);

  // ─── Dock position ────────────────────────────────────────────────────────
  const dockLat    = dockData?.latitude  ?? 0;
  const dockLng    = dockData?.longitude ?? 0;
  const hasDockPos = dockLat !== 0 || dockLng !== 0;
  const dockOnline = dockData?.online ?? false;

  // ─── Destination target ───────────────────────────────────────────────────
  const hasTarget = targetLat != null && targetLng != null && targetLat !== 0 && targetLng !== 0;

  // ─── Route line: drone → target (GeoJSON) ─────────────────────────────────
  const routeGeoJson = hasTarget && hasPosition ? {
    type: 'FeatureCollection' as const,
    features: [{
      type: 'Feature' as const,
      geometry: {
        type: 'LineString' as const,
        coordinates: [
          [droneLng, droneLat],
          [targetLng!, targetLat!],
        ],
      },
      properties: {},
    }],
  } : null;

  // ─── Initial view — real GPS if available, otherwise world overview ───────
  const hasAnyPos = hasPosition || hasDockPos;
  const initLat   = hasPosition ? droneLat : hasDockPos ? dockLat : 20;
  const initLng   = hasPosition ? droneLng : hasDockPos ? dockLng : 0;
  const initZoom  = hasAnyPos ? 16 : 2;
  const initPitch = hasAnyPos ? 45 : 0;

  // ─── Auto-zoom: fly to drone/dock position on first GPS arrival ───────────
  // The component often mounts before telemetry arrives (initZoom=2 world view).
  // When position first appears we do a one-time flyTo with a tight zoom so
  // the drone is actually visible. Subsequent moves use easeTo (no zoom change).
  useEffect(() => {
    if (!mapRef.current) return;

    if (hasPosition) {
      if (!hasAutoZoomed.current) {
        // First GPS fix — zoom straight to drone
        hasAutoZoomed.current = true;
        mapRef.current.flyTo({ center: [droneLng, droneLat], zoom: 16, pitch: 45, duration: 1500 });
      } else {
        // Already zoomed — just track drone position
        mapRef.current.easeTo({ center: [droneLng, droneLat], duration: 800 });
      }
    } else if (hasDockPos && !hasAutoZoomed.current) {
      // No drone yet — zoom to dock so the user can see the dock marker
      hasAutoZoomed.current = true;
      mapRef.current.flyTo({ center: [dockLng, dockLat], zoom: 16, pitch: 45, duration: 1500 });
    }
  }, [droneLat, droneLng, hasPosition, dockLat, dockLng, hasDockPos]);

  return (
    <div
      className={`relative bg-[#0C0E12] border border-zinc-800/50 rounded-xl overflow-hidden shadow-2xl${className ? ` ${className}` : ''}`}
      style={className ? undefined : { width: '304px', height: '350px' }}
    >
      {/* ── Base map ───────────────────────────────────────────────────── */}
      <Map
        ref={mapRef}
        initialViewState={{
          longitude: initLng,
          latitude:  initLat,
          zoom:  initZoom,
          pitch: initPitch,
        }}
        style={{ width: '100%', height: '100%' }}
        mapStyle={MAP_STYLES[activeStyle]}
        attributionControl={false}
      >
        {/* Route line — drone to target during active mission */}
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

        {/* Dock marker — fixed ground station with pulsing ring when online */}
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

        {/* Destination marker — shown during takeoff-to-point */}
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

      {/* ── HUD overlays (pointer-events-none) ────────────────────────── */}
      <div className='absolute inset-0 z-10 pointer-events-none'>
        {/* Vignette */}
        <div className='absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_30%,rgba(12,14,18,0.65)_100%)]' />

        {/* Altitude bar — right (drone altitude only) */}
        <div className='absolute right-4 top-1/2 -translate-y-1/2 flex flex-col items-center gap-2'>
          <span className='text-[8px] font-black text-white/30 uppercase tracking-[0.2em]'>Alt</span>
          <span className={`text-[10px] font-mono font-bold ${isAirborne ? 'text-blue-400' : hasPosition ? 'text-zinc-400' : 'text-zinc-600'}`}>
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
        {(hasPosition || hasDockPos || hasTarget) && (
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
            {hasTarget && (
              <div className='flex items-center gap-1.5'>
                <Target size={10} className='text-amber-400' />
                <span className='text-[8px] font-mono text-amber-400/70 uppercase tracking-wide'>Target</span>
              </div>
            )}
          </div>
        )}

        {/* Top-left corner bracket */}
        <div className='absolute top-3 left-3 flex flex-col gap-1'>
          <div className='w-2.5 h-2.5 border-t-2 border-l-2 border-white/30 rounded-tl' />
          <span className='text-[8px] font-mono text-white/25 uppercase tracking-wider'>
            {isAirborne ? 'Airborne' : hasPosition ? 'GPS Lock' : hasDockPos ? 'Dock Only' : 'No Signal'}
          </span>
        </div>

        {/* Bottom-right corner bracket */}
        <div className='absolute bottom-3 right-3 w-2.5 h-2.5 border-b-2 border-r-2 border-white/30 rounded-br' />
      </div>

      {/* ── Style switcher ─────────────────────────────────────────────── */}
      <div className='absolute bottom-3 left-3 z-20 flex flex-col items-start gap-1.5'>
        {pickerOpen && (
          <div className='flex flex-col gap-1.5 mb-0.5'>
            {STYLE_OPTIONS.map(({ key, icon: Icon, label }) => {
              const isActive = activeStyle === key;
              return (
                <button
                  key={key}
                  onClick={() => { setActiveStyle(key); setPickerOpen(false); }}
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
