// Device types — drones, payloads (cameras), topology, binding

export interface DJIDevice {
  deviceSn: string;          // serial number — unique identifier
  deviceName: string;
  workspaceId: string;
  controlSource?: string;
  deviceDesc?: string;
  childDeviceSn?: string;
  domain: string;            // "0" = drone, "1" = remote controller, "2" = payload
  type: string;
  subType: string;
  payloadsList?: DJIDevicePayload[];
  iconUrl?: {
    normal_icon_url: string;
    selected_icon_url: string;
  };
  status: boolean;           // true = online
  boundStatus?: boolean;
  loginTime: string;         // ISO timestamp
  boundTime: string;         // ISO timestamp
  nickname: string;          // user-assigned friendly name
  userId?: string;
  firmwareVersion: string;
  workspaceName?: string;
  children?: string;
  firmwareStatus?: string;
  firmwareProgress?: number;
  parentSn?: string;
  thingVersion?: string;
}

export interface DJIDevicePayload {
  payloadSn: string;
  payloadName: string;       // e.g. "Zenmuse H20T"
  index: number;
  payloadDesc?: string;
  controlSource?: string;
  payloadIndex?: string;
}

// Tree structure returned by GET .../devices/topologies
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
  [key: string]: any;
}

export interface BindDeviceRequest extends Partial<DJIDevice> {
  deviceSn: string;
  deviceName: string;
  workspaceId: string;
}

export interface DeviceOTARequest {
  deviceName: string;
  sn: string;
  productVersion: string;
  firmwareUpgradeType: number;
}
