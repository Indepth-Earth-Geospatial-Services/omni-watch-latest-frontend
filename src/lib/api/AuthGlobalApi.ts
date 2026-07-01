/**
 * @file AuthGlobalApi.ts
 * @description Centralised URL registry for all OmniWatch backend endpoints.
 *
 * This file is a **pure URL registry** — it contains only URL strings and
 * URL builder functions. No fetch logic, no side-effects.
 *
 * Fetch calls that consume these URLs live in `omniwatch-service.ts`.
 *
 * Proxy routing (Next.js → OmniWatch backend at http://34.35.12.123:8002):
 *   /api/auth/*      → /api/v1/auth/<path>   (authentication endpoints)
 *   /api/omniwatch/* → /api/v1/<path>        (all other endpoints)
 *
 * Usage:
 *   import { API_URLS } from '@/lib/api';
 *   const url = API_URLS.projects.detail('abc-123');
 */

import type { PageParams } from '@/lib/types';

const AUTH_PROXY = '/api/auth';
const OMNI_PROXY = '/api/omniwatch';
const AI_DETECTION_PROXY = '/api/ai-detection';

export const API_URLS = {
  /**
   * Authentication endpoints — proxied through /api/auth.
   * Credentials flow: browser → Next.js proxy → OmniWatch /api/v1/auth/*
   */
  auth: {
    /** POST — exchange email + PIN for access & refresh tokens */
    login: `${AUTH_PROXY}/login`,
    /** POST — revoke the current session (HttpOnly refresh cookie cleared server-side) */
    logout: `${AUTH_PROXY}/logout`,
    /** GET  — return the authenticated principal's org/workspace metadata */
    me: `${AUTH_PROXY}/me`,
    /** POST — exchange refresh token (sent as HttpOnly cookie) for a new access token */
    refreshToken: `${AUTH_PROXY}/token/refresh`,
    /** POST — validate an invitation token and provision DJI Web + Pilot accounts */
    acceptInvite: `${AUTH_PROXY}/accept-invite/`,
    /** POST — provision the initial admin DJI accounts for a newly created workspace */
    registerAdmin: `${AUTH_PROXY}/register-admin/`,
  },

  /**
   * GET — verify that the OmniWatch server and both databases are reachable.
   * Returns a map of service names to their current status strings.
   */
  health: `${OMNI_PROXY}/health`,

  /**
   * Internal workspace management — requires the X-Internal-Secret gateway header.
   * These endpoints are not exposed to regular users.
   */
  workspace: {
    /** POST — create a new DJI workspace on the OmniWatch backend */
    create: `${OMNI_PROXY}/internal/workspaces/`,
  },

  /**
   * Project endpoints — CRUD plus device and flight-area assignment.
   * A project groups devices and wayline flight areas under a named context.
   */
  projects: {
    /**
     * GET — paginated list of all projects belonging to the authenticated org.
     * @param params - Optional page / page_size for cursor-based pagination.
     */
    list: (params?: PageParams) => {
      const q = new URLSearchParams();
      if (params?.page !== undefined) q.set('page', String(params.page));
      if (params?.page_size !== undefined) q.set('page_size', String(params.page_size));
      const s = q.toString();
      return s ? `${OMNI_PROXY}/projects/?${s}` : `${OMNI_PROXY}/projects/`;
    },

    /** POST — create a new project (name + optional description) */
    create: `${OMNI_PROXY}/projects/`,

    /**
     * GET / PUT / PATCH / DELETE — operate on a single project by UUID.
     * @param id - Project UUID.
     */
    detail: (id: string) => `${OMNI_PROXY}/projects/${id}/`,

    /**
     * GET — paginated list of devices currently assigned to a project.
     * @param id     - Project UUID.
     * @param params - Optional pagination params.
     */
    devices: (id: string, params?: PageParams) => {
      const q = new URLSearchParams();
      if (params?.page !== undefined) q.set('page', String(params.page));
      if (params?.page_size !== undefined) q.set('page_size', String(params.page_size));
      const s = q.toString();
      return s
        ? `${OMNI_PROXY}/projects/${id}/devices/?${s}`
        : `${OMNI_PROXY}/projects/${id}/devices/`;
    },

    /** POST — assign a device (by serial number) to the project */
    assignDevice: (id: string) => `${OMNI_PROXY}/projects/${id}/devices/assign/`,

    /**
     * DELETE — remove a device assignment from the project.
     * @param id - Project UUID.
     * @param sn - Device serial number to unassign.
     */
    unassignDevice: (id: string, sn: string) =>
      `${OMNI_PROXY}/projects/${id}/devices/${sn}/unassign/`,

    /** POST — link a wayline flight area to the project */
    assignFlightArea: (id: string) => `${OMNI_PROXY}/projects/${id}/flight-areas/assign/`,

    /**
     * DELETE — remove a flight-area link from the project.
     * @param id  - Project UUID.
     * @param wId - Wayline ID to unassign.
     */
    unassignFlightArea: (id: string, wId: string) =>
      `${OMNI_PROXY}/projects/${id}/flight-areas/${wId}/unassign/`,
  },

  /**
   * Team management — invitation flow for onboarding new workspace members.
   */
  teams: {
    /** POST — generate an invitation token and send it to the specified email */
    invite: `${OMNI_PROXY}/teams/invite/`,
  },

  /**
   * Organisation endpoints — read/update the caller's own org and manage staff.
   * All calls are scoped to the authenticated user's organisation automatically.
   */
  organization: {
    /** GET / PATCH — retrieve or partially update the authenticated org's details */
    detail: `${OMNI_PROXY}/organization/`,
    /** GET / POST — list all staff members or add a new one */
    users: `${OMNI_PROXY}/organization/users/`,
    /**
     * PATCH — update a specific staff member's profile.
     * @param userId - UUID of the staff member to update.
     */
    user: (userId: string) => `${OMNI_PROXY}/organization/users/${userId}/`,
  },

  /**
   * DJI workspace user management — proxied through OmniWatch backend.
   * These endpoints manage MQTT credentials and workspace membership.
   */
  djiUsers: {
    /** GET — paginated list of DJI workspace users */
    list: (workspaceId: string, params?: PageParams) => {
      const q = new URLSearchParams();
      if (params?.page !== undefined) q.set('page', String(params.page));
      if (params?.page_size !== undefined) q.set('page_size', String(params.page_size));
      const s = q.toString();
      return s
        ? `${OMNI_PROXY}/dji-users/${workspaceId}/users?${s}`
        : `${OMNI_PROXY}/dji-users/${workspaceId}/users`;
    },
    /** PUT — update a DJI workspace user's MQTT credentials */
    update: (workspaceId: string, userId: string) =>
      `${OMNI_PROXY}/dji-users/${workspaceId}/users/${userId}`,
  },

  /**
   * AI Detection alerts — paginated history and action endpoints.
   */
  alerts: {
    /** GET — paginated list of alerts with optional filters */
    list: (params?: Record<string, string>) => {
      const q = new URLSearchParams();
      if (params) {
        for (const [key, value] of Object.entries(params)) {
          if (value !== undefined && value !== null && value !== '') {
            q.set(key, value);
          }
        }
      }
      const s = q.toString();
      return s ? `${AI_DETECTION_PROXY}/alerts?${s}` : `${AI_DETECTION_PROXY}/alerts`;
    },
    /** POST — create a new alert (used for YOLO detections not yet in DB) */
    create: `${AI_DETECTION_PROXY}/alerts`,
    /** PATCH — update alert type (e.g. set to "APPROVED") */
    update: (id: string) => `${AI_DETECTION_PROXY}/alerts/${id}/update`,
    /** DELETE — delete/dismiss an alert */
    delete: (id: string) => `${AI_DETECTION_PROXY}/alerts/${id}/delete`,
  },
};
