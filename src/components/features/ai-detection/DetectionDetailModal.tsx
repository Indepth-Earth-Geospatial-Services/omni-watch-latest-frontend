'use client';

import { useEffect, useCallback } from 'react';
import { X, MapPin, Clock, Shield, Video, ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatTimeAgo } from '@/lib/utils';
import { getConfidenceColor } from './lib/detection-utils';
import type { ThreatDetection } from '@/lib/types/threats';

interface DetectionDetailModalProps {
  detection: ThreatDetection | null;
  onClose: () => void;
}

export function DetectionDetailModal({ detection, onClose }: DetectionDetailModalProps) {
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    },
    [onClose]
  );

  useEffect(() => {
    if (detection) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [detection, handleKeyDown]);

  if (!detection) return null;

  const d = detection;

  const geospatialHref = (() => {
    const params = new URLSearchParams();
    if (d.droneLatitude != null && d.droneLongitude != null) {
      params.set('lat', String(d.droneLatitude));
      params.set('lng', String(d.droneLongitude));
    }
    return `/geospatial?${params.toString()}`;
  })();

  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center'>
      {/* Backdrop */}
      <div
        className='absolute inset-0 bg-black/60 backdrop-blur-sm'
        onClick={onClose}
      />

      {/* Modal */}
      <div className='relative bg-[#0C0D10] border border-zinc-800/50 rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto mx-4'>
        {/* Header */}
        <div className='flex items-center justify-between p-4 border-b border-zinc-800/50'>
          <div className='flex items-center gap-2'>
            <span className='font-semibold text-[#E2E2E8] capitalize'>{d.type}</span>
            <span
              className={cn(
                'text-xs px-2 py-0.5 rounded text-white',
                d.isVerified ? 'bg-green-500' : 'bg-orange-500'
              )}
            >
              {d.isVerified ? 'Verified' : 'Pending'}
            </span>
          </div>
          <button
            onClick={onClose}
            className='p-1 rounded-md hover:bg-zinc-800/50 transition-colors'
          >
            <X className='w-5 h-5 text-[#8C90A0]' />
          </button>
        </div>

        {/* Content */}
        <div className='p-4 space-y-4'>
          {/* Image */}
          {d.imageUrl && (
            <div className='rounded-lg overflow-hidden border border-zinc-800/50 bg-zinc-900'>
              <img
                src={d.imageUrl}
                alt={`${d.type} detection`}
                className='w-full h-auto max-h-[300px] object-contain'
              />
            </div>
          )}

          {/* Bounding Box */}
          <div className='bg-zinc-900/50 rounded-lg p-3 border border-zinc-800/50'>
            <h4 className='text-xs font-medium text-[#8C90A0] mb-1'>Bounding Box</h4>
            <p className='text-sm font-mono text-[#E2E2E8]'>
              x={d.boundingBox.x.toFixed(3)} y={d.boundingBox.y.toFixed(3)} w={d.boundingBox.width.toFixed(3)} h={d.boundingBox.height.toFixed(3)}
            </p>
          </div>

          {/* Details Grid */}
          <div className='grid grid-cols-2 gap-3'>
            <div className='bg-zinc-900/50 rounded-lg p-3 border border-zinc-800/50'>
              <div className='flex items-center gap-1 text-xs text-[#8C90A0] mb-1'>
                <Shield className='w-3 h-3' />
                Confidence
              </div>
              <p className={cn('text-lg font-bold font-mono', getConfidenceColor(d.confidence))}>
                {(d.confidence * 100).toFixed(1)}%
              </p>
            </div>

            <div className='bg-zinc-900/50 rounded-lg p-3 border border-zinc-800/50'>
              <div className='flex items-center gap-1 text-xs text-[#8C90A0] mb-1'>
                <Video className='w-3 h-3' />
                Stream
              </div>
              <p className='text-sm font-mono text-[#E2E2E8] truncate'>{d.streamId}</p>
            </div>

            <div className='bg-zinc-900/50 rounded-lg p-3 border border-zinc-800/50'>
              <div className='flex items-center gap-1 text-xs text-[#8C90A0] mb-1'>
                <Clock className='w-3 h-3' />
                Detected
              </div>
              <p className='text-sm text-[#E2E2E8]'>{formatTimeAgo(d.detectedAt)}</p>
            </div>

            <div className='bg-zinc-900/50 rounded-lg p-3 border border-zinc-800/50'>
              <div className='flex items-center gap-1 text-xs text-[#8C90A0] mb-1'>
                <span className='font-mono text-[10px]'>ID</span>
                Track
              </div>
              <p className='text-sm font-mono text-[#E2E2E8]'>#{d.trackId}</p>
            </div>
          </div>

          {/* GPS */}
          <div className='bg-zinc-900/50 rounded-lg p-3 border border-zinc-800/50'>
            <div className='flex items-center gap-1 text-xs text-[#8C90A0] mb-2'>
              <MapPin className='w-3 h-3' />
              GPS Coordinates
            </div>
            <div className='grid grid-cols-2 gap-2 text-sm'>
              <div>
                <span className='text-zinc-500'>Drone: </span>
                <span className='font-mono text-[#E2E2E8]'>
                  {d.droneLatitude != null && d.droneLongitude != null
                    ? `${d.droneLatitude.toFixed(6)}, ${d.droneLongitude.toFixed(6)}`
                    : 'N/A'}
                </span>
              </div>
              <div>
                <span className='text-zinc-500'>Object: </span>
                <span className='font-mono text-[#E2E2E8]'>
                  {d.objectLatitude != null && d.objectLongitude != null
                    ? `${d.objectLatitude.toFixed(6)}, ${d.objectLongitude.toFixed(6)}`
                    : 'N/A'}
                </span>
              </div>
            </div>
          </div>

          {/* LLM Reasoning */}
          {d.isVerified && d.reasoning && (
            <div className='bg-zinc-900/50 rounded-lg p-3 border border-zinc-800/50'>
              <h4 className='text-xs font-medium text-[#45F0CF] mb-2'>LLM Reasoning</h4>
              <p className='text-sm text-[#E2E2E8] leading-relaxed'>{d.reasoning}</p>
            </div>
          )}

          {/* Open in Geospatial Map */}
          {d.droneLatitude != null && d.droneLongitude != null && (
            <a
              href={geospatialHref}
              className='flex items-center justify-center gap-2 w-full py-2.5 rounded-lg border border-zinc-700 text-sm text-[#E2E2E8] hover:bg-zinc-800/50 transition-colors'
            >
              <ExternalLink className='w-4 h-4' />
              Open in Geospatial Map
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
