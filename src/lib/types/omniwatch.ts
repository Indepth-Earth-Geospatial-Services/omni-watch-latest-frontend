// OmniWatch backend types — projects, workspaces, teams

// ─── Shared ───────────────────────────────────────────────────────────────────

// Legacy DRF shape — kept for reference but not used by OmniWatch endpoints
export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

// Actual paginated shape returned by OmniWatch list endpoints:
//   { list: T[], pagination: { page, total, page_size } }
export interface OmniWatchPage<T> {
  list: T[];
  pagination: {
    page: number;
    total: number;
    page_size: number;
  };
}

export interface PageParams {
  page?: number;
  page_size?: number;
}

// ─── Workspace (Internal) ─────────────────────────────────────────────────────

export interface CreateWorkspaceRequest {
  workspace_name: string;
  workspace_desc?: string;
  platform_name?: string;
}

export interface CreateWorkspaceResponse {
  workspace_name: string;
  workspace_desc: string;
  platform_name: string;
}

// ─── Device AI Configuration ─────────────────────────────────────────────────

export interface DeviceConfig {
  device_sn: string;
  name: string;
  targetClasses: string;
  isActive: boolean;
  ai_enabled: boolean;
  created_at: string;
  updated_at: string;
}

export interface AIClass {
  id: string;
  name: string;
  description: string;
  created_at: string;
}

export interface StreamUrlResponse {
  url: string;
  sn: string;
}

// ─── Projects ────────────────────────────────────────────────────────────────

export interface ProjectDevice {
  id: string;
  project: string;
  device: {
    device_sn: string;
    name: string;
    targetClasses?: string[] | string;
    isActive?: boolean;
    created_at?: string;
    updated_at?: string;
  };
  created_at: string;
}

export interface ProjectFlightArea {
  id: string;
  project: string;
  wayline_id: string;
  created_at: string;
}

export interface Project {
  id: string;
  org: string;
  name: string;
  description: string;
  created_at: string;
  devices: ProjectDevice[];
  flight_areas: ProjectFlightArea[];
}

export interface ProjectBody {
  name: string;
  description?: string;
}

export interface AssignDeviceRequest {
  device_sn: string;
}

export interface AssignFlightAreaRequest {
  wayline_id: string;
}

// ─── Teams ────────────────────────────────────────────────────────────────────

export interface TeamInviteRequest {
  email: string;
  workspace_id: string;
  role: string;
}

export interface TeamInviteResponse {
  email: string;
  workspace_id: string;
  role: string;
}

// ─── Auth — accept invite / register admin ────────────────────────────────────

export interface AcceptInviteRequest {
  token: string;
  username: string;
  password: string;
}

export interface AcceptInviteResponse {
  token: string;
  username: string;
  password: string;
}

export interface RegisterAdminRequest {
  workspace_id: string;
  email: string;
  username: string;
  password: string;
}

export interface RegisterAdminResponse {
  workspace_id: string;
  email: string;
  username: string;
  password: string;
}

// ─── Legacy non-DJI-Cloud device shape (used by EditDeviceModal) ──────────────

export interface DroneAPIResponse {
  deviceSerialNumber: string;
  deviceName: string;
  deviceCategory: string;
  streamIsOn: boolean;
  streamUrl: string;
  metadata?: { alias?: string; description?: string };
}

// ─── Health ───────────────────────────────────────────────────────────────────

export type HealthCheckResponse = Record<string, string>;

// ─── Organization ─────────────────────────────────────────────────────────────

export interface Organization {
  id: string;
  name: string;
  slug: string;
  plan: string;
  workspace_id: string;
  bind_code: string;
  email: string;
  is_active: boolean;
  created_at: string;
}

export interface UpdateOrganizationRequest {
  name?: string;
  plan?: string;
  is_active?: boolean;
}

// ─── Organization Users ───────────────────────────────────────────────────────

export interface OrgUser {
  id: string;
  org_id: string;
  full_name: string;
  email: string;
  is_active: boolean;
  last_login: string;
  created_at: string;
}

export interface AddOrgUserRequest {
  full_name: string;
  email: string;
  pin: string;
}

export interface UpdateOrgUserRequest {
  full_name?: string;
  pin?: string;
  is_active?: boolean;
}

// ─── DJI Workspace Users ─────────────────────────────────────────────────────

// DJI workspace user — returned by GET /manage/api/v1/users/{wid}/users
export interface DJIWorkspaceUser {
  user_id: string;
  username: string;
  email: string;
  user_type: string;         // "Web" or "Pilot"
  workspace_id: string;
  workspace_name: string;
  mqtt_username: string;
  mqtt_password: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  create_time: string;       // alternative timestamp field from API
}

// Request body for PUT /manage/api/v1/users/{wid}/users/{userId}
export interface UpdateDJIWorkspaceUserRequest {
  mqtt_username?: string;
  mqtt_password?: string;
}

// Paginated response from DJI manage API
export interface DJIWorkspaceUserListResponse {
  list: DJIWorkspaceUser[];
  pagination: {
    total: number;
    page: number;
    page_size: number;
  };
}
