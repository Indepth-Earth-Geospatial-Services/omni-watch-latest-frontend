# DJI Cloud API — Full Integration Plan

> **Reference document for the ISR Command & Control frontend.**
> Use this to track progress and keep implementation on course.
> Base URL: `http://{NEXT_PUBLIC_API_IP}:{NEXT_PUBLIC_API_PORT}` (default: `http://localhost:6789`)
> All authenticated requests require `x-auth-token` header.

---

## API Version Prefixes (from `.env.local`)

| Variable                      | Default Value            | Purpose              |
| ----------------------------- | ------------------------ | -------------------- |
| `NEXT_PUBLIC_API_IP`          | `localhost`              | Server IP            |
| `NEXT_PUBLIC_API_PORT`        | `6789`                   | Server port          |
| `NEXT_PUBLIC_WORKSPACE_ID`    | `e3dea0f5-37f2-4d79-...` | Workspace UUID       |
| `NEXT_PUBLIC_DEVICE_SN`       | `xxxxxxxxxx`             | Target device serial |
| `NEXT_PUBLIC_MANAGE_VERSION`  | `/manage/api/v1`         | Manage API prefix    |
| `NEXT_PUBLIC_MAP_VERSION`     | `/map/api/v1`            | Map API prefix       |
| `NEXT_PUBLIC_MEDIA_VERSION`   | `/media/api/v1`          | Media API prefix     |
| `NEXT_PUBLIC_STORAGE_VERSION` | `/storage/api/v1`        | Storage API prefix   |
| `NEXT_PUBLIC_WAYLINE_VERSION` | `/wayline/api/v1`        | Wayline API prefix   |
| `NEXT_PUBLIC_CONTROL_VERSION` | `/control/api/v1`        | Control API prefix   |

---

## Key Architecture Decision

The DJI server runs on `http://localhost:6789` (non-HTTPS).
Calling it **directly from the browser** causes CORS issues and exposes JWT tokens in network tabs.

**Solution:** Route ALL DJI traffic through a Next.js Route Handler proxy at:

```
src/app/api/dji/[...path]/route.ts
```

This single file forwards all methods (GET, POST, PUT, DELETE) to the DJI server and streams responses back. No DJI URL is ever called directly from client components.

---

## Cross-Cutting Concerns (Apply to Every Phase)

- **Feature flag:** Add `NEXT_PUBLIC_USE_DJI_CLOUD=true` to `.env.local`. Every hook replacing existing functionality checks this flag so the old backend stays usable during transition.
- **Query key convention:** `['dji', 'resource', workspaceId, ...]` — never conflicts with existing `['drones']` keys.
- **Token refresh:** `djiRequest()` retries once on 401. If the login response includes `expires_in`, set a proactive `setTimeout` in `AuthProvider` to refresh 60 seconds before expiry.
- **Error normalisation:** The proxy Route Handler never exposes raw DJI error bodies. Normalise to `{ code: number, message: string }`.
- **Confirmation dialogs:** Every mutation in Phase 9 (Drone Control) must go through `ConfirmDialog` before executing — commands go to real aircraft.

---

## Execution Order

```
Phase 1 (Foundation)
    └── Phase 2 (Auth)
            ├── Phase 3 (Devices) ──── Phase 4 (Livestream)
            │       │
            │       ├── Phase 5 (Geospatial)
            │       ├── Phase 6 (Health & Logs)
            │       └── Phase 10 (Users)  ← can run parallel with Phase 3
            │
            ├── Phase 7 (Waylines & Flight Tasks)
            ├── Phase 8 (Media & Storage)
            │
            └── Phase 9 (Drone Control) ← needs Phase 3 + 4
                    └── Phase 11 (Firmware/OTA) ← needs Phase 8 + 9
```

---

## Phase 1 — Foundation

> **Status:** [ ] Not Started

**Goal:** API client, URL builder, TypeScript types, proxy Route Handler.
No other phase can begin without this.

### Files to Create

