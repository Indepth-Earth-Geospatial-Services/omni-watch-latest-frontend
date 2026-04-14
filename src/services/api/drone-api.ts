// Drone API Service
// Handles all API calls to the drone management backend

export interface DroneAPIResponse {
  _id: string;
  deviceSerialNumber: string;
  deviceName: string;
  deviceCategory: string;
  isUsingAiDetection: boolean;
  streamIsOn: boolean;
  streamUrl: string;
  webRTCUrl: string;
  metadata?: {
    alias?: string;
    description?: string;
  };
  streamCredentials?: {
    userName: string;
    password: string;
    port: string;
  };
  cameras: string[];
  detectionClasses?: number[]; // YOLO class IDs for AI detection
  incidents: any[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateDronePayload {
  deviceSerialNumber: string;
  deviceName: string;
  deviceCategory: 'DRONE' | 'BODY CAM' | 'CCTV';
  isUsingAiDetection: boolean;
  streamIsOn: boolean;
  streamUrl: string;
  metadata?: {
    alias?: string;
    description?: string;
  };
  streamCredentials: {
    userName: string;
    password: string;
    port: string;
  };
  cameras?: string[];
  detectionClasses?: number[]; // YOLO class IDs for AI detection
}

export interface UpdateDronePayload {
  deviceName?: string;
  deviceCategory?: string;
  isUsingAiDetection?: boolean;
  streamIsOn?: boolean;
  streamUrl?: string;
  webRTCUrl?: string;
  metadata?: {
    alias?: string;
    description?: string;
  };
  streamCredentials?: {
    userName?: string;
    password?: string;
    port?: string;
  };
  cameras?: string[];
  detectionClasses?: number[]; // YOLO class IDs for AI detection
  incidents?: any[];
}

export interface GetAllDronesResponse {
  status: string;
  results: number;
  data: {
    drones: DroneAPIResponse[];
  };
}


// Next.js uses process.env for environment variables
const API_BASE_URL = process.env.NEXT_PUBLIC_DRONE_API_URL || 'http://127.0.0.1:5000/api/v1/drones';

/**
 * Fetch all drones from the API
 */
export async function getAllDrones(): Promise<DroneAPIResponse[]> {
  try {
    const response = await fetch(API_BASE_URL);

    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}`);
    }

    const data: GetAllDronesResponse = await response.json();
    return data.data.drones;
  } catch (error) {
    console.error('Failed to fetch drones:', error);
    throw error;
  }
}

/**
 * Fetch a specific drone by serial number
 */
export async function getDroneBySerial(serial: string): Promise<DroneAPIResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/sn/${serial}`);

    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}`);
    }

    const data = await response.json();
    return data.data.drone;
  } catch (error) {
    console.error(`Failed to fetch drone ${serial}:`, error);
    throw error;
  }
}

/**
 * Create a new drone
 */
export async function createDrone(payload: CreateDronePayload): Promise<DroneAPIResponse> {
  try {
    const response = await fetch(API_BASE_URL+"/register", {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || `API request failed with status ${response.status}`);
    }

    const data = await response.json();
    return data.data.drone;
  } catch (error) {
    console.error('Failed to create drone:', error);
    throw error;
  }
}

/**
 * Update an existing drone
 */
export async function updateDrone(
  serial: string,
  payload: UpdateDronePayload
): Promise<DroneAPIResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/sn/${serial}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || `API request failed with status ${response.status}`);
    }

    const data = await response.json();
    return data.data.drone;
  } catch (error) {
    console.error(`Failed to update drone ${serial}:`, error);
    throw error;
  }
}

/**
 * Update drone's stream status
 */
export async function updateDroneStreamStatus(
  serial: string,
  streamIsOn: boolean,
  streamUrl?: string
): Promise<DroneAPIResponse> {
  try {
    const payload: any = { streamIsOn };
    if (streamUrl !== undefined) {
      payload.streamUrl = streamUrl;
    }

    const response = await fetch(`${API_BASE_URL}/sn/${serial}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}`);
    }

    const data = await response.json();
    return data.data.drone;
  } catch (error) {
    console.error(`Failed to update drone ${serial}:`, error);
    throw error;
  }
}

/**
 * Delete a drone
 */
export async function deleteDrone(serial: string): Promise<void> {
  try {
    const response = await fetch(`${API_BASE_URL}/sn/${serial}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}`);
    }
  } catch (error) {
    console.error(`Failed to delete drone ${serial}:`, error);
    throw error;
  }
}
