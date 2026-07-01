'use client';

import React, { useEffect, useState, useRef, useMemo, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { X, Loader2, AlertCircle } from 'lucide-react';
import { parseKmzBuffer } from '@/lib/utils/parseWaylineKmz';
import { getToken } from '@/lib/config/token-store';
import { useAuth } from '@/providers/AuthProvider';
import { DJI_CONFIG } from '@/lib/config/config';
import type { Wayline, WaypointCoord, WaylineMissionData } from '@/lib/types';
import type { MapRef } from 'react-map-gl/maplibre';
import Map, { Source, Layer, NavigationControl } from 'react-map-gl/maplibre';
import type { GeoJSON } from 'geojson';

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

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.round(seconds % 60);
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
}

function formatArea(sqm: number): string {
  if (sqm >= 1_000_000) return `${(sqm / 1_000_000).toFixed(2)} km²`;
  if (sqm >= 10_000) return `${(sqm / 10_000).toFixed(2)} ha`;
  return `${Math.round(sqm)} m²`;
}

function createHatchPattern(): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = 12;
  canvas.height = 12;
  const ctx = canvas.getContext('2d')!;
  ctx.strokeStyle = 'rgba(34, 211, 238, 0.35)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(0, 12);
  ctx.lineTo(12, 0);
  ctx.moveTo(-3, 3);
  ctx.lineTo(3, -3);
  ctx.moveTo(9, 15);
  ctx.lineTo(15, 9);
  ctx.stroke();
  return canvas;
}

interface WaylinePreviewModalProps {
  wayline: Wayline | null;
  open: boolean;
  onClose: () => void;
}