| File                                 | Purpose                                                                                                                                                                                |
| ------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/lib/dji/config.ts`              | Reads all `NEXT_PUBLIC_*` env vars. Exports `BASE_URL`, `WORKSPACE_ID`, `DEVICE_SN`, and all 6 version prefix strings. Single source of truth — no other file reads env vars directly. |
| `src/lib/dji/client.ts`              | Typed `djiRequest<T>()` wrapper. Attaches JWT, calls the proxy, normalises errors, retries once on 401.                                                                                |
| `src/lib/dji/types/auth.ts`          | `LoginRequest`, `LoginResponse`, `RefreshResponse`                                                                                                                                     |
| `src/lib/dji/types/device.ts`        | `DJIDevice`, `DJIDeviceTopology`, `DJIBoundDevicesResponse`, `DJIDeviceProperty`                                                                                                       |
| `src/lib/dji/types/livestream.ts`    | `StreamCapacity`, `StartStreamRequest`, `StreamResponse`                                                                                                                               |
| `src/lib/dji/types/hms.ts`           | `HMSMessage`, `HMSListResponse`                                                                                                                                                        |
| `src/lib/dji/types/map.ts`           | `ElementGroup`, `MapElement`, `FlightArea`, `FlightAreaSyncRequest`                                                                                                                    |
| `src/lib/dji/types/media.ts`         | `MediaFile`, `FastUploadResponse`, `STSCredentials`                                                                                                                                    |
| `src/lib/dji/types/wayline.ts`       | `Wayline`, `FlightTask`, `JobStatus`                                                                                                                                                   |
| `src/lib/dji/types/control.ts`       | `FlyToPointRequest`, `TakeoffRequest`, `DRCSession`                                                                                                                                    |
| `src/lib/dji/types/user.ts`          | `DJIUser`, `UpdateUserRequest`                                                                                                                                                         |
| `src/lib/dji/types/firmware.ts`      | `FirmwareRelease`, `OTARequest`                                                                                                                                                        |
| `src/lib/dji/types/index.ts`         | Re-exports all types above                                                                                                                                                             |
| `src/app/api/dji/[...path]/route.ts` | **Proxy Route Handler.** Transparently forwards all methods to `http://{IP}:{PORT}/...`, streams the response back, passes through status codes, normalises errors.                    |

### Endpoints Consumed

None — pure infrastructure.

### Pages Powered

None yet.

---

## Phase 2 — Authentication

> **Status:** [ ] Not Started | **Depends on:** Phase 1

**Goal:** Wire up sign-in, JWT storage, silent token refresh, and middleware route protection.

### Files to Create / Modify

