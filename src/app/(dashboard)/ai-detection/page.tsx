"use client";

import React, { useState, useMemo } from "react";
import { MainLayout } from "@/components/layout/main-layout";
import { StatCard } from "@/components/features/metrics/stat-card";
import Modal from "@/components/Modal";
import { useDetections } from "@/hooks/useDetections";
import { WebRTCStream } from "@/config/webrtc-streams";
import { useAIDronesWebSocket } from "@/hooks/useDronesWebSocket";
import { WebRTCStreamCard } from "@/components/features/streams/webrtc-stream-card";
import { WebRTCStreamCardFullScreen } from "@/components/features/streams/webrtc-stream-card-full-screen";

const DETECTION_SOCKET_URL = process.env.NEXT_PUBLIC_DETECTION_SOCKET_URL || "";

// Component for each AI detection stream (now using WebRTC like live-feed)
function AIStreamCard({ stream }: { stream: WebRTCStream }) {
  const [selectedMediaStream, setSelectedMediaStream] = useState<MediaStream | null>(null);

  // Use AI stream URL from metadata (e.g., ws://localhost:6080/1581F5FJD238900D79WS/ai)
  const aiStreamUrl = stream.metadata?.aiStreamUrl || stream.streamUrl;

  // Create a modified stream with AI detection URL
  const aiStream: WebRTCStream = {
    ...stream,
    streamUrl: aiStreamUrl,
  };

  const handleStreamClick = (_stream: WebRTCStream, mediaStream: MediaStream | null) => {
    setSelectedMediaStream(mediaStream);
  };

  return (
    <>
      <Modal.Open name={`ai-detection-${stream.id}`}>
        <div>
          <WebRTCStreamCard stream={aiStream} onStreamClick={handleStreamClick} />
        </div>
      </Modal.Open>
      <Modal.Window name={`ai-detection-${stream.id}`} buttonX={true}>
        <WebRTCStreamCardFullScreen
          stream={aiStream}
          sharedMediaStream={selectedMediaStream}
        />
      </Modal.Window>
    </>
  );
}

