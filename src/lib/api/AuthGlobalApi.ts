// OmniWatch API — URL registry + API methods for all non-auth OmniWatch endpoints.
// Auth endpoints (login/logout/me/refresh) live in src/lib/dji/auth-api.ts.
//
// All requests go through the Next.js proxies (both forward to http://34.35.12.123:8002):
//   /api/auth/...      → OmniWatch /api/v1/auth/<path>   (auth-api.ts handles this)
//   /api/omniwatch/... → OmniWatch /api/v1/<path>        (this file)

import { getToken } from '@/lib/dji/token-store';
import type {
  CreateWorkspaceRequest,
  CreateWorkspaceResponse,
  Project,
  ProjectBody,
  ProjectDevice,
  ProjectFlightArea,
  AssignDeviceRequest,
  AssignFlightAreaRequest,
  TeamInviteRequest,
  TeamInviteResponse,
  AcceptInviteRequest,
  AcceptInviteResponse,
  RegisterAdminRequest,
  RegisterAdminResponse,
  HealthCheckResponse,
  Organization,
  UpdateOrganizationRequest,
  OrgUser,
  AddOrgUserRequest,
  UpdateOrgUserRequest,
  PaginatedResponse,
  PageParams,
} from '@/lib/types';

// ─── URL registry ─────────────────────────────────────────────────────────────

const AUTH_PROXY = '/api/auth';
const OMNI_PROXY = '/api/omniwatch';

export const AUTH_URLS = {
  login:         `${AUTH_PROXY}/login`,
  logout:        `${AUTH_PROXY}/logout`,
  me:            `${AUTH_PROXY}/me`,
  refreshToken:  `${AUTH_PROXY}/token/refresh`,
  acceptInvite:  `${AUTH_PROXY}/accept-invite/`,
  registerAdmin: `${AUTH_PROXY}/register-admin/`,
} as const;

export const OMNIWATCH_URLS = {
  health: `${OMNI_PROXY}/health`,
  workspace: {
    create: `${OMNI_PROXY}/internal/workspaces/`,
  },
  projects: {
    list:   `${OMNI_PROXY}/projects/`,
    create: `${OMNI_PROXY}/projects/`,
    detail:             (id: string)               => `${OMNI_PROXY}/projects/${id}/`,
    devices:            (id: string)               => `${OMNI_PROXY}/projects/${id}/devices/`,
    assignDevice:       (id: string)               => `${OMNI_PROXY}/projects/${id}/devices/assign/`,
    unassignDevice:     (id: string, sn: string)   => `${OMNI_PROXY}/projects/${id}/devices/${sn}/unassign/`,
    assignFlightArea:   (id: string)               => `${OMNI_PROXY}/projects/${id}/flight-areas/assign/`,
    unassignFlightArea: (id: string, wId: string)  => `${OMNI_PROXY}/projects/${id}/flight-areas/${wId}/unassign/`,
  },
  teams: {
    invite: `${OMNI_PROXY}/teams/invite/`,
  },
  organization: {
    detail: `${OMNI_PROXY}/organization/`,
    users:  `${OMNI_PROXY}/organization/users/`,
    user:   (userId: string) => `${OMNI_PROXY}/organization/users/${userId}/`,
  },
} as const;

// ─── Internal fetch wrapper ───────────────────────────────────────────────────

async function request<T>(
  url: string,
  options: RequestInit = {},
  extraHeaders: Record<string, string> = {}
): Promise<T> {
  const token = getToken();
  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...extraHeaders,
      ...(options.headers as Record<string, string> ?? {}),
    },
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(String(body.detail ?? `Request failed: ${res.status}`));
  }

  const text = await res.text();
  return (text ? JSON.parse(text) : undefined) as T;
}

function qs(params: PageParams): string {
  const sp = new URLSearchParams();
  if (params.page      !== undefined) sp.set('page',      String(params.page));
  if (params.page_size !== undefined) sp.set('page_size', String(params.page_size));
  const s = sp.toString();
  return s ? `?${s}` : '';
}

// ─── Workspace API (internal — requires X-Internal-Secret) ───────────────────

export const workspaceApi = {
  create: (body: CreateWorkspaceRequest, internalSecret: string): Promise<CreateWorkspaceResponse> =>
    request<CreateWorkspaceResponse>(
      OMNIWATCH_URLS.workspace.create,
      { method: 'POST', body: JSON.stringify(body) },
      { 'X-Internal-Secret': internalSecret }
    ),
};

