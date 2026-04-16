"use client";

import { WebRTCStream } from "@/config/webrtc-streams";
import { useWebRTCStream } from "@/hooks/use-webrtc-stream";
import { cn } from "@/lib/utils";
import { StreamControlPanel } from "./StreamControlPanel";

interface WebRTCStreamCardFullScreenProps {
  stream: WebRTCStream;
  sharedMediaStream?: MediaStream | null;
}

export function WebRTCStreamCardFullScreen({
  stream,
  sharedMediaStream,
}: WebRTCStreamCardFullScreenProps) {
  // If we have a shared stream, use it directly; otherwise create new connection
  const shouldCreateNewConnection = !sharedMediaStream;

  const { videoRef, isConnected, isLoading, loadingMessage, error } = useWebRTCStream({
    streamUrl: stream.streamUrl,
    isOnline: shouldCreateNewConnection ? stream.isOnline : false, // Don't connect if using shared stream
    autoPlay: true,
  });

  // Use shared stream if available
  const videoRefCallback = (element: HTMLVideoElement | null) => {
    if (element) {
      if (sharedMediaStream) {
        element.srcObject = sharedMediaStream;
        element.play().catch((err) => console.error("Autoplay failed:", err));
      } else if (videoRef.current !== element) {
        // @ts-ignore - assign the element to the ref
        videoRef.current = element;
      }
    }
  };

  const displayIsConnected = sharedMediaStream ? true : isConnected;
  const displayIsLoading = sharedMediaStream ? false : isLoading;
  const displayError = sharedMediaStream ? null : error;

  const renderVideoContent = () => {
    // Stream is offline
    if (!stream.isOnline) {
      return (
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-500 bg-opacity-20 flex items-center justify-center">
            <div className="w-4 h-4 bg-red-500 rounded-full"></div>
          </div>
          <p className="text-red-400 font-medium text-lg">Stream Offline</p>
          <p className="text-muted-foreground text-sm mt-2">
            Connection unavailable
          </p>
        </div>
      );
    }

    // Stream is online but loading
    if (displayIsLoading) {
      return (
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-orange-500 bg-opacity-20 flex items-center justify-center">
            <div className="w-4 h-4 bg-orange-500 rounded-full animate-pulse"></div>
          </div>
          <p className="text-orange-400 font-medium text-lg loading-text">
            <span className="inline-block">{loadingMessage}</span>
          </p>
          <p className="text-muted-foreground text-sm mt-2">
            Please wait
          </p>
        </div>
      );
    }

    // Stream has error
    if (displayError) {
      return (
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-yellow-500 bg-opacity-20 flex items-center justify-center">
            <i className="fas fa-exclamation-triangle text-yellow-500 text-2xl"></i>
          </div>
          <p className="text-yellow-400 font-medium text-lg">Connection Error</p>
          <p className="text-muted-foreground text-sm mt-2">{displayError}</p>
        </div>
      );
    }

    // Stream is connected but waiting for video
    if (!displayIsConnected) {
      return (
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-500 bg-opacity-20 flex items-center justify-center">
            <div className="w-4 h-4 bg-green-500 rounded-full animate-pulse"></div>
          </div>
          <p className="text-green-400 font-medium text-lg">
            Waiting for stream...
          </p>
          <p className="text-muted-foreground text-sm mt-2">
            Connection established
          </p>
        </div>
      );
    }

    return null;
  };

  const isOnline = stream.isOnline;

  return (
    <div className="relative w-[90dvw] max-w-[1400px] h-[85dvh] bg-black rounded-lg overflow-hidden">
      {/* Video Area */}
      <div className="relative w-full h-[calc(100%-120px)]">
        {/* WebRTC Video Element */}
        <video
          ref={videoRefCallback}
          className={cn(
            "w-full h-full object-contain",
            !displayIsConnected && "hidden"
          )}
          autoPlay
          playsInline
          muted
          controls
        />

        {/* Overlay when not connected */}
        {!displayIsConnected && (
          <div className="absolute inset-0 flex items-center justify-center">
            {renderVideoContent()}
          </div>
        )}
      </div>

      {/* Info Panel at Bottom */}
      <div className="absolute bottom-0 left-0 right-0 bg-slate-900 bg-opacity-95 p-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {/* Stream Name & Status */}
          <div>
            <h3 className="text-lg font-bold text-white mb-1">
              {stream.name}
            </h3>
            <div className="flex items-center gap-2">
              <span
                className={cn(
                  "px-2 py-1 rounded text-xs font-medium text-white flex items-center gap-1",
                  isOnline ? "bg-green-500" : "bg-red-500"
                )}
              >
                {isOnline && (
                  <span className="w-2 h-2 bg-white rounded-full animate-pulse"></span>
                )}
                {isOnline ? "LIVE" : "OFFLINE"}
              </span>
              <span className="text-xs text-gray-400">ID: {stream.id}</span>
            </div>
          </div>

          {/* Feed Type */}
          <div>
            <p className="text-xs text-gray-400 mb-1">Feed Type</p>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-white bg-blue-500 px-3 py-1 rounded">
                {stream.feedType}
              </span>
            </div>
          </div>

          {/* Location */}
          {stream.metadata?.location && (
            <div>
              <p className="text-xs text-gray-400 mb-1">Location</p>
              <p className="text-sm font-medium text-white">
                <i className="fas fa-map-marker-alt mr-2"></i>
                {stream.metadata.location}
              </p>
            </div>
          )}

          {/* Description */}
          {stream.metadata?.description && (
            <div>
              <p className="text-xs text-gray-400 mb-1">Description</p>
              <p className="text-sm text-white">
                {stream.metadata.description}
              </p>
            </div>
          )}

          {/* Connection Status */}
          <div>
            <p className="text-xs text-gray-400 mb-1">Connection</p>
            <p
              className={cn(
                "text-sm font-medium",
                isConnected ? "text-green-400" : "text-gray-400"
              )}
            >
              {isConnected
                ? "Connected"
                : isLoading
                ? "Connecting..."
                : "Disconnected"}
            </p>
          </div>
        </div>

        {/* DJI stream controls — lens, quality, start/stop (hidden for non-DJI or non-DRONE) */}
        <StreamControlPanel stream={stream} />
      </div>
    </div>
  );
}
