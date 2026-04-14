// WebRTC Stream Configuration
// This file now uses the database as the source of truth
// Streams are fetched from the drone management API

export interface WebRTCStream {
  id: string;
  name: string;
  streamUrl: string; // WebRTC stream URL (e.g., ws://localhost:6080/sn)
  isOnline: boolean;
  feedType: "DRONE" | "CCTV" | "BODY CAM";
  startai?: boolean; // Enable AI detection for this stream
  metadata?: {
    alias: string;
    location?: string;
    description?: string;
    aiStreamUrl?: string; // AI detection stream URL (e.g., ws://localhost:6080/sn/ai)
    webRTCUrl?: string; // HTTP WebRTC URL
    [key: string]: any;
  };
}

// DEPRECATED: Static configuration - kept for backward compatibility
// Use useDrones() hook from '@/hooks/useDrones' instead for live database data
export const webrtcStreams: WebRTCStream[] = [
  {
    id: "1581F5FJD238900D79WS",
    name: "DJI Mavic 3T",
    streamUrl: process.env.NEXT_PUBLIC_WEBRTC_STREAM_1_URL || "",
    isOnline: true,
    feedType: "DRONE",
    startai: true,
    metadata: {
      alias: "Surveillance Drone 1",
      location: "Lagos Pipeline Corridor",
      description: "Main surveillance drone",
    },
  },
  // {
  //   id: "1581F5FKC249B00DNL4D",
  //   name: "DJI Matrice 350",
  //   streamUrl: "ws://192.168.1.54:6080/ws-clean",
  //   isOnline: true,
  //   feedType: "DRONE",
  //   startai: false,
  //   metadata: {
      // alias: "Surveillance Drone 2",
  //     location: "Kurmi Market, Kano",
  //     description: "Market entrance camera",
  //   },
  // },
    {
    id: "1581F6GKB23B4004008E",
    name: "DJI Mavic 3M",
    streamUrl: process.env.NEXT_PUBLIC_WEBRTC_STREAM_2_URL || "",
    isOnline: true,
    feedType: "DRONE",
    startai: true,
    metadata: {
       alias: "Surveillance Drone 3",
      location: "Kurmi Market, Kano",
      description: "Market entrance camera",
    },
  },
  {
    id: "bodycam-001",
    name: "Officer John Doe",
    streamUrl: process.env.NEXT_PUBLIC_WEBRTC_STREAM_3_URL || "",
    isOnline: true,
    feedType: "BODY CAM",
    startai: true,
    metadata: {
      alias: "Surveillance Drone 4",
      location: "Port Harcourt Airport",
      description: "Perimeter surveillance",
    },
  },
];

// Function to get all streams
export function getAllStreams(): WebRTCStream[] {
  return webrtcStreams;
}

// Function to get streams by status
export function getStreamsByStatus(isOnline: boolean): WebRTCStream[] {
  return webrtcStreams.filter((stream) => stream.isOnline === isOnline);
}


// Function to get streams by feed type
export function getStreamsByFeedType(
  feedType: WebRTCStream["feedType"] | "ALL"
): WebRTCStream[] {
  if (feedType === "ALL") {
    return webrtcStreams;
  }
  return webrtcStreams.filter((stream) => stream.feedType === feedType);
}

// Function to get a specific stream by ID
export function getStreamById(id: string): WebRTCStream | undefined {
  return webrtcStreams.find((stream) => stream.id === id);
}

// Function to get streams with AI detection enabled
export function getAIEnabledStreams(): WebRTCStream[] {
  return webrtcStreams.filter((stream) => stream.startai === true);
}
