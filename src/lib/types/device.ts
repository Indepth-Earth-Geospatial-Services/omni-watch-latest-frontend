// Device types — drones, payloads (cameras), topology, binding

export interface DJIDevice {
  device_sn: string;          // serial number — unique identifier
  workspace_id: string;
  child_device_sn?: string;   // payload/camera attached to this drone
  device_name: string;        // model name, e.g. "Matrice 350 RTK"
  device_type: string;
  sub_type: string;
  domain: number;             // 0 = drone, 1 = remote controller, 2 = payload
  status: boolean;            // true = online
  firmware_version: string;
  nickname: string;           // user-assigned friendly name
  login_time: string;         // ISO timestamp of last connection
  bound_time: string;         // ISO timestamp of when device was bound to workspace
  payload?: DJIDevicePayload[];
}

export interface DJIDevicePayload {
  payload_sn: string;
  payload_name: string;       // e.g. "Zenmuse H20T"
  firmware_version: string;
  payload_type: number;       // 0 = camera, 1 = radar, etc.
}

// Tree structure returned by GET .../devices/topologies
// A gateway (remote controller or dock) can have child devices (drones/payloads)
export interface DJIDeviceTopology {
  gateway_sn: string;
  device_sn: string;
  type: string;
  sub_type: string;
  device_name: string;
  status: boolean;
  children?: DJIDeviceTopology[];
}

export interface DJIBoundDevicesResponse {
  list: DJIDevice[];
  pagination: {
    total: number;
    page: number;
    page_size: number;
  };
}

export interface DJIDeviceProperty {
  name: string;
  value: unknown;
}

export interface BindDeviceRequest {
  user_id: string;              // DJI user ID of the binding user (from GET /users/current)
  workspace_id: string;
  device_sn: string;            // serial number of the drone being bound
  child_device_sn?: string;     // serial number of the attached payload/camera, if any
}
