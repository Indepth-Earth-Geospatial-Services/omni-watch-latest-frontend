// Authentication types for the OmniWatch Auth API

export interface AuthTokenResponse {
  access_token: string;
  refresh_token: string;
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
  user_type: number;       // 0 = regular user, 1 = admin
  mqtt_username: string;
  mqtt_password: string;
  mqtt_client_id: string;
  workspace_id: string;
  workspace_name: string;
  workspace_description: string;
}
