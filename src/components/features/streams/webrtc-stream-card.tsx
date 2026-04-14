"use client";

import { Card, CardContent } from "@/components/ui/card";
import { WebRTCStream } from "@/config/webrtc-streams";
import { useWebRTCStream } from "@/hooks/use-webrtc-stream";
import { cn } from "@/lib/utils";

interface WebRTCStreamCardProps {
  stream: WebRTCStream;
  onStreamClick?: (stream: WebRTCStream, mediaStream: MediaStream | null) => void;
  className?: string;
}

export function WebRTCStreamCard({
  stream,
  onStreamClick,
  className,
}: WebRTCStreamCardProps) {
  // Use WebRTC hook to connect to stream - automatically connect when stream is online
  const { videoRef, isConnected, isLoading, loadingMessage, error, mediaStream } = useWebRTCStream({
    streamUrl: stream.streamUrl,
    isOnline: stream.isOnline, // Connect automatically if stream is online
    autoPlay: true,
  });

  const handleClick = () => {
    // Open fullscreen when clicked
    if (onStreamClick) {
      onStreamClick(stream, mediaStream);
    }
  };

  const renderVideoContent = () => {
    // Stream is offline
    if (!stream.isOnline) {
      return (
        <div className="text-center">
          <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-red-500 bg-opacity-20 flex items-center justify-center">
            <div className="w-3 h-3 bg-red-500 rounded-full"></div>
          </div>
          <p className="text-red-400 font-medium">Stream Offline</p>
          <p className="text-muted-foreground text-sm mt-1">
            Connection unavailable
          </p>
        </div>
      );
    }

    // Stream is online but loading
    if (isLoading) {
      return (
        <div className="text-center">
          <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-green-500 bg-opacity-20 flex items-center justify-center">
            <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
          </div>
          <p className="text-green-400 font-medium loading-text">
            <span className="inline-block">{loadingMessage}</span>
          </p>
          <p className="text-muted-foreground text-sm mt-1">
            Please wait
          </p>
        </div>
      );
    }

    // Stream has error
    if (error) {
      return (
        <div className="text-center">
          <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-yellow-500 bg-opacity-20 flex items-center justify-center">
            <i className="fas fa-exclamation-triangle text-yellow-500"></i>
          </div>
          <p className="text-yellow-400 font-medium">Connection Error</p>
          <p className="text-muted-foreground text-sm mt-1">{error}</p>
        </div>
      );
    }

    // Stream is connected but no video yet
    if (!isConnected) {
      return (
        <div className="text-center">
          <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-green-500 bg-opacity-20 flex items-center justify-center">
            <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
          </div>
          <p className="text-green-400 font-medium">Waiting for stream...</p>
          <p className="text-muted-foreground text-sm mt-1">
            Connection established
          </p>
        </div>
      );
    }

    return null; // Video will be displayed
  };

  const statusColor = stream.isOnline ? "green" : "red";
  const statusText = stream.isOnline ? "LIVE" : "OFFLINE";

  return (
    <Card
      className={cn(
        "stream-card cursor-pointer overflow-hidden transition-all hover:shadow-lg hover:border-blue-500",
        className
      )}
      onClick={handleClick}
      data-stream-id={stream.id}
    >
      <div className="relative">
        {/* Video Container */}
        <div className="bg-black aspect-video relative flex items-center justify-center overflow-hidden">
          {/* WebRTC Video Element */}
          <video
            ref={videoRef}
            className={cn(
              "w-full h-full object-cover",
              !isConnected && "hidden"
            )}
            autoPlay
            playsInline
            muted
          />

          {/* Overlay content when not playing */}
          {!isConnected && (
            <div className="absolute inset-0 flex items-center justify-center">
              {renderVideoContent()}
            </div>
          )}
        </div>

        {/* Status Chip */}
        <div className="absolute top-3 left-3">
          <span
            className={cn(
              "px-2 py-1 rounded text-xs font-medium text-white flex items-center gap-1",
              statusColor === "green" ? "bg-green-500" : "bg-red-500"
            )}
          >
            {statusColor === "green" && (
              <span className="w-2 h-2 bg-white rounded-full animate-pulse"></span>
            )}
            {statusText}
          </span>
        </div>

        {/* Stream Name Label */}
        <div className="absolute top-3 right-3">
          <span className="bg-black bg-opacity-70 text-white px-2 py-1 rounded text-xs font-medium">
            {stream.name}
          </span>
        </div>

        {/* Feed Type Badge */}
        <div className="absolute bottom-3 left-3">
          <span className="bg-blue-500 bg-opacity-90 text-white px-2 py-1 rounded text-xs font-medium">
            {stream.feedType}
          </span>
        </div>
      </div>

      {/* Info Section */}
      <CardContent className="p-4 bg-background">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-semibold text-lg text-foreground">
            {stream.name}
          </h3>
          <span
            className={cn(
              "text-xs px-2 py-0.5 rounded",
              stream.isOnline
                ? "bg-green-500/20 text-green-400"
                : "bg-red-500/20 text-red-400"
            )}
          >
            {stream.feedType}
          </span>
        </div>

        <div className="space-y-2">
          {/* Location */}
          {stream.metadata?.location && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground flex items-center gap-1">
                <i className="fas fa-map-marker-alt text-xs"></i>
                Location:
              </span>
              <span className="text-xs font-medium">
                {stream.metadata.location}
              </span>
            </div>
          )}


          {/* Stream ID */}
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground flex items-center gap-1">
              <i className="fas fa-fingerprint text-xs"></i>
              Stream ID:
            </span>
            <span className="text-xs font-mono">{stream.id}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