export default function WaylinePreviewModal({ wayline, open, onClose }: WaylinePreviewModalProps) {
  const { user } = useAuth();
  const workspaceId = user?.workspace_id ?? DJI_CONFIG.WORKSPACE_ID;
  const [mounted, setMounted] = useState(false);
  const [waypoints, setWaypoints] = useState<WaypointCoord[]>([]);
  const [mission, setMission] = useState<WaylineMissionData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [basemap, setBasemap] = useState('dark');
  const mapRef = useRef<MapRef>(null);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (!open || !wayline) {
      setWaypoints([]);
      setMission(null);
      setError(null);
      return;
    }

    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const token = getToken() ?? '';
        const params = new URLSearchParams({
          workspaceId: workspaceId,
          waylineId: wayline.id,
          fileName: `${wayline.name}.kmz`,
        });

        const res = await fetch(`/api/wayline/download?${params}`, {
          headers: { 'x-auth-token': token },
        });

        if (!res.ok) {
          throw new Error(`Download failed: ${res.status}`);
        }

        const buffer = await res.arrayBuffer();
        const { waypoints: coords, mission: missionData } = await parseKmzBuffer(buffer);

        if (!cancelled) {
          setWaypoints(coords);
          setMission(missionData);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load wayline');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    load();
    return () => { cancelled = true; };
  }, [open, wayline, workspaceId]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open, onClose]);

  const onMapLoad = useCallback((e: { target: maplibregl.Map }) => {
    const map = e.target;
    if (!map.hasImage('hatch-pattern')) {
      const canvas = createHatchPattern();
      map.addImage('hatch-pattern', canvas as any);
    }
  }, []);

  const initialViewState = useMemo(() => ({
    longitude: waypoints[0]?.lng ?? 0,
    latitude: waypoints[0]?.lat ?? 0,
    zoom: 16,
  }), [waypoints]);

  const mapStyle = useMemo(() => MAP_STYLES[basemap] as string, [basemap]);

  const surveyAreaGeoJson: GeoJSON.Feature | null = useMemo(() => {
    if (!mission?.surveyPolygon || mission.surveyPolygon.length < 3) return null;
    return {
      type: 'Feature',
      properties: {},
      geometry: {
        type: 'Polygon',
        coordinates: [[
          ...mission.surveyPolygon.map((p) => [p.lng, p.lat]),
          [mission.surveyPolygon[0].lng, mission.surveyPolygon[0].lat],
        ]],
      },
    };
  }, [mission]);

  if (!mounted || !open || !wayline) return null;

  const routeGeoJson: GeoJSON.Feature = {
    type: 'Feature',
    properties: {},
    geometry: {
      type: 'LineString',
      coordinates: waypoints.map((w) => [w.lng, w.lat, w.alt]),
    },
  };

  const waypointGeoJson: GeoJSON.FeatureCollection = {
    type: 'FeatureCollection',
    features: waypoints.map((w) => ({
      type: 'Feature',
      properties: {
        index: w.index,
        isStart: w.index === 0,
        isEnd: w.index === waypoints.length - 1,
      },
      geometry: {
        type: 'Point',
        coordinates: [w.lng, w.lat, w.alt],
      },
    })),
  };

  return createPortal(
    <div className='fixed inset-0 z-[9999] flex items-center justify-center'>
      <div className='absolute inset-0 bg-black/80 backdrop-blur-sm' onClick={onClose} />

      <div className='relative z-10 w-[90vw] h-[80vh] max-w-6xl bg-zinc-950 border border-zinc-800 rounded-xl shadow-2xl shadow-black/60 flex flex-col overflow-hidden'>
        <div className='flex items-center justify-between px-5 py-3 border-b border-zinc-800 flex-shrink-0 bg-zinc-900'>
          <div className='flex items-center gap-3'>
            <h2 className='text-sm font-bold text-zinc-100 font-poppins'>{wayline.name}</h2>
            <span className='text-[10px] text-zinc-500 font-mono'>
              {wayline.drone_model_key}
              {mission?.payloadEnumValue ? ` · Payload ${mission.payloadEnumValue}` : ''}
            </span>
          </div>
          <div className='flex items-center gap-3'>
            <select
              value={basemap}
              onChange={(e) => setBasemap(e.target.value)}
              className='text-xs bg-zinc-800 border border-zinc-700 text-zinc-400 rounded-lg px-2 py-1 focus:outline-none focus:border-zinc-600'
            >
              <option value='dark'>Dark</option>
              <option value='positron'>Positron</option>
              <option value='satellite'>Satellite</option>
            </select>
            <button
              onClick={onClose}
              className='p-1.5 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 rounded-lg transition-colors'
            >
              <X size={16} />
            </button>
          </div>
        </div>

        <div className='flex-1 relative overflow-hidden'>
          {loading && (
            <div className='absolute inset-0 flex items-center justify-center bg-zinc-950 z-20'>
              <div className='flex items-center gap-2 text-zinc-400'>
                <Loader2 size={18} className='animate-spin' />
                <span className='text-sm font-poppins'>Loading wayline…</span>
              </div>
            </div>
          )}

          {error && (
            <div className='absolute inset-0 flex items-center justify-center bg-zinc-950 z-20'>
              <div className='flex flex-col items-center gap-2 text-zinc-400'>
                <AlertCircle size={24} />
                <span className='text-sm font-poppins'>{error}</span>
                <button
                  onClick={onClose}
                  className='text-xs text-zinc-500 underline hover:text-zinc-200'
                >
                  Close
                </button>
              </div>
            </div>
          )}

          {!loading && !error && waypoints.length > 0 && (
            <Map
              ref={mapRef}
              initialViewState={initialViewState}
              mapStyle={mapStyle}
              style={{ width: '100%', height: '100%' }}
              onLoad={onMapLoad}
            >
              <NavigationControl position='top-left' />

              {surveyAreaGeoJson && (
                <Source id='survey-area' type='geojson' data={surveyAreaGeoJson}>
                  <Layer
                    id='survey-area-fill'
                    type='fill'
                    paint={{
                      'fill-pattern': 'hatch-pattern',
                      'fill-opacity': 0.5,
                    }}
                  />
                  <Layer
                    id='survey-area-bg'
                    type='fill'
                    paint={{
                      'fill-color': '#22d3ee',
                      'fill-opacity': 0.08,
                    }}
                  />
                  <Layer
                    id='survey-area-outline'
                    type='line'
                    paint={{
                      'line-color': '#22d3ee',
                      'line-width': 1.5,
                      'line-opacity': 0.6,
                      'line-dasharray': [4, 2],
                    }}
                  />
                </Source>
              )}

              <Source id='wayline-route' type='geojson' data={routeGeoJson}>
                <Layer
                  id='route-line'
                  type='line'
                  paint={{
                    'line-color': '#22d3ee',
                    'line-width': 3,
                    'line-opacity': 0.9,
                  }}
                />
              </Source>

              <Source id='wayline-waypoints' type='geojson' data={waypointGeoJson}>
                <Layer
                  id='waypoint-circles'
                  type='circle'
                  paint={{
                    'circle-radius': [
                      'case',
                      ['any', ['get', 'isStart'], ['get', 'isEnd']],
                      8,
                      5,
                    ],
                    'circle-color': [
                      'case',
                      ['get', 'isStart'],
                      '#22c55e',
                      ['get', 'isEnd'],
                      '#ef4444',
                      '#3b82f6',
                    ],
                    'circle-stroke-color': '#ffffff',
                    'circle-stroke-width': 2,
                  }}
                />
                <Layer
                  id='waypoint-labels'
                  type='symbol'
                  layout={{
                    'text-field': ['get', 'index'],
                    'text-size': 10,
                    'text-offset': [0, 1.5],
                  }}
                  paint={{
                    'text-color': '#e2e8f0',
                    'text-halo-color': '#000000',
                    'text-halo-width': 1,
                  }}
                />
              </Source>
            </Map>
          )}

          {waypoints.length > 0 && (
            <div className='absolute bottom-4 left-4 bg-[#1A1C20]/90 backdrop-blur-sm border border-zinc-800 rounded-lg px-4 py-3 z-10 max-w-xs'>
              <p className='text-xs font-bold text-zinc-200 mb-2'>Mission Summary</p>
              <div className='grid grid-cols-2 gap-x-4 gap-y-1.5 text-[10px] font-mono'>
                <span className='text-zinc-500'>Type</span>
                <span className='text-zinc-300'>{mission?.missionType ?? '—'}</span>

                <span className='text-zinc-500'>Waypoints</span>
                <span className='text-zinc-300'>{waypoints.length}</span>

                <span className='text-zinc-500'>Altitude</span>
                <span className='text-zinc-300'>{mission?.flightAltitude ?? waypoints[0]?.alt ?? '—'} m</span>

                <span className='text-zinc-500'>Speed</span>
                <span className='text-zinc-300'>{mission?.flightSpeed ? `${mission.flightSpeed} m/s` : '—'}</span>

                <span className='text-zinc-500'>Distance</span>
                <span className='text-zinc-300'>{mission?.totalDistance ? `${(mission.totalDistance / 1000).toFixed(2)} km` : '—'}</span>

                <span className='text-zinc-500'>Duration</span>
                <span className='text-zinc-300'>{mission?.estimatedDuration ? formatDuration(mission.estimatedDuration) : '—'}</span>

                <span className='text-zinc-500'>Photos</span>
                <span className='text-zinc-300'>{mission?.estimatedPhotos ?? '—'}</span>

                <span className='text-zinc-500'>Area</span>
                <span className='text-zinc-300'>{mission?.surveyArea ? formatArea(mission.surveyArea) : '—'}</span>

                <span className='text-zinc-500'>Overlap</span>
                <span className='text-zinc-300'>{mission ? `${mission.frontOverlap}%F / ${mission.sideOverlap}%S` : '—'}</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
