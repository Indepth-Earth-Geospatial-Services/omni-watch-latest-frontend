// Authentication types — login, token refresh, and current user profile

export interface LoginRequest {
  username: string;
  password: string;
  flag: number; // 0 = username/password authentication
}

export interface LoginResponse {
  access_token: string;
  token_type: string;
  expires_in?: number; // token lifetime in seconds, e.g. 3600
  username: string;
  workspace_id: string;
}

export interface RefreshResponse {
  access_token: string;
  expires_in?: number;
}

// Shape returned by GET /manage/api/v1/users/current
export interface CurrentUser {
  user_id: string;
  username: string;
  user_type: number;       // 0 = regular user, 1 = admin
  mqtt_username: string;   // used to connect to the MQTT broker for telemetry
  mqtt_password: string;
  mqtt_client_id: string;
  workspace_id: string;
  workspace_name: string;
  workspace_description: string;
}