export default function AIDetectionPage() {
  // Get all streams from database with AI detection enabled and WebSocket real-time updates
  const { drones: aiEnabledStreams = [], isLoading, error, isConnected: isDronesConnected } = useAIDronesWebSocket();

  // Use custom hook for detection events (global stats)
  const { stats: surveillanceData, detectionLog, recentDetections, isConnected } = useDetections({
    url: DETECTION_SOCKET_URL,
  });

  const getResponseTime = useMemo(() => {
    if (surveillanceData.lastDetectionTime) {
      const secondsAgo = Math.floor(
        (Date.now() - surveillanceData.lastDetectionTime) / 1000
      );
      return `${secondsAgo}s`;
    }
    return "0s";
  }, [surveillanceData.lastDetectionTime]);

  return (
    <div className="bg-background text-foreground min-h-screen">
      <MainLayout title="AI Detection" subtitle="">
        {/* Loading State */}
        {isLoading && (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto"></div>
            <p className="text-gray-400 mt-4">Loading AI streams from database...</p>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-red-900/20 border border-red-500 rounded-lg p-4 mb-6">
            <p className="text-red-400">Failed to load streams: {error.message}</p>
          </div>
        )}

        {/* WebSocket Connection Status */}
        {!isDronesConnected && !isLoading && (
          <div className="bg-yellow-900/20 border border-yellow-500 rounded-lg p-3 mb-6 flex items-center">
            <i className="fas fa-exclamation-triangle text-yellow-400 mr-3"></i>
            <p className="text-yellow-400 text-sm">Disconnected from real-time drone updates. Attempting to reconnect...</p>
          </div>
        )}

        {!isLoading && (
        <div className="space-y-6">
          {/* Action Buttons */}
          <div className="flex items-center justify-end space-x-3">
            <button className="px-3 py-2 text-sm border border-gray-600 rounded-md hover:bg-graybg transition-colors">
              <i className="fas fa-cog mr-2"></i>Model Settings
            </button>
            <button className="px-3 py-2 text-sm border border-gray-600 rounded-md hover:bg-graybg transition-colors">
              <i className="fas fa-save mr-2"></i>Export Detections
            </button>
          </div>

          {/* AI Performance Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-6 gap-6">
            <StatCard
              title="Total Detections"
              value={surveillanceData.totalDetections.toLocaleString()}
              icon="fas fa-brain"
              color="purple"
            />

            <StatCard
              title="Persons"
              value={surveillanceData.personDetections}
              icon="fas fa-user"
              color="red"
            />

            <StatCard
              title="Vehicles"
              value={surveillanceData.vehicleDetections}
              icon="fas fa-car"
              color="orange"
            />

            <StatCard
              title="Objects"
              value={surveillanceData.objectDetections}
              icon="fas fa-box"
              color="yellow"
            />

            <StatCard
              title="Avg Confidence"
              value={`${surveillanceData.avgConfidence.toFixed(1)}%`}
              icon="fas fa-percentage"
              color="blue"
            />

            <StatCard
              title="Last Detection"
              value={getResponseTime}
              icon="fas fa-clock"
              color="green"
            />
          </div>

          {/* AI Model Status */}
          <div className="bg-card p-4 rounded-lg border border-gray-800">
            <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-4 sm:space-y-0 sm:space-x-6">
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <div
                    className={`w-3 h-3 rounded-full ${
                      aiEnabledStreams.length > 0 ? "bg-green-500 animate-pulse" : "bg-gray-500"
                    }`}
                  ></div>
                  <span className="text-sm font-medium text-gray-300">
                    AI Detection {aiEnabledStreams.length > 0 ? "Active" : "Inactive"}
                  </span>
                </div>
                <div className="text-sm text-gray-400">
                  <span>YOLO Detection | {aiEnabledStreams.length} Stream{aiEnabledStreams.length !== 1 ? 's' : ''} | Confidence: 0.7</span>
                </div>
              </div>
              <div className="flex items-center space-x-4 ml-auto">
                <div className="flex items-center space-x-2">
                  <div
                    className={`w-2 h-2 rounded-full ${
                      isDronesConnected ? "bg-green-500" : "bg-red-500"
                    }`}
                  ></div>
                  <span className="text-xs text-gray-400">
                    Drone Updates {isDronesConnected ? "Live" : "Offline"}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <div
                    className={`w-2 h-2 rounded-full ${
                      isConnected ? "bg-green-500" : "bg-red-500"
                    }`}
                  ></div>
                  <span className="text-xs text-gray-400">
                    Detection Server {isConnected ? "Connected" : "Disconnected"}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Live Feed Grid with AI Detection */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            <Modal>
              {aiEnabledStreams.length > 0 ? (
                aiEnabledStreams.map((stream) => (
                  <AIStreamCard key={stream.id} stream={stream} />
                ))
              ) : (
                <div className="col-span-full text-center py-12">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-700 flex items-center justify-center">
                    <i className="fas fa-brain text-gray-400 text-2xl"></i>
                  </div>
                  <p className="text-gray-400 text-lg font-medium">
                    No AI Detection Streams Configured
                  </p>
                  <p className="text-gray-500 text-sm mt-2">
                    Enable AI detection for streams in webrtc-streams.ts by setting startai: true
                  </p>
                </div>
              )}
            </Modal>
          </div>

          {/* Recent Detection Images */}
          <div className="bg-card rounded-lg border border-gray-800">
            <div className="p-4 border-b border-gray-800">
              <h3 className="text-lg font-semibold flex items-center">
                <i className="fas fa-images text-purple-500 mr-2"></i>
                <span>Recent Detection Images</span>
                <span className="ml-auto text-xs text-gray-400">
                  {recentDetections.length} detections
                </span>
              </h3>
            </div>

            <div className="p-4">
              {recentDetections.length === 0 ? (
                <div className="text-center text-gray-400 py-8">
                  No detection images yet
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                  {recentDetections.slice(0, 12).map((detection) => (
                    <div
                      key={detection.id}
                      className="relative group bg-graybg rounded-lg overflow-hidden border border-gray-700 hover:border-gray-500 transition-all cursor-pointer"
                    >
                      <div className="aspect-square relative">
                        <img
                          src={`data:image/jpeg;base64,${detection.frame_base64}`}
                          alt={`${detection.object_class} detection`}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                          <div className="absolute bottom-0 left-0 right-0 p-2">
                            <p className="text-xs font-medium text-white truncate">
                              {detection.object_class}
                            </p>
                            <p className="text-xs text-gray-300">
                              {(detection.confidence * 100).toFixed(0)}% • ID:{detection.track_id}
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="absolute top-2 right-2 px-2 py-1 bg-black/60 rounded text-xs text-white">
                        {detection.device_name}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Recent Detections Log */}
          <div className="bg-card rounded-lg border border-gray-800">
            <div className="p-4 border-b border-gray-800">
              <h3 className="text-lg font-semibold flex items-center">
                <i className="fas fa-list-alt text-green-500 mr-2"></i>
                <span>Detection Activity Log</span>
              </h3>
            </div>

            <div className="p-4">
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {detectionLog.length === 0 ? (
                  <div className="text-center text-gray-400 py-8">
                    No detections yet
                  </div>
                ) : (
                  detectionLog.map((detection, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 bg-graybg rounded-lg"
                    >
                      <div className="flex items-center space-x-3">
                        <div
                          className={`w-2 h-2 ${detection.color} rounded-full ${
                            detection.active ? "animate-pulse" : ""
                          }`}
                        ></div>
                        <div>
                          <p
                            className={`text-sm font-medium ${
                              detection.color.includes("red")
                                ? "text-red-400"
                                : detection.color.includes("orange")
                                ? "text-orange-400"
                                : detection.color.includes("blue")
                                ? "text-blue-400"
                                : "text-green-400"
                            }`}
                          >
                            {detection.type}
                          </p>
                          <p className="text-xs text-gray-400">
                            {detection.source}
                          </p>
                        </div>
                      </div>
                      <span className="text-xs text-gray-500">
                        {detection.time}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
        )}
      </MainLayout>
    </div>
  );
}
