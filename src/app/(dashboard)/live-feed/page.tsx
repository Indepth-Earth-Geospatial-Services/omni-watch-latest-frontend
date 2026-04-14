"use client";

import { WebRTCStreamCard } from "@/components/features/streams/webrtc-stream-card";
import { WebRTCStreamCardFullScreen } from "@/components/features/streams/webrtc-stream-card-full-screen";
import { MainLayout } from "@/components/layout/main-layout";
import Modal from "@/components/Modal";
import { WebRTCStream } from "@/config/webrtc-streams";
import { useDronesWebSocket } from "@/hooks/useDronesWebSocket";
import { RegisterDeviceModal } from "@/components/features/devices/RegisterDeviceModal";
import { EditDeviceModal } from "@/components/features/devices/EditDeviceModal";
import { DroneAPIResponse } from "@/services/api/drone-api";
import React, { useState, useMemo } from "react";

export const dynamic = "force-dynamic";

export default function LiveFeedsPage() {
  const [selectedStream, setSelectedStream] = useState<WebRTCStream | null>(
    null
  );
  const [selectedMediaStream, setSelectedMediaStream] = useState<MediaStream | null>(
    null
  );
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedFeedType, setSelectedFeedType] = useState<
    "ALL" | "DRONE" | "CCTV" | "BODY CAM"
  >("ALL");
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeviceSelector, setShowDeviceSelector] = useState(false);
  const [deviceToEdit, setDeviceToEdit] = useState<DroneAPIResponse | null>(null);

  // Get all streams from database with WebSocket real-time updates
  const { drones: allStreams = [], isLoading, error, isConnected, refresh, getRawDrone } = useDronesWebSocket();

  // Helper to open edit modal with a specific stream
  const handleEditDevice = (streamId: string) => {
    // Get full drone data from cache (NO API CALL!)
    const droneData = getRawDrone(streamId);
    if (droneData) {
      setDeviceToEdit(droneData);
      setShowEditModal(true);
    } else {
      console.error('Drone data not found in cache:', streamId);
    }
  };

  // Debug logging
  console.log("All streams from DB:", allStreams);
  console.log("All streams length:", allStreams.length);
  console.log("Loading:", isLoading);
  console.log("Error:", error);

  // Filter streams based on search and feed type
  const filteredStreams = useMemo(() => {
    let streams = allStreams;

    // Filter by feed type
    if (selectedFeedType !== "ALL") {
      streams = streams.filter((stream: WebRTCStream) => stream.feedType === selectedFeedType);
    }

    // Apply search filter
    if (searchTerm && searchTerm.trim() !== "") {
      const searchLower = searchTerm.toLowerCase().trim();
      streams = streams.filter(
        (stream: WebRTCStream) =>
          stream.name.toLowerCase().includes(searchLower) ||
          stream.id.toLowerCase().includes(searchLower) ||
          stream.feedType.toLowerCase().includes(searchLower) ||
          stream.metadata?.location?.toLowerCase().includes(searchLower) ||
          stream.metadata?.description?.toLowerCase().includes(searchLower)
      );
    }

    console.log("Filtered streams:", streams);
    console.log("Filtered streams length:", streams.length);
    return streams;
  }, [allStreams, searchTerm, selectedFeedType]);

  // Calculate stream statistics
  const activeStreams = allStreams.filter((s) => s.isOnline).length;
  const totalStreams = allStreams.length;

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const handleFeedTypeChange = (
    feedType: "ALL" | "DRONE" | "CCTV" | "BODY CAM"
  ) => {
    setSelectedFeedType(feedType);
  };

  const handleStreamCardClick = (stream: WebRTCStream, mediaStream: MediaStream | null) => {
    setSelectedStream(stream);
    setSelectedMediaStream(mediaStream);
  };

  return (
    <div className="bg-background text-foreground min-h-screen">
      <MainLayout title="Live Feeds" subtitle="">
        {/* Loading State */}
        {isLoading && (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
            <p className="text-gray-400 mt-4">Loading streams from database...</p>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-red-900/20 border border-red-500 rounded-lg p-4 mb-6">
            <p className="text-red-400">Failed to load streams: {error.message}</p>
            <button
              onClick={() => refresh()}
              className="mt-2 px-4 py-2 bg-red-600 hover:bg-red-700 rounded text-sm"
            >
              Retry
            </button>
          </div>
        )}

        {/* WebSocket Connection Status */}
        {!isConnected && !isLoading && (
          <div className="bg-yellow-900/20 border border-yellow-500 rounded-lg p-3 mb-6 flex items-center">
            <i className="fas fa-exclamation-triangle text-yellow-400 mr-3"></i>
            <p className="text-yellow-400 text-sm">Disconnected from real-time updates. Attempting to reconnect...</p>
          </div>
        )}

        {/* Search and Filters */}
        {!isLoading && (
          <div className="mb-6 space-y-4">
          <div className="flex flex-col md:flex-row md:items-center md:space-x-4 space-y-4 md:space-y-0">
            {/* Search Input Section */}
            <div className="flex-1 flex items-center p-3 space-x-2 bg-input rounded-lg focus-within:ring-2 focus-within:ring-blue-500">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
              <input
                type="text"
                placeholder="Search feeds..."
                value={searchTerm}
                onChange={handleSearchChange}
                className="flex-1 text-sm text-gray-300 placeholder-gray-500 bg-transparent outline-none border-none"
              />
            </div>

            {/* Feed Type Dropdown */}
            <div className="relative w-full md:w-48 group">
              <div className="flex items-center justify-between p-3 bg-input rounded-lg text-sm text-muted-foreground cursor-pointer hover:bg-accent transition">
                <span>Feed Type - {selectedFeedType}</span>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 text-gray-400 transform group-hover:rotate-180 transition-transform"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="absolute mt-0.2 w-full md:w-48 bg-card border border-gray-700 rounded-lg shadow-xl z-10 hidden group-hover:block transition-opacity duration-300 ease-in-out opacity-0 group-hover:opacity-100">
                <button
                  onClick={() => handleFeedTypeChange("ALL")}
                  className="block w-full text-left p-3 text-sm text-gray-300 hover:bg-black rounded-lg transition"
                >
                  ALL
                </button>
                <button
                  onClick={() => handleFeedTypeChange("DRONE")}
                  className="block w-full text-left p-3 text-sm text-gray-300 hover:bg-black rounded-lg transition"
                >
                  DRONE
                </button>
                <button
                  onClick={() => handleFeedTypeChange("CCTV")}
                  className="block w-full text-left p-3 text-sm text-gray-300 hover:bg-black rounded-lg transition"
                >
                  CCTV
                </button>
                <button
                  onClick={() => handleFeedTypeChange("BODY CAM")}
                  className="block w-full text-left p-3 text-sm text-gray-300 hover:bg-black rounded-lg transition"
                >
                  BODY CAM
                </button>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-400">
                {activeStreams} / {totalStreams} Streams Online
              </span>
              {isConnected && (
                <span className="flex items-center text-xs text-green-400">
                  <span className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></span>
                  Live
                </span>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end space-x-3 mt-4">
            <button
              onClick={() => refresh()}
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg text-sm font-medium transition-colors flex items-center"
            >
              <i className="fas fa-sync mr-2"></i>
              Refresh
            </button>
            <div className="relative">
              <button
                onClick={() => setShowDeviceSelector(!showDeviceSelector)}
                className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg text-sm font-medium transition-colors flex items-center"
              >
                <i className="fas fa-edit mr-2"></i>
                Edit Device
                <i className={`fas fa-chevron-down ml-2 transition-transform ${showDeviceSelector ? 'rotate-180' : ''}`}></i>
              </button>

              {/* Device Selector Dropdown */}
              {showDeviceSelector && allStreams.length > 0 && (
                <div className="absolute top-full right-0 mt-2 w-64 bg-gray-800 border border-gray-700 rounded-lg shadow-xl z-50 max-h-96 overflow-y-auto">
                  <div className="p-2">
                    <p className="text-xs text-gray-400 px-2 py-1 mb-2">Select a device to edit:</p>
                    {allStreams.map((stream) => (
                      <button
                        key={stream.id}
                        onClick={() => {
                          handleEditDevice(stream.id);
                          setShowDeviceSelector(false);
                        }}
                        className="w-full text-left px-3 py-2 rounded hover:bg-gray-700 transition-colors text-sm"
                      >
                        <div className="flex items-center space-x-2">
                          <i className={`fas ${
                            stream.feedType === 'DRONE' ? 'fa-drone' :
                            stream.feedType === 'BODY CAM' ? 'fa-video' :
                            'fa-camera'
                          } text-blue-400`}></i>
                          <div className="flex-1">
                            <p className="text-white font-medium">{stream.metadata?.alias || stream.name}</p>
                            <p className="text-xs text-gray-400">{stream.id}</p>
                          </div>
                          {stream.isOnline && (
                            <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <button
              onClick={() => setShowRegisterModal(true)}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium transition-colors flex items-center"
            >
              <i className="fas fa-plus mr-2"></i>
              Register Device
            </button>
          </div>
        </div>
        )}

        {/* Main Content Area with Right Sidebar */}
        {!isLoading && (
        <div className="flex">
          {/* Stream Grid */}
          <main className="flex-1 pr-0">
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 max-w-7xl mx-auto">
              <Modal>
                {filteredStreams.length > 0 &&
                  filteredStreams.map((stream) => (
                    <React.Fragment key={stream.id}>
                      <Modal.Open name={`Stream-${stream.id}`}>
                        <div>
                          <WebRTCStreamCard
                            stream={stream}
                            onStreamClick={handleStreamCardClick}
                          />
                        </div>
                      </Modal.Open>
                      <Modal.Window
                        name={`Stream-${stream.id}`}
                        buttonX={true}
                      >
                        <WebRTCStreamCardFullScreen
                          stream={selectedStream || stream}
                          sharedMediaStream={selectedMediaStream}
                        />
                      </Modal.Window>
                    </React.Fragment>
                  ))}
              </Modal>

              {filteredStreams.length === 0 && allStreams.length === 0 && (
                <div className="col-span-full text-center py-12">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-700 flex items-center justify-center">
                    <i className="fas fa-video-slash text-gray-400 text-2xl"></i>
                  </div>
                  <p className="text-gray-400 text-lg font-medium">
                    No Device Connected
                  </p>
                  <p className="text-gray-500 text-sm mt-2">
                    Configure streams in webrtc-streams.ts
                  </p>
                  <p className="text-xs text-gray-600 mt-2">
                    Debug: allStreams={allStreams.length}, filtered={filteredStreams.length}
                  </p>
                </div>
              )}

              {filteredStreams.length === 0 && allStreams.length > 0 && (
                <div className="col-span-full text-center py-12">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-700 flex items-center justify-center">
                    <i className="fas fa-search text-gray-400 text-2xl"></i>
                  </div>
                  <p className="text-gray-400 text-lg font-medium">
                    No feeds match your search criteria
                  </p>
                  <p className="text-gray-500 text-sm mt-2">
                    Try adjusting your search or filter
                  </p>
                  <p className="text-xs text-gray-600 mt-2">
                    Debug: allStreams={allStreams.length}, filtered={filteredStreams.length}, type={selectedFeedType}
                  </p>
                </div>
              )}
            </div>
          </main>

          {/* Recent Incidents Sidebar */}
          <aside className="w-80 p-6 pl-0">
            <div className="bg-card p-5 shadow-md h-full overflow-y-auto scroll-thin">
              <h3 className="font-bold mb-4 flex items-center">
                <i className="fas fa-exclamation-circle text-red-400 mr-2"></i>{" "}
                Recent Incidents
              </h3>

              <div className="p-4 mb-3 bg-black border-l-4 border-red-500">
                <div className="flex justify-between items-center">
                  <h4 className="font-semibold text-sm">
                    Crowd formation detected
                  </h4>
                  <span className="bg-red-600 text-[10px] px-2 py-0.5 font-bold">
                    OPEN
                  </span>
                </div>
                <p className="text-gray-400 text-xs mt-1">
                  Large crowd gathering in market area. AI shows rapid growth.
                </p>
                <div className="text-gray-500 text-xs flex items-center mt-2 gap-2">
                  <i className="fas fa-clock"></i> 20d ago
                  <i className="fas fa-map-marker-alt"></i> Kurmi Market, Kano
                  <i className="fas fa-id-badge"></i> ID: ktxudzsv
                </div>
              </div>

              <div className="p-4 mb-3 bg-black border-l-4 border-green-500">
                <div className="flex justify-between items-center">
                  <h4 className="font-semibold text-sm">
                    Vehicle convoy anomaly
                  </h4>
                  <span className="bg-green-600 text-[10px] px-2 py-0.5 font-bold">
                    RESOLVED
                  </span>
                </div>
                <p className="text-gray-400 text-xs mt-1">
                  Detected unusual convoy on Lagos-Ibadan highway.
                </p>
                <div className="text-gray-500 text-xs flex items-center mt-2 gap-2">
                  <i className="fas fa-clock"></i> 20d ago
                  <i className="fas fa-road"></i> Lagos-Ibadan Expressway
                  <i className="fas fa-id-badge"></i> ID: zmdizjgn
                </div>
              </div>

              <div className="p-4 mb-3 bg-black border-l-4 border-yellow-400">
                <div className="flex justify-between items-center">
                  <h4 className="font-semibold text-sm">
                    Pipeline corridor intrusion
                  </h4>
                  <span className="bg-yellow-500 text-[10px] px-2 py-0.5 font-bold">
                    IN PROGRESS
                  </span>
                </div>
                <p className="text-gray-400 text-xs mt-1">
                  Individuals walking close to restricted pipeline perimeter.
                </p>
                <div className="text-gray-500 text-xs flex items-center mt-2 gap-2">
                  <i className="fas fa-clock"></i> 20d ago
                  <i className="fas fa-map-marker-alt"></i> Lagos-Kano Pipeline
                  <i className="fas fa-id-badge"></i> ID: alx0f0hb
                </div>
              </div>

              <div className="p-4 mb-3 bg-black border-l-4 border-blue-500">
                <div className="flex justify-between items-center">
                  <h4 className="font-semibold text-sm">
                    Unauthorized drone activity
                  </h4>
                  <span className="bg-blue-600 text-[10px] px-2 py-0.5 font-bold">
                    MONITORING
                  </span>
                </div>
                <p className="text-gray-400 text-xs mt-1">
                  Unregistered drone detected in restricted airspace.
                </p>
                <div className="text-gray-500 text-xs flex items-center mt-2 gap-2">
                  <i className="fas fa-clock"></i> 1h ago
                  <i className="fas fa-map-marker-alt"></i> Port Harcourt
                  Airport
                  <i className="fas fa-id-badge"></i> ID: ph2024001
                </div>
              </div>
            </div>
          </aside>
        </div>
        )}

        {/* Modals */}
        <RegisterDeviceModal
          isOpen={showRegisterModal}
          onClose={() => setShowRegisterModal(false)}
        />
        <EditDeviceModal
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          device={deviceToEdit}
        />
      </MainLayout>
    </div>
  );
}
