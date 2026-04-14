"use client";

import React, { memo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { CanvasVideoPlayer, CanvasVideoPlayerRef } from "./canvas-video-player";

interface AIDetectionCardProps {
  feedStatus: string;
  fps: number;
  totalDetections: number;
  canvasRef: React.RefObject<CanvasVideoPlayerRef>;
  onClick?: () => void;
  className?: string;
}

export const AIDetectionCard = memo(function AIDetectionCard({
  feedStatus,
  fps,
  totalDetections,
  canvasRef,
  onClick,
  className,
}: AIDetectionCardProps) {
  const isConnected = feedStatus === "CONNECTED";
  const statusColor = isConnected ? "green" : feedStatus === "ERROR" ? "red" : "gray";
  const statusText = isConnected ? "LIVE" : feedStatus;

  return (
    <Card
      className={cn(
        "ai-detection-card cursor-pointer overflow-hidden transition-all hover:shadow-lg hover:scale-[1.02]",
        className
      )}
      onClick={onClick}
    >
      <div className="relative">
        {/* Video Container */}
        <div className="bg-black aspect-video relative flex items-center justify-center overflow-hidden">
          <CanvasVideoPlayer
            ref={canvasRef}
            isConnected={isConnected}
            feedStatus={feedStatus}
          />

          {!isConnected && (
            <div className="absolute inset-0 flex items-center justify-center text-center z-20">
              <div>
                <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-gray-500 bg-opacity-20 flex items-center justify-center">
                  <div className={cn(
                    "w-3 h-3 rounded-full",
                    statusColor === "gray" ? "bg-gray-500 animate-pulse" : "bg-red-500"
                  )}></div>
                </div>
                <p className="text-muted-foreground font-medium">{statusText}</p>
                <p className="text-muted-foreground text-sm mt-1">
                  {statusColor === "gray" ? "Connecting to stream..." : "Connection failed"}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Status Chip */}
        <div className="absolute top-3 left-3 z-30">
          <span
            className={cn(
              "px-2 py-1 rounded text-xs font-medium text-white flex items-center gap-1",
              statusColor === "green" ? "bg-green-500" :
              statusColor === "red" ? "bg-red-500" : "bg-gray-500"
            )}
          >
            {isConnected && <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>}
            {statusText}
          </span>
        </div>

        {/* FPS Badge */}
        {isConnected && (
          <div className="absolute top-3 right-3 z-30">
            <span className="bg-black bg-opacity-70 text-white px-2 py-1 rounded text-xs font-medium">
              {fps} FPS
            </span>
          </div>
        )}

        {/* Detection Badge */}
        {isConnected && totalDetections > 0 && (
          <div className="absolute bottom-3 left-3 z-30">
            <span className="bg-purple-600 bg-opacity-90 text-white px-2 py-1 rounded text-xs font-bold flex items-center gap-1">
              <i className="fas fa-brain"></i>
              {totalDetections} detections
            </span>
          </div>
        )}

        {/* Click to expand hint */}
        <div className="absolute bottom-3 right-3 z-30 opacity-0 group-hover:opacity-100 transition-opacity">
          <span className="bg-black bg-opacity-70 text-white px-2 py-1 rounded text-xs">
            Click to expand
          </span>
        </div>
      </div>

      {/* Info Section */}
      <CardContent className="p-4 bg-background">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-semibold text-lg text-foreground flex items-center gap-2">
            <i className="fas fa-eye text-blue-500"></i>
            YOLO Detection Stream
          </h3>
        </div>

        <div className="space-y-2">
          {/* Status */}
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Status:</span>
            <span className={cn(
              "font-medium text-xs",
              isConnected ? "text-green-400" : "text-red-400"
            )}>
              {isConnected ? "Active" : "Disconnected"}
            </span>
          </div>

          {/* FPS */}
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Frame Rate:</span>
            <span className="text-xs font-medium">{fps} FPS</span>
          </div>

          {/* Total Detections */}
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Total Detections:</span>
            <span className="text-xs font-medium text-purple-400">{totalDetections}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}, (prevProps, nextProps) => {
  // Only re-render if these props have actually changed (imageRef is stable)
  return (
    prevProps.feedStatus === nextProps.feedStatus &&
    prevProps.fps === nextProps.fps &&
    prevProps.totalDetections === nextProps.totalDetections
  );
});
