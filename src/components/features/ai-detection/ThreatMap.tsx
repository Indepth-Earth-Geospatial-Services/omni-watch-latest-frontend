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

  useEffect(
    () => () => {
      mapRef.current?.stop();
    },
    []
  );

  const droneLat = detection.droneLatitude ?? 4.8242;
  const droneLng = detection.droneLongitude ?? 7.0336;

  return (
    <div className="h-48 w-full rounded-lg border border-zinc-800/50 overflow-hidden">
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
        <NavigationControl position="top-left" />

        {/* Drone marker with hover tooltip */}
        <Marker longitude={droneLng} latitude={droneLat} anchor="bottom">
          <div className="group relative">
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
              <div className="bg-neutral-900/95 backdrop-blur-sm border border-gray-700/60 px-2.5 py-1.5 rounded-lg shadow-xl whitespace-nowrap">
                <p className="text-[11px] font-semibold text-gray-100 leading-none capitalize">
                  {detection.type} — Drone
                </p>
                <p className="text-[9px] text-gray-500 mt-0.5">
                  {(detection.confidence * 100).toFixed(1)}% · {detection.streamId}
                </p>
              </div>
              <div className="w-0 h-0 border-l-[4px] border-l-transparent border-r-[4px] border-r-transparent border-t-[4px] border-t-neutral-900/95 mx-auto" />
            </div>
            <MapPin
              className="w-6 h-6 text-blue-500 drop-shadow-[0_2px_6px_rgba(0,0,0,0.5)]"
              strokeWidth={1.5}
              fill="rgba(59,130,246,0.25)"
            />
          </div>
        </Marker>

        {/* Object marker with pulsing ring and hover tooltip */}
        {detection.objectLatitude != null && detection.objectLongitude != null && (
          <Marker
            longitude={detection.objectLongitude}
            latitude={detection.objectLatitude}
            anchor="bottom"
          >
            <div className="group relative">
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                <div className="bg-neutral-900/95 backdrop-blur-sm border border-gray-700/60 px-2.5 py-1.5 rounded-lg shadow-xl whitespace-nowrap">
                  <p className="text-[11px] font-semibold text-gray-100 leading-none capitalize">
                    {detection.type} — Object
                  </p>
                  <p className="text-[9px] text-gray-500 mt-0.5">
                    {(detection.confidence * 100).toFixed(1)}% · {detection.streamId}
                  </p>
                </div>
                <div className="w-0 h-0 border-l-[4px] border-l-transparent border-r-[4px] border-r-transparent border-t-[4px] border-t-neutral-900/95 mx-auto" />
              </div>
              <div className="relative">
                <span className="absolute -inset-1 rounded-full bg-red-500/30 animate-ping" />
                <MapPin
                  className="w-6 h-6 text-red-500 drop-shadow-[0_2px_6px_rgba(0,0,0,0.5)]"
                  strokeWidth={1.5}
                  fill="rgba(239,68,68,0.25)"
                />
              </div>
            </div>
          </Marker>
        )}
      </Map>
    </div>
  );
}