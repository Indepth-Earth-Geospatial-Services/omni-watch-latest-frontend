/**
 * @file omniwatch-service.ts
 * @description HTTP service layer for all non-auth OmniWatch backend endpoints.
 *
 * This file owns the HTTP logic. URLs are resolved from the centralised
 * registry in `AuthGlobalApi.ts` — never constructed inline here.
 *
 * All exported objects follow the same convention:
 *   - Named after the resource they operate on (e.g. `projectsApi`)
 *   - Each method maps 1-to-1 with an API endpoint defined in `API_URLS`
 *   - Every method returns a typed `Promise<T>` — callers never deal with axios directly
 *
 * Authentication is handled automatically via the token stored in `token-store.ts`.
 * The `Authorization: Bearer <token>` header is attached to every request.
 */

import axios, { AxiosError } from 'axios';
import { getToken } from '@/lib/config/token-store';
import { API_URLS } from '@/lib/api/AuthGlobalApi';
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
  OmniWatchPage,
  PageParams,
} from '@/lib/types';

// ─── Core axios wrapper ───────────────────────────────────────────────────────

/**
 * Shared axios wrapper used by every service method in this file.
 *
 * Responsibilities:
 *   1. Attach `Authorization: Bearer <token>` from the in-memory token store
 *   2. Merge any caller-supplied extra headers (e.g. `X-Internal-Secret`)
 *   3. Surface a descriptive `Error` from the server's `detail` field on failure
 *   4. Return the typed response data — axios handles JSON parsing automatically
 *
 * @param method       - HTTP verb: GET | POST | PUT | PATCH | DELETE
 * @param url          - Fully resolved URL from `API_URLS`
 * @param data         - Request body (axios serialises to JSON automatically)
 * @param extraHeaders - Additional headers merged on top of the defaults
 */
// OmniWatch wraps every response in { code, message, data } — code 0 = success.
interface OmniWatchEnvelope<T> {
  code: number;
  message: string;
  data: T;
}

async function request<T>(
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE',
  url: string,
  data?: unknown,
  extraHeaders: Record<string, string> = {}
): Promise<T> {
  const token = getToken();
  if (!token) {
    throw new Error('Not authenticated');
  }

  try {
    const res = await axios.request<OmniWatchEnvelope<T>>({
      method,
      url,
      data,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...extraHeaders,
      },
    });

    // 204 No Content (e.g. DELETE success with no body)
    if (res.status === 204 || !res.data) {
      return undefined as unknown as T;
    }

    const envelope = res.data;

    if (envelope.code !== 0) {
      const detail = (envelope.data as Record<string, unknown> | undefined)?.detail;
      const msg = String(detail ?? envelope.message ?? `Request failed: ${res.status}`);
      throw new Error(msg);
    }

    return envelope.data;
  } catch (err) {
    if (err instanceof AxiosError && err.response) {
      const envelope = err.response.data as OmniWatchEnvelope<unknown> | undefined;
      const detail = (envelope?.data as Record<string, unknown> | undefined)?.detail;
      const msg = String(
        detail ?? envelope?.message ?? `Request failed: ${err.response.status}`
      );
      throw new Error(msg);
    }
    throw err;
  }
}

// ─── Workspace API ────────────────────────────────────────────────────────────

/**
 * Internal workspace management service.
 *
 * These endpoints are gated by the `X-Internal-Secret` gateway header and are
 * intended for platform-level operations, not regular user workflows.
 */
export const workspaceApi = {
  /**
   * Create a new DJI workspace on the OmniWatch backend.
   *
   * @param body           - Workspace name, description, and platform identifier.
   * @param internalSecret - Value for the `X-Internal-Secret` header (gateway token).
   */
  create: (
    body: CreateWorkspaceRequest,
    internalSecret: string
  ): Promise<CreateWorkspaceResponse> =>
    request<CreateWorkspaceResponse>('POST', API_URLS.workspace.create, body, {
      'X-Internal-Secret': internalSecret,
    }),
};

// ─── Projects API ─────────────────────────────────────────────────────────────

/**
 * Project management service — full CRUD plus device and flight-area assignment.
 *
 * A project is the primary organisational unit on the OmniWatch platform.
 * It groups a set of devices and wayline flight areas under a named context,
 * enabling mission planning and access-control scoping.
 */
