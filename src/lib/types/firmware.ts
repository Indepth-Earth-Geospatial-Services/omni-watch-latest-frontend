// Firmware and OTA upgrade types

export interface FirmwareRelease {
  firmware_id: string;
  product_version: string;    // semantic version string, e.g. "07.01.10.03"
  product_type: string;       // drone model key this firmware applies to
  status: number;             // 0 = disabled (hidden from devices), 1 = enabled
  release_note: string;       // human-readable changelog
  release_date: string;       // ISO date string
  file_size: number;          // bytes
  md5: string;                // used to verify integrity after download
}

export interface FirmwareReleaseNotes {
  latest_version: string;
  firmware_list: FirmwareRelease[];
}

// Payload to trigger an OTA upgrade on one or more devices
export interface OTARequest {
  device_sn_list: string[];   // which devices to upgrade
  firmware_id: string;        // which firmware version to push
}
