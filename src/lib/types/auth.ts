// Authentication types for the LOCTIVA Auth API

export interface AuthTokenResponse {
  username: string;
  user_id: string;
  workspace_id: string;
  user_type: number;
  mqtt_username: string;
  mqtt_password: string;
  access_token: string;
  role: string;
}

export interface MeResponse {
  principal_id: string;
  principal_type: string;
  org_id: string;
  workspace_id: string;
}

// Shape returned by GET /manage/api/v1/users/current (DJI Cloud API)
export interface CurrentUser {
  user_id: string;
  username: string;
  user_type: number; // 0 = regular user, 1 = admin
  mqtt_username: string;
  mqtt_password: string;
  mqtt_client_id: string;
  workspace_id: string;
  workspace_name: string;
  workspace_description: string;
  role: string;
}
