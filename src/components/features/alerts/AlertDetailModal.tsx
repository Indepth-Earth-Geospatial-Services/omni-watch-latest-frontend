'use client';

import { useEffect, useCallback, useState } from 'react';
import dynamic from 'next/dynamic';
import Image from 'next/image';
import { X, MapPin, Clock, Shield, Video, ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatTimeAgo } from '@/lib/utils';
import { getConfidenceColor } from '@/components/features/ai-detection/lib/detection-utils';
import { ConfirmDialog } from '@/components/features/ai-detection/ConfirmDialog';
import type { ThreatDetection } from '@/lib/types/threats';

const ThreatMap = dynamic(
  () =>
    import('@/components/features/ai-detection/ThreatMap').then((mod) => mod.ThreatMap),
  {
    loading: () => (
      <div className='h-48 animate-pulse bg-neutral-800 rounded-lg border border-zinc-800/50' />
    ),
    ssr: false,
  }
);

interface AlertDetailModalProps {
  detection: ThreatDetection | null;
  onClose: () => void;
  onApprove?: (detection: ThreatDetection) => void;
  onDismiss?: (detection: ThreatDetection) => void;
  isPending?: boolean;
}

export function AlertDetailModal({
  detection,
  onClose,
  onApprove,
  onDismiss,
  isPending = false,
}: AlertDetailModalProps) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState<'approve' | 'dismiss' | null>(null);

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

  const handleApproveClick = () => {
    setConfirmAction('approve');
    setConfirmOpen(true);
  };

  const handleDismissClick = () => {
    setConfirmAction('dismiss');
    setConfirmOpen(true);
  };

  const handleConfirmAction = () => {
    if (!detection) return;
    if (confirmAction === 'approve' && onApprove) {
      onApprove(detection);
    } else if (confirmAction === 'dismiss' && onDismiss) {
      onDismiss(detection);
    }
    setConfirmOpen(false);
    setConfirmAction(null);
  };

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
      <div className='absolute inset-0 bg-black/60 backdrop-blur-sm' onClick={onClose} />

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
            {d.status === 'approved' && (
              <span className='text-xs px-2 py-0.5 rounded bg-purple-500/20 text-purple-400 font-bold uppercase'>
                Approved
              </span>
            )}
            {d.status === 'dismissed' && (
              <span className='text-xs px-2 py-0.5 rounded bg-zinc-600/30 text-zinc-500 font-bold uppercase'>
                Dismissed
              </span>
            )}
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
            <div className='relative rounded-lg overflow-hidden border border-zinc-800/50 bg-zinc-900 h-[300px]'>
              <Image
                src={d.imageUrl}
                alt={`${d.type} detection`}
                fill
                className='object-contain'
                unoptimized
              />
            </div>
          )}

          {/* Bounding Box */}
          <div className='bg-zinc-900/50 rounded-lg p-3 border border-zinc-800/50'>
            <h4 className='text-xs font-medium text-[#8C90A0] mb-1'>Bounding Box</h4>
            <p className='text-sm font-mono text-[#E2E2E8]'>
              x={d.boundingBox.x.toFixed(3)} y={d.boundingBox.y.toFixed(3)} w=
              {d.boundingBox.width.toFixed(3)} h={d.boundingBox.height.toFixed(3)}
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

          {/* Threat Map */}
          {d.droneLatitude != null && d.droneLongitude != null && (
            <div className='bg-zinc-900/50 rounded-lg p-3 border border-zinc-800/50'>
              <div className='flex items-center gap-1 text-xs text-[#8C90A0] mb-2'>
                <MapPin className='w-3 h-3' />
                Location
              </div>
              <ThreatMap detection={d} />
            </div>
          )}

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

        {/* Action Buttons */}
        {d.status !== 'approved' && d.status !== 'dismissed' && (onApprove || onDismiss) && (
          <div className='flex gap-3 p-4 border-t border-zinc-800/50'>
            {onDismiss && (
              <button
                onClick={handleDismissClick}
                className='flex-1 py-2.5 rounded-lg border border-zinc-700 text-zinc-400 text-[11px] font-bold uppercase tracking-widest hover:border-zinc-500 hover:text-zinc-200 transition-colors'
              >
                Dismiss
              </button>
            )}
            {onApprove && (
              <button
                onClick={handleApproveClick}
                className='flex-1 py-2.5 rounded-lg bg-red-500/20 border border-red-500/50 text-red-400 text-[11px] font-black uppercase tracking-widest hover:bg-red-500/30 hover:border-red-400 transition-colors shadow-[0_0_20px_rgba(239,68,68,0.1)]'
              >
                Approve Threat
              </button>
            )}
          </div>
        )}

        {/* Confirm Dialog */}
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
      </div>
    </div>
  );
}