// ─── Projects API ─────────────────────────────────────────────────────────────

export const projectsApi = {
  list: (params?: PageParams): Promise<PaginatedResponse<Project>> =>
    request<PaginatedResponse<Project>>(
      `${OMNIWATCH_URLS.projects.list}${qs(params ?? {})}`,
      { method: 'GET' }
    ),

  create: (body: ProjectBody): Promise<Project> =>
    request<Project>(OMNIWATCH_URLS.projects.create, {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  get: (id: string): Promise<Project> =>
    request<Project>(OMNIWATCH_URLS.projects.detail(id), { method: 'GET' }),

  update: (id: string, body: ProjectBody): Promise<Project> =>
    request<Project>(OMNIWATCH_URLS.projects.detail(id), {
      method: 'PUT',
      body: JSON.stringify(body),
    }),

  patch: (id: string, body: Partial<ProjectBody>): Promise<Project> =>
    request<Project>(OMNIWATCH_URLS.projects.detail(id), {
      method: 'PATCH',
      body: JSON.stringify(body),
    }),

  delete: (id: string): Promise<void> =>
    request<void>(OMNIWATCH_URLS.projects.detail(id), { method: 'DELETE' }),

  listDevices: (id: string, params?: PageParams): Promise<PaginatedResponse<ProjectDevice>> =>
    request<PaginatedResponse<ProjectDevice>>(
      `${OMNIWATCH_URLS.projects.devices(id)}${qs(params ?? {})}`,
      { method: 'GET' }
    ),

  assignDevice: (id: string, body: AssignDeviceRequest): Promise<ProjectDevice> =>
    request<ProjectDevice>(OMNIWATCH_URLS.projects.assignDevice(id), {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  unassignDevice: (id: string, deviceSn: string): Promise<void> =>
    request<void>(OMNIWATCH_URLS.projects.unassignDevice(id, deviceSn), { method: 'DELETE' }),

  assignFlightArea: (id: string, body: AssignFlightAreaRequest): Promise<ProjectFlightArea> =>
    request<ProjectFlightArea>(OMNIWATCH_URLS.projects.assignFlightArea(id), {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  unassignFlightArea: (id: string, waylineId: string): Promise<void> =>
    request<void>(OMNIWATCH_URLS.projects.unassignFlightArea(id, waylineId), { method: 'DELETE' }),
};

// ─── Teams API ────────────────────────────────────────────────────────────────

export const teamsApi = {
  invite: (body: TeamInviteRequest): Promise<TeamInviteResponse> =>
    request<TeamInviteResponse>(OMNIWATCH_URLS.teams.invite, {
      method: 'POST',
      body: JSON.stringify(body),
    }),
};

// ─── Auth Admin API ───────────────────────────────────────────────────────────

export const authAdminApi = {
  acceptInvite: (body: AcceptInviteRequest): Promise<AcceptInviteResponse> =>
    request<AcceptInviteResponse>(AUTH_URLS.acceptInvite, {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  registerAdmin: (body: RegisterAdminRequest): Promise<RegisterAdminResponse> =>
    request<RegisterAdminResponse>(AUTH_URLS.registerAdmin, {
      method: 'POST',
      body: JSON.stringify(body),
    }),
};

// ─── Health API ───────────────────────────────────────────────────────────────

export const healthApi = {
  check: (): Promise<HealthCheckResponse> =>
    request<HealthCheckResponse>(OMNIWATCH_URLS.health, { method: 'GET' }),
};

// ─── Organization API ─────────────────────────────────────────────────────────

export const organizationApi = {
  get: (): Promise<Organization> =>
    request<Organization>(OMNIWATCH_URLS.organization.detail, { method: 'GET' }),

  update: (body: UpdateOrganizationRequest): Promise<Organization> =>
    request<Organization>(OMNIWATCH_URLS.organization.detail, {
      method: 'PATCH',
      body: JSON.stringify(body),
    }),

  listUsers: (): Promise<OrgUser[]> =>
    request<OrgUser[]>(OMNIWATCH_URLS.organization.users, { method: 'GET' }),

  addUser: (body: AddOrgUserRequest): Promise<OrgUser> =>
    request<OrgUser>(OMNIWATCH_URLS.organization.users, {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  updateUser: (userId: string, body: UpdateOrgUserRequest): Promise<OrgUser> =>
    request<OrgUser>(OMNIWATCH_URLS.organization.user(userId), {
      method: 'PATCH',
      body: JSON.stringify(body),
    }),
};
