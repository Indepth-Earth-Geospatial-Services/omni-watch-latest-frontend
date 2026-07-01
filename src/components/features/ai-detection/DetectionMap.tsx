'use client';

import { useState, useMemo, useRef, useEffect } from 'react';
import Image from 'next/image';
import Map, { Marker, NavigationControl, Popup, type MapRef } from 'react-map-gl/maplibre';
import { MapPin, Layers } from 'lucide-react';
import 'maplibre-gl/dist/maplibre-gl.css';
import type { ThreatDetection } from '@/lib/types/threats';
import { ConfirmDialog } from './ConfirmDialog';

interface DetectionMapProps {
  detections: ThreatDetection[];
  onSelectDetection?: (detection: ThreatDetection) => void;
  focusDetection?: ThreatDetection | null;
  onCloseFocus?: () => void;
  onApprove?: (detection: ThreatDetection) => void;
  onDismiss?: (detection: ThreatDetection) => void;
  isPending?: boolean;
}

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

function getMarkerColor(d: ThreatDetection): string {
  if (d.status === 'approved') return '#a855f7';
  if (d.isVerified) return '#22c55e';
  return '#f97316';
}

export function DetectionMap({
  detections,
  onSelectDetection,
  focusDetection,
  onCloseFocus,
  onApprove,
  onDismiss,
  isPending = false,
}: DetectionMapProps) {
  const mapRef = useRef<MapRef>(null);
  const [selectedStyle, setSelectedStyle] = useState('dark');
  const [mapLoaded, setMapLoaded] = useState(false);

  // ── Confirm dialog state ──────────────────────────────────────────────────
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState<'approve' | 'dismiss' | null>(null);

  const handleApproveClick = () => {
    setConfirmAction('approve');
    setConfirmOpen(true);
  };

  const handleDismissClick = () => {
    setConfirmAction('dismiss');
    setConfirmOpen(true);
  };

  const handleConfirmAction = () => {
    if (!focusDetection) return;
    if (confirmAction === 'approve' && onApprove) {
      onApprove(focusDetection);
    } else if (confirmAction === 'dismiss' && onDismiss) {
      onDismiss(focusDetection);
    }
    setConfirmOpen(false);
    setConfirmAction(null);
    onCloseFocus?.();
  };

  useEffect(
    () => () => {
      mapRef.current?.stop();
    },
    []
  );

  useEffect(() => {
    if (!focusDetection || !mapRef.current || !mapLoaded) return;
    const lng = focusDetection.objectLongitude ?? focusDetection.droneLongitude ?? 0;
    const lat = focusDetection.objectLatitude ?? focusDetection.droneLatitude ?? 0;
    mapRef.current.flyTo({ center: [lng, lat], zoom: 17, duration: 1000 });
  }, [focusDetection, mapLoaded]);

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
    <div className="relative h-[400px] w-full rounded-lg border border-gray-800 overflow-hidden">
      {/* Basemap switcher */}
      <div className="absolute top-2 right-2 z-10">
        <div className="flex items-center gap-1 bg-neutral-900/90 backdrop-blur-sm border border-gray-700/60 rounded-lg px-2 py-1">
          <Layers size={11} className="text-gray-400" />
          <select
            value={selectedStyle}
            onChange={(e) => setSelectedStyle(e.target.value)}
            className="bg-transparent text-[10px] font-ui text-gray-300 outline-none cursor-pointer"
          >
            <option value="dark">Dark</option>
            <option value="positron">Positron</option>
            <option value="satellite">Satellite</option>
          </select>
        </div>
      </div>

      <Map
        ref={mapRef}
        initialViewState={{
          ...defaultCenter,
          zoom: markersWithGPS.length === 1 ? 16 : 12,
        }}
        mapStyle={MAP_STYLES[selectedStyle] as string}
        style={{ width: '100%', height: '100%' }}
        onLoad={() => setMapLoaded(true)}
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

        {focusDetection && (
          <Popup
            longitude={focusDetection.objectLongitude ?? focusDetection.droneLongitude ?? 0}
            latitude={focusDetection.objectLatitude ?? focusDetection.droneLatitude ?? 0}
            anchor='bottom'
            offset={12}
            closeOnClick={false}
            onClose={() => onCloseFocus?.()}
            className='detection-popup'
          >
            <div className='bg-neutral-950 text-white p-2.5 rounded-lg w-[220px]'>
              {/* Detection image placeholder — wire in imageUrl to show */}
              {focusDetection.imageUrl ? (
                <div className='relative w-full h-28 rounded mb-2 border border-gray-700/50 overflow-hidden'>
                  <Image
                    src={focusDetection.imageUrl}
                    alt=''
                    fill
                    className='object-cover'
                    unoptimized
                  />
                </div>
              ) : (
                <div className='w-full h-16 rounded mb-2 border border-gray-700/50 bg-neutral-900 flex items-center justify-center'>
                  <span className='text-[10px] text-gray-600'>No image</span>
                </div>
              )}

              {/* Type + status */}
              <div className='flex items-center justify-between mb-1'>
                <h3 className='font-semibold text-xs font-ui capitalize'>{focusDetection.type}</h3>
                <span className={`text-[8px] font-bold uppercase px-1 py-0.5 rounded ${focusDetection.isVerified ? 'bg-green-500/20 text-green-400' : 'bg-orange-500/20 text-orange-400'}`}>
                  {focusDetection.isVerified ? 'Verified' : 'Pending'}
                </span>
              </div>

              {/* Details */}
              <div className='border-t border-gray-700 pt-1.5 space-y-0.5'>
                <Row label='Confidence' value={`${(focusDetection.confidence * 100).toFixed(1)}%`} />
                <Row label='Stream' value={focusDetection.streamId} />
                <Row label='Track' value={`#${focusDetection.trackId}`} />
                {focusDetection.isVerified && focusDetection.reasoning && (
                  <p className='text-[9px] text-green-400/70 mt-1 line-clamp-2 leading-relaxed'>
                    {focusDetection.reasoning}
                  </p>
                )}
              </div>

              {/* Action buttons — show for all detections (YOLO + verified) */}
              {(onApprove || onDismiss) && (
                <div className='flex gap-2 mt-2 pt-2 border-t border-gray-700'>
                  {onDismiss && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDismissClick();
                      }}
                      className='flex-1 py-1.5 rounded text-[10px] font-bold uppercase tracking-widest border border-zinc-700 text-zinc-400 hover:border-zinc-500 hover:text-zinc-200 transition-colors'
                    >
                      Dismiss
                    </button>
                  )}
                  {onApprove && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleApproveClick();
                      }}
                      className='flex-1 py-1.5 rounded text-[10px] font-bold uppercase tracking-widest bg-red-500/20 border border-red-500/50 text-red-400 hover:bg-red-500/30 hover:border-red-400 transition-colors'
                    >
                      Approve
                    </button>
                  )}
                </div>
              )}
            </div>
          </Popup>
        )}
      </Map>

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title={confirmAction === 'approve' ? 'Approve Threat?' : 'Dismiss Threat?'}
        description={
          confirmAction === 'approve'
            ? 'Approve this threat? This will mark it as confirmed and may trigger automated responses.'
            : 'Dismiss this threat? This will mark it as a false positive.'
        }
        confirmLabel={confirmAction === 'approve' ? 'Approve' : 'Dismiss'}
        onConfirm={handleConfirmAction}
        variant={confirmAction === 'approve' ? 'destructive' : 'default'}
        isPending={isPending}
      />

      {/* Dark popup overrides */}
      <style jsx global>{`
        .detection-popup .maplibregl-popup-content {
          background-color: transparent !important;
          padding: 0 !important;
          box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.5) !important;
        }
        .detection-popup .maplibregl-popup-close-button {
          color: #fff !important;
          font-size: 18px !important;
          margin: 4px 8px !important;
          padding: 4px 8px !important;
          right: 4px !important;
          top: 4px !important;
        }
        .detection-popup .maplibregl-popup-close-button:hover {
          background-color: rgba(255, 255, 255, 0.1) !important;
          border-radius: 4px !important;
        }
        .detection-popup .maplibregl-popup-tip {
          border-top-color: #030712 !important;
        }
      `}</style>
    </div>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className='flex justify-between items-start gap-2'>
      <span className='text-gray-400 text-[10px] flex-shrink-0'>{label}</span>
      <span className='font-mono text-[10px] text-right break-all'>{value}</span>
    </div>
  );
}
