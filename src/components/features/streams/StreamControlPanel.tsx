"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { DJI_CONFIG } from "@/lib/dji/config";
import {
  useLiveCapacity,
  useStartStream,
  useStopStream,
  useUpdateStreamQuality,
  useSwitchStreamCamera,
} from "@/hooks/useDJIDevices";
import type { WebRTCStream } from "@/config/webrtc-streams";

interface StreamControlPanelProps {
  stream: WebRTCStream;
}

const QUALITY_OPTIONS = [
  { label: "Auto",   value: 0 },
  { label: "Smooth", value: 1 },
  { label: "SD",     value: 2 },
  { label: "HD",     value: 3 },
  { label: "4K",     value: 4 },
] as const;

// video_type values match VideoCapacity.video_type strings from the capacity response.
const LENS_OPTIONS = [
  { label: "Normal", value: "normal" },
  { label: "Wide",   value: "wide"   },
  { label: "IR",     value: "IR"     },
] as const;

type LensValue = (typeof LENS_OPTIONS)[number]["value"];

// Only renders for DJI DRONE streams when the DJI Cloud feature flag is on.
// BODY CAM and CCTV streams have no DJI livestream API — return null for those.
export function StreamControlPanel({ stream }: StreamControlPanelProps) {
  const deviceSn = stream.id;

  const [isStreaming, setIsStreaming]     = useState(false);
  const [quality, setQuality]             = useState(0);          // 0 = auto
  const [lens, setLens]                   = useState<LensValue>("normal");
  // Tracks the video_id used for the current session so stop/update/switch all
  // reference the same identifier that was used at start time.
  const [activeVideoId, setActiveVideoId] = useState<string | null>(null);

  const { data: capacityMap } = useLiveCapacity();
  const startMutation   = useStartStream();
  const stopMutation    = useStopStream();
  const qualityMutation = useUpdateStreamQuality();
  const lensMutation    = useSwitchStreamCamera();

  // Build video_id from live capacity data when available; fall back to index 0.
  // Format: "{device_sn}/{camera_index}/{video_index}"
  const capacity    = capacityMap?.get(deviceSn);
  const firstCamera = capacity?.camera_list?.[0];
  const firstVideo  = firstCamera?.video_list?.[0];
  const defaultVideoId = firstCamera && firstVideo
    ? `${deviceSn}/${firstCamera.camera_index}/${firstVideo.video_index}`
    : `${deviceSn}/0/0`;

  const currentVideoId = activeVideoId ?? defaultVideoId;
  const disabled = !stream.isOnline;
  const isPending =
    startMutation.isPending  ||
    stopMutation.isPending   ||
    qualityMutation.isPending ||
    lensMutation.isPending;

  if (!DJI_CONFIG.USE_DJI_CLOUD || stream.feedType !== "DRONE") {
    return null;
  }

  const handleStart = () => {
    startMutation.mutate(
      {
        video_id:      currentVideoId,
        url_type:      2,              // WebRTC
        url:           stream.streamUrl,
        video_quality: quality,
      },
      {
        onSuccess: () => {
          setIsStreaming(true);
          setActiveVideoId(currentVideoId);
        },
      }
    );
  };

  const handleStop = () => {
    stopMutation.mutate(
      { video_id: currentVideoId },
      {
        onSuccess: () => {
          setIsStreaming(false);
          setActiveVideoId(null);
        },
      }
    );
  };

  const handleQualityChange = (newQuality: number) => {
    setQuality(newQuality);
    if (isStreaming) {
      qualityMutation.mutate({
        video_id:      currentVideoId,
        video_quality: newQuality,
      });
    }
  };

  const handleLensChange = (newLens: LensValue) => {
    setLens(newLens);
    if (isStreaming) {
      lensMutation.mutate({
        video_id:   currentVideoId,
        video_type: newLens,
      });
    }
  };

  return (
    <div className="flex flex-wrap items-end gap-6 mt-4 pt-4 border-t border-slate-700">
      {/* Lens selector */}
      <div>
        <p className="text-xs text-gray-400 mb-1">Lens</p>
        <div className="flex gap-1">
          {LENS_OPTIONS.map(({ label, value }) => (
            <button
              key={value}
              disabled={disabled || isPending}
              onClick={() => handleLensChange(value)}
              className={cn(
                "px-2 py-1 text-xs rounded font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed",
                lens === value
                  ? "bg-blue-600 text-white"
                  : "bg-slate-700 text-gray-300 hover:bg-slate-600"
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Quality selector */}
      <div>
        <p className="text-xs text-gray-400 mb-1">Quality</p>
        <div className="flex gap-1">
          {QUALITY_OPTIONS.map(({ label, value }) => (
            <button
              key={value}
              disabled={disabled || isPending}
              onClick={() => handleQualityChange(value)}
              className={cn(
                "px-2 py-1 text-xs rounded font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed",
                quality === value
                  ? "bg-purple-600 text-white"
                  : "bg-slate-700 text-gray-300 hover:bg-slate-600"
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Start / Stop */}
      <div className="ml-auto">
        <p className="text-xs text-gray-400 mb-1">Stream Control</p>
        {isStreaming ? (
          <button
            disabled={disabled || isPending}
            onClick={handleStop}
            className="px-4 py-1 text-xs rounded font-medium bg-red-600 text-white hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {stopMutation.isPending ? "Stopping…" : "Stop Stream"}
          </button>
        ) : (
          <button
            disabled={disabled || isPending}
            onClick={handleStart}
            className="px-4 py-1 text-xs rounded font-medium bg-green-600 text-white hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {startMutation.isPending ? "Starting…" : "Start Stream"}
          </button>
        )}
      </div>
    </div>
  );
}
