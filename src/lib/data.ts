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
    feedType: "DRONE"
  },
  {
    sn: "1581F6GKB23B4004008E",
    name: "Bravo-2",
    latitude: 34.0522,
    longitude: -118.2437, 
    battery: 67,
    direction: "SW",
    status: "online",
    feedType: "BODY CAM"
  },
  {
    sn: "1581F7GKB23B4004008F",
    name: "Charlie-3",
    latitude: 34.0522,
    longitude: -118.2437,
    battery: 67,
    direction: "SW",
    status: "online",
    feedType: "CCTV"
  },
  {
    sn: "1584441F5FJD238900D79WS",
    name: "Delta-4",
    latitude: 40.7128,
    longitude: -74.0060,
    battery: 85,
    direction: "NE",
    status: "online",
    feedType: "DRONE"
  },
  {
    sn: "1581F8GKB23B4004008G",
    name: "Echo-5",
    latitude: 33.4484,
    longitude: -112.0740,
    battery: 78,
    direction: "W",
    status: "offline",
    feedType: "BODY CAM"
  },
  {
    sn: "1581F9GKB23B4004008H",
    name: "Foxtrot-6",
    latitude: 39.7392,
    longitude: -104.9903,
    battery: 23,
    direction: "NW",
    status: "offline",
    feedType: "CCTV"
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