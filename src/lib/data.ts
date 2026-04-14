import { DroneData, IncidentData } from '@/types'

export const feedData: DroneData[] = [
  {
    sn: "1581F5FJD238900D79WS",
    name: "Alpha-1",
    latitude: 40.7128,
    longitude: -74.0060,
    battery: 85,
    direction: "NE",
    status: "online",
    feedType: "DRONE",
    hasAgoraStream: true,
    appId: "08b35d883f6b439697f47a25ce621e24",
    token: "0068c28ebb0db53423fb293ef3cd97b8796IACs5XGl+LjfUQsaM/BON0xbZ4Z751ARIQ8ed4GkFTJ5+3aeOnIh39v0IgB6jvZG0tXXaAQAAQBSEf5oAgBSEf5oAwBSEf5oBABSEf5o",
    channel: "1581F5FJD238900D79WS",
    agoraChannel: "1581F5FJD238900D79WS"
  },
  {
    sn: "1581F6GKB23B4004008E",
    name: "Bravo-2",
    latitude: 34.0522,
    longitude: -118.2437, 
    battery: 67,
    direction: "SW",
    status: "online",
    feedType: "BODY CAM",
    hasAgoraStream: true,
    appId: "08b35d883f6b439697f47a25ce621e24",
    token: "0068c28ebb0db53423fb293ef3cd97b8796IABwgocLA7ZP5sdkpEd6huNq4co+BjxSs56xPPJwGxXFO0YUDk8h39v0IgB6jvZGq9nXaAQAAQArFf5oAgArFf5oAwArFf5oBAArFf5o",
    channel: "1581F6GKB23B4004008E",
    agoraChannel: "1581F6GKB23B4004008E"
  },
  {
    sn: "1581F7GKB23B4004008F",
    name: "Charlie-3",
    latitude: 34.0522,
    longitude: -118.2437,
    battery: 67,
    direction: "SW",
    status: "online",
    feedType: "CCTV",
    hasAgoraStream: true,
    appId: "631ce9ab63034612ab47acaf2167a80a",
    token: "007eJxTYNgj+Vny+dejj8wPRSTfytU96LHaukxxl7E7X7SNvEauyEwFBgtj46SkZCOj5ETzZJM00+SkVEtzk1SjNAsDiyTLFIPUc8dOZzQEMjKo5kxhYIRCEJ+LITkxV6G4pCg1MZeBAQD6YyFd",
    channel: "cam stream",
    agoraChannel: "cam stream"
  },
  {
    sn: "1584441F5FJD238900D79WS",
    name: "Delta-4",
    latitude: 40.7128,
    longitude: -74.0060,
    battery: 85,
    direction: "NE",
    status: "online",
    feedType: "DRONE",
    hasAgoraStream: true,
    appId: "833bbc22ca7c4f5cbe974e2f808b9d0e",
    token: "007eJxTYPimzF1cdS/919wv2RFst+ZXv135pGj61I+Fsuz9f7hu/6pRYDCwSDI2TbGwME4zSzIxtjSzNE8zMU80Mk1ONTMyTDUy+aF6MaMhkJEhva6alZEBAkF8DoaUrEzdnMyyVAYGAJUyIyQ=",
    channel: "dji-live",
    agoraChannel: "dji-live"
  },
  {
    sn: "1581F8GKB23B4004008G",
    name: "Echo-5",
    latitude: 33.4484,
    longitude: -112.0740,
    battery: 78,
    direction: "W",
    status: "offline",
    feedType: "BODY CAM",
    hasAgoraStream: false,
    agoraChannel: null
  },
  {
    sn: "1581F9GKB23B4004008H",
    name: "Foxtrot-6",
    latitude: 39.7392,
    longitude: -104.9903,
    battery: 23,
    direction: "NW",
    status: "offline",
    feedType: "CCTV",
    hasAgoraStream: false,
    agoraChannel: null
  }
]

export const incidentData: IncidentData[] = [
  {
    id: "ktxudzsv",
    title: "Crowd formation detected",
    description: "Large crowd gathering in market area. AI shows rapid growth.",
    status: "OPEN",
    timestamp: "20d ago",
    location: "Kurmi Market, Kano",
    severity: "high"
  },
  {
    id: "zmdizjgn",
    title: "Vehicle convoy anomaly",
    description: "Detected unusual convoy on Lagos-Ibadan highway.",
    status: "RESOLVED",
    timestamp: "20d ago",
    location: "Lagos-Ibadan Expressway",
    severity: "medium"
  },
  {
    id: "alx0f0hb",
    title: "Pipeline corridor intrusion",
    description: "Individuals walking close to restricted pipeline perimeter.",
    status: "IN PROGRESS",
    timestamp: "20d ago",
    location: "Lagos-Kano Pipeline",
    severity: "high"
  },
  {
    id: "ph2024001",
    title: "Unauthorized drone activity",
    description: "Unregistered drone detected in restricted airspace.",
    status: "MONITORING",
    timestamp: "1h ago",
    location: "Port Harcourt Airport",
    severity: "critical"
  }
]