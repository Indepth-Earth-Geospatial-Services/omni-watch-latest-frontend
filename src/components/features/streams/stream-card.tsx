"use client";

import { Card, CardContent } from "@/components/ui/card";
import { useAgoraStream } from "@/hooks/useAgoraStream";
import { useTelemetry } from "@/hooks/useTelemetry";
import { cn, formatCoordinates, getBatteryColor } from "@/lib/utils";
import { Drone } from "@/types";
import { IRemoteVideoTrack } from "agora-rtc-sdk-ng";
import { useEffect, useMemo, useRef, useImperativeHandle, forwardRef } from "react";
import { date } from "zod";

interface StreamCardProps {
  drone: Drone;
  onStreamClick?: (drone: Drone) => void;
  className?: string;
}

export interface StreamCardRef {
  replayVideo: () => void;
}

export const StreamCard = forwardRef<StreamCardRef, StreamCardProps>(({
  drone,
  onStreamClick,
  className,
}, ref) => {
  const videoRef = useRef<HTMLDivElement>(null);

  const { getProcessedDroneData } = useTelemetry();

  const telemetry = getProcessedDroneData(drone.droneSn || "")!;
  const battery = telemetry?.battery ?? 0;
  const latitude = telemetry?.latitude ?? 0;
  const longitude = telemetry?.longitude ?? 0;
  const altitude = telemetry?.altitude ?? 0;
  const direction = telemetry?.direction ?? "N/A";

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

  const isOnline = drone.status === true;
  const statusColor = isOnline ? "green" : "red";
  const statusText = isOnline ? "LIVE" : "OFFLINE";
  const batteryColor = getBatteryColor(battery);

  // Expose replay method to parent
  useImperativeHandle(ref, () => ({
    replayVideo: () => {
      if (videoTrackFromAgora && videoRef.current) {
        videoTrackFromAgora.play(videoRef.current);
      }
    }
  }));

  const handleClick = () => {
    if (onStreamClick) {
      onStreamClick(drone);
    }
  };

  const videoContent = useMemo(() => {
    if (isOnline && drone.hasToken) {
      return (
        <>
          <div ref={videoRef} className="size-full absolute inset-0 z-10" />
          {!videoTrackFromAgora && (
            <div className="text-center">
              <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-green-500 bg-opacity-20 flex items-center justify-center">
                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
              </div>
              <p className="text-green-400 font-medium">Connecting...</p>
              <p className="text-muted-foreground text-sm mt-1">
                Establishing stream
              </p>
            </div>
          )}
        </>
      );
    }

    return (
      <div className="text-center">
        <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-red-500 bg-opacity-20 flex items-center justify-center">
          <div className="status-dot status-offline"></div>
        </div>
        <p className="text-muted-foreground font-medium">Stream Offline</p>
        <p className="text-muted-foreground text-sm mt-1">
          Connection unavailable
        </p>
      </div>
    );
  }, [isOnline, drone.hasToken, videoTrackFromAgora]);

  useEffect(() => {
    if (videoTrackFromAgora && videoRef.current) {
      videoTrackFromAgora.play(videoRef.current);
    }

    //cleanup on unmount
    return () => {
      if (videoTrackFromAgora) {
        videoTrackFromAgora.stop();
        videoTrackFromAgora?.removeAllListeners?.();
      }
    };
  }, [videoTrackFromAgora]);
  return (
    <Card
      className={cn(
        "stream-card cursor-pointer overflow-hidden transition-all hover:shadow-lg",
        className
      )}
      onClick={handleClick}
      data-drone-id={drone.droneSn}
    >
      <div className="relative">
        {/* Video Container */}
        <div className="bg-black aspect-video relative flex items-center justify-center">
          {videoContent}
        </div>

        {/* Status Chip */}
        <div className="absolute top-3 left-3">
          <span
            className={cn(
              "px-2 py-1 rounded text-xs font-medium text-white",
              statusColor === "green" ? "bg-green-500" : "bg-red-500"
            )}
          >
            {statusText}
          </span>
        </div>

        {/* Drone Name Label */}
        <div className="absolute top-3 right-3">
          <span className="bg-black bg-opacity-70 text-white px-2 py-1 rounded text-xs font-medium">
            {drone.nickname}
          </span>
        </div>
      </div>

      {/* Info Section */}
      <CardContent className="p-4 bg-background">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-semibold text-lg text-foreground">
            {drone.nickname}
          </h3>
          <span className="text-xs text-muted-foreground">{direction}</span>
        </div>

        <div className="space-y-2">
          {/* Location */}
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Location:</span>
            <span className="font-mono text-xs">
              {formatCoordinates(latitude, longitude)}
            </span>
          </div>

          {/* Battery */}
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Battery:</span>
            <div className="flex items-center">
              <div className="battery-indicator">
                <div className="battery-bar">
                  <div
                    className={cn("battery-fill", batteryColor)}
                    style={{ width: `${battery}%` }}
                  ></div>
                </div>
                <span className="text-xs font-medium">{battery}%</span>
              </div>
            </div>
          </div>

          {/* Feed Type */}
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Drone Altitude:</span>
            <span className="text-xs font-medium">{`${altitude.toFixed(
              2
            )} m`}</span>{" "}
          </div>
        </div>
      </CardContent>
    </Card>
  );
});

StreamCard.displayName = "StreamCard";
