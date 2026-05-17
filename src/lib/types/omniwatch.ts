// OmniWatch backend types — projects, workspaces, teams

// ─── Shared ───────────────────────────────────────────────────────────────────

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
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

// ─── Projects ────────────────────────────────────────────────────────────────

export interface ProjectDevice {
  id: string;
  project: string;
  device_sn: string;
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
