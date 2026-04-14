"use client";

import { useAgoraStream } from "@/hooks/useAgoraStream";
import { useTelemetry } from "@/hooks/useTelemetry";
import { cn, formatCoordinates, getBatteryColor } from "@/lib/utils";
import { Drone } from "@/types";
import { useEffect, useMemo, useRef } from "react";

function StreamCardFullScreen({ drone }: { drone: Drone }) {
  const videoRef = useRef<HTMLDivElement | null>(null);

  const { getProcessedDroneData } = useTelemetry();
  const telemetry = getProcessedDroneData(drone.droneSn || "");

  const agoraConfig = useMemo(
    () => ({
      appId: drone.appId || "",
      channel: drone.channel || drone.droneSn,
      token: drone.token || "",
    }),
    [drone.appId, drone.channel, drone.token, drone.droneSn]
  );

  const { videoTrack: videoTrackFromAgora, isConnected } =
    useAgoraStream(agoraConfig);

  const battery = telemetry?.battery ?? 0;
  const latitude = telemetry?.latitude ?? 0;
  const longitude = telemetry?.longitude ?? 0;
  const altitude = telemetry?.altitude ?? 0;
  const direction = telemetry?.direction ?? "N/A";
  const batteryColor = getBatteryColor(battery);
  const isOnline = drone.status === true;

  const videoContent = useMemo(() => {
    if (isOnline && drone.hasToken) {
      return (
        <>
          <div ref={videoRef} className="w-full h-full absolute inset-0" />
          {!videoTrackFromAgora && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-500 bg-opacity-20 flex items-center justify-center">
                  <div className="w-4 h-4 bg-green-500 rounded-full animate-pulse"></div>
                </div>
                <p className="text-green-400 font-medium text-lg">
                  Connecting...
                </p>
                <p className="text-muted-foreground text-sm mt-2">
                  Establishing stream
                </p>
              </div>
            </div>
          )}
        </>
      );
    }

    return (
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-500 bg-opacity-20 flex items-center justify-center">
            <div className="status-dot status-offline"></div>
          </div>
          <p className="text-muted-foreground font-medium text-lg">
            Stream Offline
          </p>
          <p className="text-muted-foreground text-sm mt-2">
            Connection unavailable
          </p>
        </div>
      </div>
    );
  }, [isOnline, drone.hasToken, videoTrackFromAgora]);

  useEffect(() => {
    if (videoTrackFromAgora && videoRef.current) {
      videoTrackFromAgora.play(videoRef.current);
    }

    return () => {
      if (videoTrackFromAgora) {
        videoTrackFromAgora.stop();
        videoTrackFromAgora?.removeAllListeners?.();
      }
    };
  }, [videoTrackFromAgora]);

  return (
    <div className="relative w-[85dvw] h-[85dvh] bg-black rounded-lg overflow-hidden">
      {/* Video Area */}
      <div className="relative w-full h-[calc(100%-120px)]">{videoContent}</div>

      {/* Info Panel at Bottom */}
      <div className="absolute bottom-0 left-0 right-0 bg-slate-900 bg-opacity-95 p-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {/* Drone Name & Status */}
          <div>
            <h3 className="text-lg font-bold text-white mb-1">
              {drone.nickname}
            </h3>
            <div className="flex items-center gap-2">
              <span
                className={cn(
                  "px-2 py-1 rounded text-xs font-medium text-white",
                  isOnline ? "bg-green-500" : "bg-red-500"
                )}
              >
                {isOnline ? "LIVE" : "OFFLINE"}
              </span>
              <span className="text-xs text-gray-400">
                SN: {drone.droneSn.slice(-8)}
              </span>
            </div>
          </div>

          {/* Battery */}
          <div>
            <p className="text-xs text-gray-400 mb-1">Battery</p>
            <div className="flex items-center gap-2">
              <div className="battery-indicator">
                <div className="battery-bar">
                  <div
                    className={cn("battery-fill", batteryColor)}
                    style={{ width: `${battery}%` }}
                  ></div>
                </div>
              </div>
              <span className="text-sm font-medium text-white">{battery}%</span>
            </div>
          </div>

          {/* Location */}
          <div>
            <p className="text-xs text-gray-400 mb-1">Location</p>
            <p className="text-sm font-mono text-white">
              {formatCoordinates(latitude, longitude)}
            </p>
          </div>

          {/* Altitude & Direction */}
          <div>
            <p className="text-xs text-gray-400 mb-1">Altitude</p>
            <p className="text-sm font-medium text-white">
              {altitude.toFixed(2)} m
            </p>
            <p className="text-xs text-gray-400 mt-1">
              Direction: <span className="text-white">{direction}</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default StreamCardFullScreen;
