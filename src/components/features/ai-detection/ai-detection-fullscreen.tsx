"use client";

import React, { memo } from "react";
import { cn } from "@/lib/utils";
import { CanvasVideoPlayer, CanvasVideoPlayerRef } from "./canvas-video-player";

interface AIDetectionFullscreenProps {
  feedStatus: string;
  fps: number;
  feedInfo: string;
  canvasRef: React.RefObject<CanvasVideoPlayerRef>;
}

export const AIDetectionFullscreen = memo(
  function AIDetectionFullscreen({
    feedStatus,
    fps,
    feedInfo,
    canvasRef,
  }: AIDetectionFullscreenProps) {
    const isConnected = feedStatus === "CONNECTED";

    return (
      <div className="w-[90dvw] h-[85dvh]   bg-black flex flex-col">
        {/* Header */}
        <div className="bg-card border-b border-gray-800 p-4 flex items-center justify-around flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <i className="fas fa-brain text-purple-500 text-xl"></i>
              <h2 className="text-xl font-bold text-foreground">
                YOLO Detection Stream
              </h2>
            </div>
            <span
              className={cn(
                "px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1",
                isConnected ? "bg-green-500" : "bg-red-500"
              )}
            >
              {isConnected && (
                <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
              )}
              {feedStatus}
            </span>
          </div>

          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <i className="fas fa-tachometer-alt text-blue-400"></i>
              <span>{fps} FPS</span>
            </div>
            <div className="flex items-center gap-2">
              <i className="fas fa-info-circle text-gray-400"></i>
              <span>{feedInfo}</span>
            </div>
          </div>
        </div>

        {/* Video Container - Fullscreen */}
        <div className="flex-1 relative bg-black flex items-center justify-center min-h-0">
          <CanvasVideoPlayer
            ref={canvasRef}
            isConnected={isConnected}
            feedStatus={feedStatus}
          />

          {!isConnected && (
            <div className="absolute inset-0 flex items-center justify-center text-center bg-black">
              <div>
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-500 bg-opacity-20 flex items-center justify-center">
                  <div className="w-4 h-4 bg-gray-500 rounded-full animate-pulse"></div>
                </div>
                <p className="text-gray-400 font-medium text-lg">
                  {feedStatus}
                </p>
                <p className="text-gray-500 text-sm mt-2">{feedInfo}</p>
              </div>
            </div>
          )}

          {/* Overlay info */}
          {isConnected && (
            <>
              <div className="absolute top-4 left-4 bg-black bg-opacity-70 text-white px-3 py-2 rounded text-sm z-10">
                <div className="flex items-center gap-2">
                  <i className="fas fa-video text-blue-400"></i>
                  <span>Live Detection Stream</span>
                </div>
              </div>

              <div className="absolute top-4 right-4 bg-black bg-opacity-70 text-white px-3 py-2 rounded text-sm font-mono z-10">
                {fps} FPS
              </div>
            </>
          )}
        </div>

        {/* Controls Footer */}
        <div className="bg-card border-t border-gray-800 p-4 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded text-sm transition-colors">
                <i className="fas fa-download mr-2"></i>
                Screenshot
              </button>
              <button className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded text-sm transition-colors">
                <i className="fas fa-record-vinyl mr-2"></i>
                Record
              </button>
            </div>

            <div className="text-xs text-muted-foreground">
              <i className="fas fa-server mr-2"></i>
              ws://192.168.1.54:6060/ws
            </div>
          </div>
        </div>
      </div>
    );
  },
  (prevProps, nextProps) => {
    // Only re-render if these props have actually changed (imageRef is stable)
    return (
      prevProps.feedStatus === nextProps.feedStatus &&
      prevProps.fps === nextProps.fps &&
      prevProps.feedInfo === nextProps.feedInfo
    );
  }
);
