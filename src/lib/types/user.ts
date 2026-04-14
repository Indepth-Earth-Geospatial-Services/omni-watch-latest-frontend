// User and workspace types

export interface DJIUser {
  user_id: string;
  username: string;
  user_type: number;          // 0 = regular, 1 = admin
  workspace_id: string;
  mqtt_username?: string;     // MQTT broker credentials for telemetry subscription
  mqtt_password?: string;
  mqtt_client_id?: string;
}

// Only MQTT credentials can be updated — username and user_type are managed server-side
export interface UpdateUserRequest {
  mqtt_username?: string;
  mqtt_password?: string;
}

export interface DJIWorkspace {
  workspace_id: string;
  workspace_name: string;
  workspace_description: string;
  create_time: number; // Unix timestamp ms
  update_time: number;
}

export interface WorkspaceUsersResponse {
  list: DJIUser[];
  pagination: {
    total: number;
    page: number;
    page_size: number;
  };
}