export const projectsApi = {
  /**
   * Retrieve a paginated list of all projects for the authenticated organisation.
   *
   * @param params - Optional `page` and `page_size` for pagination.
   */
  list: (params?: PageParams): Promise<OmniWatchPage<Project>> =>
    request<OmniWatchPage<Project>>('GET', API_URLS.projects.list(params)),

  /**
   * Create a new project.
   *
   * @param body - Project `name` and optional `description`.
   */
  create: (body: ProjectBody): Promise<Project> =>
    request<Project>('POST', API_URLS.projects.create, body),

  /**
   * Fetch a single project by its UUID.
   *
   * @param id - Project UUID.
   */
  get: (id: string): Promise<Project> => request<Project>('GET', API_URLS.projects.detail(id)),

  /**
   * Replace a project's details (full update).
   *
   * @param id   - Project UUID.
   * @param body - Complete project body (`name` + `description`).
   */
  update: (id: string, body: ProjectBody): Promise<Project> =>
    request<Project>('PUT', API_URLS.projects.detail(id), body),

  /**
   * Partially update a project's details.
   *
   * @param id   - Project UUID.
   * @param body - Subset of project fields to update.
   */
  patch: (id: string, body: Partial<ProjectBody>): Promise<Project> =>
    request<Project>('PATCH', API_URLS.projects.detail(id), body),

  /**
   * Permanently delete a project. This action is irreversible.
   *
   * @param id - Project UUID.
   */
  delete: (id: string): Promise<void> => request<void>('DELETE', API_URLS.projects.detail(id)),

  /**
   * List devices currently assigned to a project, with optional pagination.
   *
   * @param id     - Project UUID.
   * @param params - Optional pagination params.
   */
  listDevices: (id: string, params?: PageParams): Promise<OmniWatchPage<ProjectDevice>> =>
    request<OmniWatchPage<ProjectDevice>>('GET', API_URLS.projects.devices(id, params)),

  /**
   * Assign a device to a project by its serial number.
   *
   * @param id   - Project UUID.
   * @param body - Object containing `device_sn`.
   */
  assignDevice: (id: string, body: AssignDeviceRequest): Promise<ProjectDevice> =>
    request<ProjectDevice>('POST', API_URLS.projects.assignDevice(id), body),

  /**
   * Remove a device assignment from a project.
   *
   * @param id       - Project UUID.
   * @param deviceSn - Serial number of the device to unassign.
   */
  unassignDevice: (id: string, deviceSn: string): Promise<void> =>
    request<void>('DELETE', API_URLS.projects.unassignDevice(id, deviceSn)),

  /**
   * Link a wayline flight area to a project.
   *
   * @param id   - Project UUID.
   * @param body - Object containing `wayline_id`.
   */
  assignFlightArea: (id: string, body: AssignFlightAreaRequest): Promise<ProjectFlightArea> =>
    request<ProjectFlightArea>('POST', API_URLS.projects.assignFlightArea(id), body),

  /**
   * Remove a flight-area link from a project.
   *
   * @param id        - Project UUID.
   * @param waylineId - Wayline ID to unlink.
   */
  unassignFlightArea: (id: string, waylineId: string): Promise<void> =>
    request<void>('DELETE', API_URLS.projects.unassignFlightArea(id, waylineId)),
};

// ─── Teams API ────────────────────────────────────────────────────────────────

/**
 * Team management service — handles the member invitation workflow.
 *
 * Invitations generate a one-time token that the recipient redeems via
 * `authAdminApi.acceptInvite`, which provisions their DJI accounts.
 */
export const teamsApi = {
  /**
   * Send a workspace invitation to a new team member.
   *
   * @param body - Recipient `email`, `workspace_id`, and assigned `role`.
   */
  invite: (body: TeamInviteRequest): Promise<TeamInviteResponse> =>
    request<TeamInviteResponse>('POST', API_URLS.teams.invite, body),
};

// ─── Auth Admin API ───────────────────────────────────────────────────────────

/**
 * Administrative authentication service — workspace provisioning and onboarding.
 *
 * These endpoints are used during the initial workspace setup flow and
 * the member invitation acceptance flow. They do not require a user session
 * (the invitation token itself authorises the request).
 */
export const authAdminApi = {
  /**
   * Accept a workspace invitation.
   * Validates the invitation token and provisions DJI Web and Pilot accounts
   * for the new member based on their assigned role.
   *
   * @param body - One-time invitation `token`, plus the member's chosen `username` and `password`.
   */
  acceptInvite: (body: AcceptInviteRequest): Promise<AcceptInviteResponse> =>
    request<AcceptInviteResponse>('POST', API_URLS.auth.acceptInvite, body),

  /**
   * Register the initial administrator for a workspace.
   * Provisions both a DJI Web account and a DJI Pilot account for the admin.
   * Should be called once immediately after a workspace is created.
   *
   * @param body - `workspace_id`, admin `email`, `username`, and `password`.
   */
  registerAdmin: (body: RegisterAdminRequest): Promise<RegisterAdminResponse> =>
    request<RegisterAdminResponse>('POST', API_URLS.auth.registerAdmin, body),
};

// ─── Health API ───────────────────────────────────────────────────────────────

/**
 * System health service — used to verify backend availability.
 *
 * Suitable for use in health dashboards, startup checks, or connection
 * status indicators in the UI.
 */
export const healthApi = {
  /**
   * Ping the OmniWatch server to verify that both databases are reachable.
   *
   * @returns A map of service names to their current status strings.
   */
  check: (): Promise<HealthCheckResponse> => request<HealthCheckResponse>('GET', API_URLS.health),
};

// ─── Organization API ─────────────────────────────────────────────────────────

/**
 * Organization management service — profile and staff administration.
 *
 * All calls are automatically scoped to the authenticated user's organization;
 * no explicit org ID is required on the request.
 */
export const organizationApi = {
  /**
   * Retrieve the authenticated user's organization profile.
   */
  get: (): Promise<Organization> => request<Organization>('GET', API_URLS.organization.detail),

  /**
   * Partially update the organization's profile.
   *
   * @param body - Fields to update: `name`, `plan`, and/or `is_active`.
   */
  update: (body: UpdateOrganizationRequest): Promise<Organization> =>
    request<Organization>('PATCH', API_URLS.organization.detail, body),

  /**
   * List all staff members belonging to the organization.
   */
  listUsers: (): Promise<OrgUser[]> => request<OrgUser[]>('GET', API_URLS.organization.users),

  /**
   * Add a new staff member to the organization.
   *
   * @param body - New member's `full_name`, `email`, and initial `pin`.
   */
  addUser: (body: AddOrgUserRequest): Promise<OrgUser> =>
    request<OrgUser>('POST', API_URLS.organization.users, body),

  /**
   * Update an existing staff member's profile.
   *
   * @param userId - UUID of the staff member to update.
   * @param body   - Fields to update: `full_name`, `pin`, and/or `is_active`.
   */
  updateUser: (userId: string, body: UpdateOrgUserRequest): Promise<OrgUser> =>
    request<OrgUser>('PATCH', API_URLS.organization.user(userId), body),
};