| File                              | Action | Purpose                                                                                                                                                                 |
| --------------------------------- | ------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/lib/dji/token-store.ts`      | Create | `getToken()`, `setToken(token, expiresAt)`, `clearToken()` — backed by `localStorage` with expiry timestamp. Swap to httpOnly cookies later without touching consumers. |
| `src/lib/dji/auth-api.ts`         | Create | `loginDJI(username, password, flag)` → stores token. `refreshDJIToken()` → updates store.                                                                               |
| `src/providers/AuthProvider.tsx`  | Create | Context with `{ user, isAuthenticated, login, logout, isLoading }`. Reads token on mount, fetches current user if token exists.                                         |
| `src/providers/Providers.tsx`     | Modify | Wrap `QueryProvider` inside `AuthProvider`.                                                                                                                             |
| `src/middleware.ts`               | Create | Guards all `/(dashboard)/*` routes. Redirects unauthenticated → `/sign-in`. Redirects authenticated users away from `/sign-in` → `/dashboard`.                          |
| `src/hooks/useAuth.ts`            | Create | `useLogin()` mutation, `useCurrentUser()` query. Re-exports auth context values.                                                                                        |
| `src/app/(auth)/sign-in/page.tsx` | Modify | Replace `console.log` / `alert` stub → call `useLogin()`. Show loading state. Show server errors inline via `setError`. Redirect to `/dashboard` on success.            |

### Endpoints Consumed

- `POST /manage/api/v1/login`
- `POST /manage/api/v1/token/refresh`
- `GET /manage/api/v1/users/current`

### Pages Powered

- `/sign-in` — fully functional login
- All `/(dashboard)/*` routes — protected from unauthenticated access

---

## Phase 3 — Device Layer

> **Status:** [ ] Not Started | **Depends on:** Phase 1, 2

**Goal:** Real device listing, binding, unbinding, and property control. Replaces old `drone-api.ts`.

### Files to Create / Modify

| File                                                      | Action | Purpose                                                                                                                                                                                          |
| --------------------------------------------------------- | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `src/lib/dji/device-api.ts`                               | Create | `getDJIDevices()`, `getDJIDevice()`, `bindDevice()`, `getBoundDevices()`, `unbindDevice()`, `setDeviceProperty()`, `getDeviceTopologies()`                                                       |
| `src/hooks/useDJIDevices.ts`                              | Create | `useDJIDevices()` — 30s refetch, maps `DJIDevice[]` to `WebRTCStream` shape so existing stream cards work unchanged. `useBindDevice()`, `useUnbindDevice()`, `useSetDeviceProperty()` mutations. |
| `src/components/features/devices/RegisterDeviceModal.tsx` | Modify | Call `useBindDevice()` when `NEXT_PUBLIC_USE_DJI_CLOUD=true`. Keep old flow as fallback.                                                                                                         |
| `src/app/(dashboard)/dashboard/page.tsx`                  | Modify | Swap `useDronesWebSocket()` → `useDJIDevices()` when flag is set.                                                                                                                                |
| `src/app/(dashboard)/live-feed/page.tsx`                  | Modify | Same swap as dashboard.                                                                                                                                                                          |

### Endpoints Consumed

- `GET /manage/api/v1/devices/{workspace_id}/devices`
- `GET /manage/api/v1/devices/{workspace_id}/devices/{device_sn}`
- `POST /manage/api/v1/devices/binding`
- `GET /manage/api/v1/devices/{workspace_id}/devices/bound`
- `DELETE /manage/api/v1/devices/{device_sn}/unbinding`
- `PUT /manage/api/v1/devices/{workspace_id}/devices/{device_sn}/property`
- `GET /manage/api/v1/workspaces/{workspace_id}/devices/topologies`

### Pages Powered

- `/dashboard` — real device counts and online/offline status
- `/live-feed` — real device list, bind/unbind via modals

---

## Phase 4 — Livestream Layer

> **Status:** [ ] Not Started | **Depends on:** Phase 1, 2, 3

**Goal:** Start/stop streams, switch camera lenses, update quality — all from the DJI API.

### Files to Create / Modify

| File                                                     | Action | Purpose                                                                                                                       |
| -------------------------------------------------------- | ------ | ----------------------------------------------------------------------------------------------------------------------------- |
| `src/lib/dji/livestream-api.ts`                          | Create | `getLiveCapacity()`, `startStream()`, `stopStream()`, `updateStreamQuality()`, `switchStreamCamera()`                         |
| `src/hooks/useLivestream.ts`                             | Create | `useLiveCapacity()` (15s refetch), `useStartStream()`, `useStopStream()`, `useSwitchCamera()`, `useUpdateQuality()` mutations |
| `src/components/features/streams/StreamControlPanel.tsx` | Create | Wide/Zoom/IR toggle buttons, quality selector (HD/SD), Start/Stop. Disabled when device is offline.                           |
| `src/app/(dashboard)/live-feed/page.tsx`                 | Modify | Add `StreamControlPanel` inside fullscreen modal footer.                                                                      |
| `src/app/(dashboard)/ai-detection/page.tsx`              | Modify | Add lens toggle (visible → IR thermal) using `useSwitchCamera()`.                                                             |

### Endpoints Consumed

- `GET /manage/api/v1/live/capacity`
- `POST /manage/api/v1/live/streams/start`
- `POST /manage/api/v1/live/streams/stop`
- `POST /manage/api/v1/live/streams/update`
- `POST /manage/api/v1/live/streams/switch`

### Pages Powered

- `/live-feed` — per-stream start/stop/quality controls
- `/ai-detection` — thermal camera lens switch

---

## Phase 5 — Geospatial Layer

> **Status:** [ ] Not Started | **Depends on:** Phase 1, 2, 3

**Goal:** Live map elements, flight area CRUD, geofence sync to devices.

### Files to Create / Modify

| File                                                 | Action | Purpose                                                                                                                                                                                                               |
| ---------------------------------------------------- | ------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/lib/dji/map-api.ts`                             | Create | `getElementGroups()`, `addElement()`, `updateElement()`, `deleteElement()`, `getFlightAreas()`, `createFlightArea()`, `updateFlightArea()`, `deleteFlightArea()`, `syncFlightAreaToDevices()`, `getMapDeviceStatus()` |
| `src/hooks/useMapElements.ts`                        | Create | `useElementGroups()`, `useFlightAreas()` (60s refetch), `useSyncFlightAreas()` mutation                                                                                                                               |
| `src/components/features/geospaital-map/geo-map.tsx` | Modify | Replace `getAllStreams()` static data → `useDJIDevices()` for live positions. Add flight area polygon layers, draw-mode button, "Sync to Devices" button.                                                             |
| `src/app/(dashboard)/geospatial/page.tsx`            | Modify | Wrap `GeoMap` in `Suspense` boundary.                                                                                                                                                                                 |

### Endpoints Consumed

- `GET /map/api/v1/workspaces/{workspace_id}/element-groups`
- `POST /map/api/v1/workspaces/{workspace_id}/element-groups/{element_group_id}/elements`
- `PUT /map/api/v1/workspaces/{workspace_id}/elements/{element_id}`
- `DELETE /map/api/v1/workspaces/{workspace_id}/elements/{element_id}`
- `DELETE /map/api/v1/workspaces/{workspace_id}/element-groups/{element_group_id}/elements`
- `GET /map/api/v1/workspaces/{workspace_id}/flight-areas`
- `POST /map/api/v1/workspaces/{workspace_id}/flight-area`
- `PUT /map/api/v1/workspaces/{workspace_id}/flight-area/{area_id}`
- `DELETE /map/api/v1/workspaces/{workspace_id}/flight-area/{area_id}`
- `POST /map/api/v1/workspaces/{workspace_id}/flight-area/sync`
- `GET /map/api/v1/workspaces/{workspace_id}/device-status`

### Pages Powered

- `/geospatial` — live drone positions, flight area polygons, geofence management

---

## Phase 6 — Health & Logs Layer

> **Status:** [ ] Not Started | **Depends on:** Phase 1, 2, 3

**Goal:** Replace hardcoded mock data in incidents and logs pages with live HMS messages and device log files.

### Files to Create / Modify

| File                                     | Action | Purpose                                                                                                                                                          |
| ---------------------------------------- | ------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/lib/dji/hms-api.ts`                 | Create | `getWorkspaceHMS()`, `markHMSRead()`, `getDeviceHMSUnread()`                                                                                                     |
| `src/lib/dji/device-logs-api.ts`         | Create | `getUploadedLogs()`, `getDeviceLogs()`, `triggerLogUpload()`, `cancelLogUpload()`, `deleteLogFile()`                                                             |
| `src/hooks/useHMS.ts`                    | Create | `useWorkspaceHMS()` (30s refetch), `useDeviceHMSUnread(deviceSn)`, `useMarkHMSRead()` mutation                                                                   |
| `src/hooks/useDeviceLogs.ts`             | Create | `useDeviceLogs(deviceSn)`, `useTriggerLogUpload()`, `useCancelLogUpload()`, `useDeleteLogFile()` mutations                                                       |
| `src/app/(dashboard)/incidents/page.tsx` | Modify | Replace `const incidents = [...]` hardcoded array → `useWorkspaceHMS()`. Map HMS message structure to existing `Incident` interface. Filter/search UI unchanged. |
| `src/app/(dashboard)/logs/page.tsx`      | Modify | Replace `sampleLogs` → `useDeviceLogs()`. Add device selector dropdown (from `useDJIDevices`). Add "Trigger Upload" and "Cancel Upload" buttons in toolbar.      |

### Endpoints Consumed

- `GET /manage/api/v1/devices/{workspace_id}/devices/hms`
- `PUT /manage/api/v1/devices/{workspace_id}/devices/hms/{device_sn}`
- `GET /manage/api/v1/devices/{workspace_id}/devices/hms/{device_sn}`
- `GET /manage/api/v1/workspaces/{workspace_id}/devices/{device_sn}/logs-uploaded`
- `GET /manage/api/v1/workspaces/{workspace_id}/devices/{device_sn}/logs`
- `POST /manage/api/v1/workspaces/{workspace_id}/devices/{device_sn}/logs`
- `DELETE /manage/api/v1/workspaces/{workspace_id}/devices/{device_sn}/logs`
- `DELETE /manage/api/v1/workspaces/{workspace_id}/devices/{device_sn}/logs/{logs_id}`

### Pages Powered

- `/incidents` — live HMS health alerts as incidents
- `/logs` — real device log files with trigger/cancel/delete

---

## Phase 7 — Waylines & Flight Tasks

> **Status:** [ ] Not Started | **Depends on:** Phase 1, 2, 3

**Goal:** Wayline library browser, KMZ upload, flight task scheduling, pause/resume active jobs.

### Files to Create / Modify

| File                                                   | Action | Purpose                                                                                                                                                                                                                                                     |
| ------------------------------------------------------ | ------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/lib/dji/wayline-api.ts`                           | Create | `getWaylines()`, `getWaylineDownloadUrl()`, `uploadWaylineFile()`, `checkDuplicateNames()`, `uploadWaylineCallback()`, `addFavorite()`, `removeFavorite()`, `createFlightTask()`, `getJobs()`, `deleteJobs()`, `updateJobStatus()`, `setJobMediaPriority()` |
| `src/hooks/useWaylines.ts`                             | Create | `useWaylines()` query, `useFlightJobs()` (15s refetch for active jobs), `useCreateFlightTask()`, `useUpdateJobStatus()`, `useUploadWayline()` mutations                                                                                                     |
| `src/components/features/waylines/WaylineLibrary.tsx`  | Create | Table: name, last modified, actions (Schedule / Download / Favorite). "Schedule" opens modal form (select drone, start time, task type).                                                                                                                    |
| `src/components/features/waylines/FlightJobsTable.tsx` | Create | Active/recent job table with pause/resume/delete per row.                                                                                                                                                                                                   |
| `src/app/(dashboard)/reports/page.tsx`                 | Modify | Replace `sampleReports` → `useFlightJobs()` + `useWaylines()`. Add `WaylineLibrary` and `FlightJobsTable` sections below existing report cards.                                                                                                             |

### Endpoints Consumed

- `GET /wayline/api/v1/workspaces/{workspace_id}/waylines`
- `GET /wayline/api/v1/workspaces/{workspace_id}/waylines/{wayline_id}/url`
- `POST /wayline/api/v1/workspaces/{workspace_id}/waylines/file/upload`
- `GET /wayline/api/v1/workspaces/{workspace_id}/waylines/duplicate-names`
- `POST /wayline/api/v1/workspaces/{workspace_id}/upload-callback`
- `POST /wayline/api/v1/workspaces/{workspace_id}/favorites`
- `DELETE /wayline/api/v1/workspaces/{workspace_id}/favorites`
- `POST /wayline/api/v1/workspaces/{workspace_id}/flight-tasks`
- `GET /wayline/api/v1/workspaces/{workspace_id}/jobs`
- `DELETE /wayline/api/v1/workspaces/{workspace_id}/jobs`
- `PUT /wayline/api/v1/workspaces/{workspace_id}/jobs/{job_id}`
- `POST /wayline/api/v1/workspaces/{workspace_id}/jobs/{job_id}/media-highest`

### Pages Powered

- `/reports` — real wayline library, live flight job status, task scheduling

---

## Phase 8 — Media & Storage Layer

> **Status:** [ ] Not Started | **Depends on:** Phase 1, 2

**Goal:** Media file gallery and STS-backed direct upload to object storage (MinIO/S3).

### Files to Create / Modify

| File                                             | Action | Purpose                                                                                                                                                                                                             |
| ------------------------------------------------ | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/lib/dji/media-api.ts`                       | Create | `getMediaFiles()`, `fastUpload()` (fingerprint dedup check), `uploadCallback()`, `getTinyFingerprints()`                                                                                                            |
| `src/lib/dji/storage-api.ts`                     | Create | `getSTSCredentials()` — returns temporary `accessKeyId`, `secretAccessKey`, `sessionToken`, `endpoint`, `bucket`. Actual upload goes directly to the object store using these credentials, not through the DJI API. |
| `src/hooks/useMedia.ts`                          | Create | `useMediaFiles()` (60s refetch), `useUploadMedia()` mutation — orchestrates: get STS → dedup check via `fastUpload` → upload to object store → call `uploadCallback`                                                |
| `src/components/features/media/MediaGallery.tsx` | Create | Thumbnail grid with file name, size, capture time, download button. File picker triggers `useUploadMedia`.                                                                                                          |
| `src/app/(dashboard)/analytics/page.tsx`         | Modify | Replace `getAllStreams()` static calls → `useDJIDevices()` + `useMediaFiles()`. Add `MediaGallery` section.                                                                                                         |
| `src/app/(dashboard)/reports/page.tsx`           | Modify | Add media file count stat card from `useMediaFiles().data?.length`.                                                                                                                                                 |

### Endpoints Consumed

- `POST /media/api/v1/workspaces/{workspace_id}/fast-upload`
- `POST /media/api/v1/workspaces/{workspace_id}/upload-callback`
- `GET /media/api/v1/files/{workspace_id}/files`
- `POST /media/api/v1/workspaces/{workspace_id}/files/tiny-fingerprints`
- `POST /storage/api/v1/workspaces/{workspace_id}/sts`

### Pages Powered

- `/analytics` — real device + media counts, media gallery
- `/reports` — media file count stat card

---

## Phase 9 — Drone Control Layer ⚠️ HIGH RISK

> **Status:** [ ] Not Started | **Depends on:** Phase 1, 2, 3, 4

**Goal:** RTH, fly-to-point, takeoff, DRC session, payload/authority control.

> ⚠️ **Every control mutation must go through a `ConfirmDialog` before executing.
> These commands are sent to real aircraft.**

### Files to Create / Modify

| File                                                     | Action | Purpose                                                                                                                                                                                                         |
| -------------------------------------------------------- | ------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/lib/dji/control-api.ts`                             | Create | `returnHome()`, `flyToPoint()`, `cancelFlyToPoint()`, `takeoffToPoint()`, `connectDRC()`, `enterDRC()`, `exitDRC()`, `sendPayloadCommand()`, `takeFlightAuthority()`, `takePayloadAuthority()`                  |
| `src/hooks/useDroneControl.ts`                           | Create | Mutations for each control action. Each checks `isConfirmed` param before executing the API call.                                                                                                               |
| `src/components/ui/ConfirmDialog.tsx`                    | Create | Red-styled confirmation modal. Props: `title`, `description`, `onConfirm`, `onCancel`. Used by all control mutations.                                                                                           |
| `src/components/features/controls/DroneCommandPanel.tsx` | Create | Buttons: "Return to Home", "Fly to Point" (opens coordinate input), "Takeoff", "Cancel Mission". Shows DRC session state + authority status. All buttons disabled when device is offline or authority not held. |
| `src/app/(dashboard)/dashboard/page.tsx`                 | Modify | Add `DroneCommandPanel` in right sidebar for selected device.                                                                                                                                                   |
| `src/components/features/geospaital-map/geo-map.tsx`     | Modify | Map-click popup adds "Fly Here" button → calls `useFlyToPoint` with clicked coordinates.                                                                                                                        |

### Endpoints Consumed

- `POST /control/api/v1/devices/{device_sn}/jobs/return_home`
- `POST /control/api/v1/devices/{device_sn}/jobs/fly-to-point`
- `DELETE /control/api/v1/devices/{device_sn}/jobs/fly-to-point`
- `POST /control/api/v1/devices/{device_sn}/jobs/takeoff-to-point`
- `POST /control/api/v1/workspaces/{workspace_id}/drc/connect`
- `POST /control/api/v1/workspaces/{workspace_id}/drc/enter`
- `POST /control/api/v1/workspaces/{workspace_id}/drc/exit`
- `POST /control/api/v1/devices/{device_sn}/payload/commands`
- `POST /control/api/v1/devices/{device_sn}/authority/flight`
- `POST /control/api/v1/devices/{device_sn}/authority/payload`

### Pages Powered

- `/dashboard` — command panel (RTH, fly-to, takeoff, authority)
- `/geospatial` — map-click fly-to-point

---

## Phase 10 — User Management

> **Status:** [ ] Not Started | **Depends on:** Phase 1, 2 | **Can run parallel with Phase 3**

**Goal:** Replace hardcoded users page with live workspace users + inline editing + pagination.

### Files to Create / Modify

| File                                 | Action | Purpose                                                                                                                                                                          |
| ------------------------------------ | ------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/lib/dji/user-api.ts`            | Create | `getCurrentWorkspace()`, `getWorkspaceUsers(page, pageSize)`, `updateWorkspaceUser()`                                                                                            |
| `src/hooks/useUsers.ts`              | Create | `useWorkspaceUsers(page, pageSize)` query, `useUpdateUser()` mutation (invalidates users query on success)                                                                       |
| `src/app/(dashboard)/users/page.tsx` | Modify | Replace `sampleUsers` array → `useWorkspaceUsers()`. Map `DJIUser` to existing `User` interface. Add "Edit" button per row → modal → `useUpdateUser()`. Add pagination controls. |

### Endpoints Consumed

- `GET /manage/api/v1/workspaces/current`
- `GET /manage/api/v1/users/current`
- `GET /manage/api/v1/users/{workspace_id}/users`
- `PUT /manage/api/v1/users/{workspace_id}/users/{user_id}`

### Pages Powered

- `/users` — live user list with inline editing and pagination

---

## Phase 11 — Firmware / OTA

> **Status:** [ ] Not Started | **Depends on:** Phase 1, 2, 3, 8, 9

**Goal:** New Settings page for firmware inventory, file upload, and OTA upgrade trigger.

### Files to Create / Modify

| File                                    | Action | Purpose                                                                                                                                                          |
| --------------------------------------- | ------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/lib/dji/firmware-api.ts`           | Create | `getLatestReleaseNotes()`, `getWorkspaceFirmwares()`, `uploadFirmwareFile()`, `updateFirmwareMetadata()`, `triggerOTA()`                                         |
| `src/hooks/useFirmware.ts`              | Create | `useLatestReleaseNotes()` query, `useWorkspaceFirmwares()` query, `useUploadFirmware()` mutation, `useTriggerOTA()` mutation (uses `ConfirmDialog` from Phase 9) |
| `src/app/(dashboard)/settings/page.tsx` | Create | Tabbed settings page. Firmware tab: release notes banner, firmware table (version, model, enable/disable), upload zone, OTA trigger with device multi-select.    |
| `src/components/layout/sidebar.tsx`     | Modify | Add "Settings" nav item using `Settings` icon from `lucide-react`.                                                                                               |

### Endpoints Consumed

- `GET /manage/api/v1/workspaces/firmware-release-notes/latest`
- `GET /manage/api/v1/workspaces/{workspace_id}/firmwares`
- `POST /manage/api/v1/workspaces/{workspace_id}/firmwares/file/upload`
- `PUT /manage/api/v1/workspaces/{workspace_id}/firmwares/{firmware_id}`
- `POST /manage/api/v1/devices/{workspace_id}/devices/ota`

### Pages Powered

- `/settings` (new page) — firmware inventory, release notes, OTA upgrade trigger

---

## Complete Endpoint Reference

### Manage API (`/manage/api/v1`)

| Method | Path                                                            | Phase | Purpose                        |
| ------ | --------------------------------------------------------------- | ----- | ------------------------------ |
| POST   | `/login`                                                        | 2     | Authenticate, get JWT          |
| POST   | `/token/refresh`                                                | 2     | Refresh expired token          |
| GET    | `/workspaces/current`                                           | 10    | Current workspace info         |
| GET    | `/users/current`                                                | 2     | Authenticated user profile     |
| GET    | `/users/{workspace_id}/users`                                   | 10    | All users in workspace         |
| PUT    | `/users/{workspace_id}/users/{user_id}`                         | 10    | Update user (mqtt credentials) |
| GET    | `/devices/{workspace_id}/devices`                               | 3     | All devices with topology      |
| GET    | `/devices/{workspace_id}/devices/{device_sn}`                   | 3     | Single device details          |
| POST   | `/devices/binding`                                              | 3     | Bind device to workspace       |
| GET    | `/devices/{workspace_id}/devices/bound`                         | 3     | Paginated bound devices        |
| DELETE | `/devices/{device_sn}/unbinding`                                | 3     | Remove device binding          |
| PUT    | `/devices/{workspace_id}/devices/{device_sn}/property`          | 3     | Set device properties          |
| POST   | `/devices/{workspace_id}/devices/ota`                           | 11    | Trigger OTA upgrade            |
| GET    | `/workspaces/firmware-release-notes/latest`                     | 11    | Latest firmware notes          |
| GET    | `/workspaces/{workspace_id}/firmwares`                          | 11    | All workspace firmwares        |
| POST   | `/workspaces/{workspace_id}/firmwares/file/upload`              | 11    | Upload firmware file           |
| PUT    | `/workspaces/{workspace_id}/firmwares/{firmware_id}`            | 11    | Enable/disable firmware        |
| GET    | `/live/capacity`                                                | 4     | Available stream capacity      |
| POST   | `/live/streams/start`                                           | 4     | Start RTMP stream              |
| POST   | `/live/streams/stop`                                            | 4     | Stop active stream             |
| POST   | `/live/streams/update`                                          | 4     | Change stream quality          |
| POST   | `/live/streams/switch`                                          | 4     | Switch camera lens             |
| GET    | `/devices/{workspace_id}/devices/hms`                           | 6     | Health/error messages          |
| PUT    | `/devices/{workspace_id}/devices/hms/{device_sn}`               | 6     | Mark HMS messages read         |
| GET    | `/devices/{workspace_id}/devices/hms/{device_sn}`               | 6     | Unread HMS messages            |
| GET    | `/workspaces/{workspace_id}/devices/{device_sn}/logs-uploaded`  | 6     | Uploaded log files             |
| GET    | `/workspaces/{workspace_id}/devices/{device_sn}/logs`           | 6     | Available log modules          |
| POST   | `/workspaces/{workspace_id}/devices/{device_sn}/logs`           | 6     | Trigger log upload             |
| DELETE | `/workspaces/{workspace_id}/devices/{device_sn}/logs`           | 6     | Cancel log upload              |
| DELETE | `/workspaces/{workspace_id}/devices/{device_sn}/logs/{logs_id}` | 6     | Delete log record              |
| GET    | `/workspaces/{workspace_id}/devices/topologies`                 | 3     | Device topology tree           |

### Map API (`/map/api/v1`)

| Method | Path                                                                    | Phase | Purpose                    |
| ------ | ----------------------------------------------------------------------- | ----- | -------------------------- |
| GET    | `/workspaces/{workspace_id}/element-groups`                             | 5     | All map element groups     |
| POST   | `/workspaces/{workspace_id}/element-groups/{element_group_id}/elements` | 5     | Add map element (GeoJSON)  |
| PUT    | `/workspaces/{workspace_id}/elements/{element_id}`                      | 5     | Update map element         |
| DELETE | `/workspaces/{workspace_id}/elements/{element_id}`                      | 5     | Delete map element         |
| DELETE | `/workspaces/{workspace_id}/element-groups/{element_group_id}/elements` | 5     | Delete all in group        |
| GET    | `/workspaces/{workspace_id}/flight-areas`                               | 5     | All flight areas/geofences |
| POST   | `/workspaces/{workspace_id}/flight-area`                                | 5     | Create flight area         |
| PUT    | `/workspaces/{workspace_id}/flight-area/{area_id}`                      | 5     | Modify flight area         |
| DELETE | `/workspaces/{workspace_id}/flight-area/{area_id}`                      | 5     | Remove flight area         |
| POST   | `/workspaces/{workspace_id}/flight-area/sync`                           | 5     | Push areas to devices      |
| GET    | `/workspaces/{workspace_id}/device-status`                              | 5     | Sync status on devices     |

### Media API (`/media/api/v1`)

| Method | Path                                                 | Phase | Purpose                         |
| ------ | ---------------------------------------------------- | ----- | ------------------------------- |
| POST   | `/workspaces/{workspace_id}/fast-upload`             | 8     | Fingerprint dedup check         |
| POST   | `/workspaces/{workspace_id}/upload-callback`         | 8     | Record GPS/metadata post-upload |
| GET    | `/files/{workspace_id}/files`                        | 8     | All uploaded media files        |
| POST   | `/workspaces/{workspace_id}/files/tiny-fingerprints` | 8     | Batch file existence check      |

### Storage API (`/storage/api/v1`)

| Method | Path                             | Phase | Purpose                            |
| ------ | -------------------------------- | ----- | ---------------------------------- |
| POST   | `/workspaces/{workspace_id}/sts` | 8     | Temporary object-store credentials |

### Wayline API (`/wayline/api/v1`)

| Method | Path                                                     | Phase | Purpose                     |
| ------ | -------------------------------------------------------- | ----- | --------------------------- |
| GET    | `/workspaces/{workspace_id}/waylines`                    | 7     | All wayline/route files     |
| GET    | `/workspaces/{workspace_id}/waylines/{wayline_id}/url`   | 7     | Pre-signed KMZ download URL |
| POST   | `/workspaces/{workspace_id}/upload-callback`             | 7     | Record wayline metadata     |
| GET    | `/workspaces/{workspace_id}/waylines/duplicate-names`    | 7     | Check name uniqueness       |
| POST   | `/workspaces/{workspace_id}/waylines/file/upload`        | 7     | Upload KMZ file             |
| POST   | `/workspaces/{workspace_id}/favorites`                   | 7     | Mark waylines as favorites  |
| DELETE | `/workspaces/{workspace_id}/favorites`                   | 7     | Remove from favorites       |
| POST   | `/workspaces/{workspace_id}/flight-tasks`                | 7     | Create scheduled flight job |
| GET    | `/workspaces/{workspace_id}/jobs`                        | 7     | All flight jobs             |
| DELETE | `/workspaces/{workspace_id}/jobs`                        | 7     | Cancel pending jobs         |
| PUT    | `/workspaces/{workspace_id}/jobs/{job_id}`               | 7     | Pause (0) or resume (1) job |
| POST   | `/workspaces/{workspace_id}/jobs/{job_id}/media-highest` | 7     | Set job media priority      |

### Control API (`/control/api/v1`)

| Method | Path                                         | Phase | Purpose                     |
| ------ | -------------------------------------------- | ----- | --------------------------- |
| POST   | `/devices/{device_sn}/jobs/return_home`      | 9     | Command RTH                 |
| POST   | `/devices/{device_sn}/jobs/fly-to-point`     | 9     | Fly to GPS coordinate       |
| DELETE | `/devices/{device_sn}/jobs/fly-to-point`     | 9     | Cancel fly-to command       |
| POST   | `/devices/{device_sn}/jobs/takeoff-to-point` | 9     | Takeoff and fly to point    |
| POST   | `/workspaces/{workspace_id}/drc/connect`     | 9     | Establish DRC session       |
| POST   | `/workspaces/{workspace_id}/drc/enter`       | 9     | Enter remote control mode   |
| POST   | `/workspaces/{workspace_id}/drc/exit`        | 9     | Exit remote control mode    |
| POST   | `/devices/{device_sn}/payload/commands`      | 9     | Camera/payload commands     |
| POST   | `/devices/{device_sn}/authority/flight`      | 9     | Take over flight authority  |
| POST   | `/devices/{device_sn}/authority/payload`     | 9     | Take over payload authority |

---

## Progress Tracker

| Phase | Description                                         | Status          |
| ----- | --------------------------------------------------- | --------------- |
| 1     | Foundation — API client, types, proxy Route Handler | [ ] Not Started |
| 2     | Authentication — sign-in, JWT, middleware           | [ ] Not Started |
| 3     | Device Layer — listing, binding, properties         | [ ] Not Started |
| 4     | Livestream Layer — start/stop/switch/update         | [ ] Not Started |
| 5     | Geospatial Layer — map elements, flight areas       | [ ] Not Started |
| 6     | Health & Logs — HMS, device log upload              | [ ] Not Started |
| 7     | Waylines & Flight Tasks — upload, schedule, pause   | [ ] Not Started |
| 8     | Media & Storage — gallery, STS upload               | [ ] Not Started |
| 9     | Drone Control — RTH, fly-to, DRC, authority         | [ ] Not Started |
| 10    | User Management — list, edit, paginate              | [ ] Not Started |
| 11    | Firmware / OTA — inventory, upload, trigger         | [ ] Not Started |

---

_Last updated: 2026-04-13_
