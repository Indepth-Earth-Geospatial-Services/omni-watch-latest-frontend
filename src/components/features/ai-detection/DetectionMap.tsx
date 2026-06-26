'use client';

import { useMemo } from 'react';
import Map, { Marker, NavigationControl } from 'react-map-gl/maplibre';
import { MapPin } from 'lucide-react';
import 'maplibre-gl/dist/maplibre-gl.css';
import type { ThreatDetection } from '@/lib/types/threats';

interface DetectionMapProps {
  detections: ThreatDetection[];
  onSelectDetection?: (detection: ThreatDetection) => void;
}

const MAP_STYLE = 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json';

function getMarkerColor(d: ThreatDetection): string {
  if (d.isVerified) return '#22c55e';
  return '#f97316';
}

export function DetectionMap({ detections, onSelectDetection }: DetectionMapProps) {
  const markersWithGPS = useMemo(
    () =>
      detections.filter(
        (d) => d.droneLatitude != null && d.droneLongitude != null
      ),
    [detections]
  );

  const defaultCenter = useMemo(() => {
    if (markersWithGPS.length === 0) return { longitude: 7.0336, latitude: 4.8242 };
    const lats = markersWithGPS.map((d) => d.droneLatitude!);
    const lngs = markersWithGPS.map((d) => d.droneLongitude!);
    return {
      longitude: (Math.min(...lngs) + Math.max(...lngs)) / 2,
      latitude: (Math.min(...lats) + Math.max(...lats)) / 2,
    };
  }, [markersWithGPS]);

  return (
    <div className="h-[400px] w-full rounded-lg border border-gray-800 overflow-hidden">
      <Map
        initialViewState={{
          ...defaultCenter,
          zoom: markersWithGPS.length === 1 ? 16 : 12,
        }}
        mapStyle={MAP_STYLE}
        style={{ width: '100%', height: '100%' }}
      >
        <NavigationControl position="top-left" />

        {markersWithGPS.map((d) => (
          <Marker
            key={`drone-${d.id}`}
            longitude={d.droneLongitude!}
            latitude={d.droneLatitude!}
            anchor="bottom"
            onClick={() => onSelectDetection?.(d)}
          >
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
              <MapPin
                className="w-6 h-6 text-blue-500 drop-shadow-[0_2px_6px_rgba(0,0,0,0.5)]"
                strokeWidth={1.5}
                fill="rgba(59,130,246,0.25)"
              />
            </div>
          </Marker>
        ))}

        {markersWithGPS
          .filter((d) => d.objectLatitude != null && d.objectLongitude != null)
          .map((d) => (
            <Marker
              key={`object-${d.id}`}
              longitude={d.objectLongitude!}
              latitude={d.objectLatitude!}
              anchor="bottom"
              onClick={() => onSelectDetection?.(d)}
            >
              <div className="group relative cursor-pointer">
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                  <div className="bg-neutral-900/95 backdrop-blur-sm border border-gray-700/60 px-2.5 py-1.5 rounded-lg shadow-xl whitespace-nowrap">
                    <p className="text-[11px] font-semibold text-gray-100 leading-none capitalize">
                      {d.type} — Object
                    </p>
                    <p className="text-[9px] text-gray-500 mt-0.5">
                      {(d.confidence * 100).toFixed(1)}% · {d.streamId}
                    </p>
                  </div>
                  <div className="w-0 h-0 border-l-[4px] border-l-transparent border-r-[4px] border-r-transparent border-t-[4px] border-t-neutral-900/95 mx-auto" />
                </div>
                <MapPin
                  className="w-6 h-6 drop-shadow-[0_2px_6px_rgba(0,0,0,0.5)]"
                  strokeWidth={1.5}
                  fill="rgba(239,68,68,0.25)"
                  style={{ color: getMarkerColor(d) }}
                />
              </div>
            </Marker>
          ))}
      </Map>
    </div>
  );
}
