// Media and storage types — drone footage files, STS credentials for direct upload

export interface MediaFile {
  file_id: string;
  file_name: string;
  file_path: string;              // group/path label
  object_key: string;             // path inside the object storage bucket
  is_original: boolean;
  drone: string;                  // drone serial number
  payload: string;                // payload/camera name
  tinny_fingerprint: string;      // short fingerprint
  fingerprint: string;            // MD5 hash — used for deduplication
  create_time: string;            // "YYYY-MM-DD HH:mm:ss" format
  job_id: string;                 // associated flight job
}

// Sent before upload to check if a file with this fingerprint already exists
export interface FastUploadRequest {
  md5: string;
  file_name: string;
  size: number;
  object_key: string;
}

export interface FastUploadResponse {
  exist: boolean; // true = file already uploaded, skip the actual upload
}

// Temporary credentials from the storage service (MinIO/S3-compatible)
// The client uses these to upload directly to object storage — not through the DJI server
export interface STSCredentials {
  access_key_id: string;
  access_key_secret: string;
  security_token: string;        // short-lived session token
  endpoint: string;              // object store endpoint URL
  bucket: string;
  expire: number;                // Unix timestamp when credentials expire
  object_key_prefix: string;     // path prefix the client must use for all uploads
}

// Sent after a successful direct upload to record GPS metadata
export interface UploadCallbackRequest {
  object_key: string;
  drone_model_key: string;
  payload_model_key: string;
  latitude: number;
  longitude: number;
  altitude: number;
  create_time: string; // ISO timestamp
}

// Paginated list of media files
export interface MediaListResponse {
  list: MediaFile[];
  pagination: {
    total: number;
    page: number;
    page_size: number;
  };
}
