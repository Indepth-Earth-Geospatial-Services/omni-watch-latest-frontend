# DJI Dock 3 Maintenance & Debug Mode — Implementation Spec

## Context

We have a working DJI Dock 3 + Matrice 4TD setup talking to a FastAPI backend over the DJI Cloud API (MQTT thing model). A standalone HTML prototype validates the full flow end-to-end. This spec ports the validated debug-mode feature into the production codebase.

A reference implementation is available at `drone_tracker_3d.html` (attach it alongside this spec when invoking Claude Code). The HTML uses vanilla JS, CesiumJS, and the `mqtt.min.js` browser client — adapt to whichever framework the target project uses (React/Vue/etc.).

---

## Goal

Implement a Dock Maintenance panel that lets an operator enable DJI's **Remote Debug Mode** on the dock and issue the restricted hardware commands it unlocks (cover open/close, drone power, charging, lights, AC, alarm, battery maintenance, image-transmission mode, dock reboot).

---

## Backend API contract

The backend already exposes:

```
POST /control/api/v1/devices/{dock_sn}/jobs/{service_identifier}
Body: { "action": <int> }
```

**Critical convention**: the backend requires an `action` field in **every** `/jobs/*` body, including for services the DJI thing-model spec marks as `Data: null` (e.g. `debug_mode_open`, `cover_open`, `drone_open`). Without it the backend returns `code -1, message: "action must not be null"`.

For services that don't take a meaningful action, send `{"action": 0}`. For toggle services, the action value carries the on/off bit.

### Service identifiers

**Mode toggles (no debug mode required)**
| service_identifier | body | description |
|---|---|---|
| `debug_mode_open` | `{action: 0}` | Enter remote debug mode |
| `debug_mode_close` | `{action: 0}` | Exit remote debug mode |
| `return_home` | `{action: 0}` | One-key RTH |
| `return_home_cancel` | `{action: 0}` | Cancel RTH |

**Restricted commands (require debug mode active first)**

No-payload class (send `{action: 0}`):
- `device_reboot` — reboot the dock
- `drone_open` / `drone_close` — power drone on/off
- `cover_open` / `cover_close` — dock cover
- `charge_open` / `charge_close` — charging
- `supplement_light_open` / `supplement_light_close` — dock spotlight
- `device_format` / `drone_format` — **destructive**, require explicit confirmation

Action-carrying class:
- `alarm_state_switch` — `{action: 0}` disable / `{action: 1}` enable
- `battery_maintenance_switch` — `{action: 0}` disable / `{action: 1}` enable
- `battery_store_mode_switch` — `{action: 1}` plan store / `{action: 2}` emergency store
- `air_conditioner_mode_switch` — `{action: 0}` idle / `1` cooling / `2` heating / `3` dehumidification (Dock 3 only)
- `sdr_workmode_switch` — `{action: 0}` SDR only / `{action: 1}` 4G enhanced

> The backend transparently maps `action` to whatever the underlying MQTT field is called (the DJI spec calls it `link_workmode` for sdr_workmode_switch, `action` for others). Send `action` consistently.

### Response shape

Success: `{ code: 0, message: "ok", data: ... }`
Failure: `{ code: -1, message: "<reason>", data: null }`

Common failure messages worth handling:
- `"action must not be null"` — body missing action field
- `"The current state of the dock does not support this function."` — dock not in correct mode_code, or dock offline from backend's perspective
- `"The dock is offline."` — backend's online tracker thinks dock is disconnected

---

## MQTT subscriptions needed by the frontend

The frontend connects to the same broker as the dock and subscribes to:

```
thing/product/+/osd       # required — for dock state tracking
thing/product/+/events    # required if implementing HMS health warnings
```

The frontend does **not** need to publish anything for the debug-mode feature — all dock commands go through the backend's HTTP API. The DRC link (live flight control) is a separate channel; not required for maintenance.

### OSD message shape (relevant fields)

```json
{
  "method": "...",
  "data": {
    "mode_code": 0,            // ← primary signal for debug mode state
    "latitude": 4.85,
    "longitude": 7.04,
    "drone_in_dock": 1,
    "cover_state": 0,
    "temperature": 28.5,
    ...
  }
}
```

`mode_code` enum (Dock 3 thing model):
- `0` — IDLE
- `1` — On-site debugging (Pilot 2 connected to RC Plus at the dock)
- `2` — **Remote debugging** ← this is what `debug_mode_open` puts the dock into
- `3` — Firmware upgrade in progress
- `4` — In operation (wayline running)

---

## Frontend behavior

### Component: `<DockMaintenancePanel>` (or equivalent)

A panel (drawer, modal, or dedicated route) containing:

1. **State card** at the top showing current debug mode status and the raw `mode_code`.
2. **Toggle button** that calls `POST /jobs/debug_mode_open` (when off) or `/jobs/debug_mode_close` (when on).
3. **Grouped command buttons** for each restricted command. Disabled unless `debugModeActive === true`.

### State

```ts
interface DockMaintenanceState {
  debugModeActive: boolean;   // derived from latest OSD mode_code === 2
  dockModeCode: number;       // last seen mode_code (default -1)
  dockOnline: boolean;        // freshness check: any OSD/event in last 8s
  lastCommandResult: {
    method: string;
    code: number;
    message: string;
    at: number;               // timestamp
  } | null;
}
```

### Critical rules

1. **State is read from OSD, never from API response.** When the operator clicks "Enable Debug Mode", call the API but do not flip `debugModeActive` to true on success. Wait for the next OSD payload where `mode_code === 2`. The OSD is the only source of truth.

2. **Confirm before sending `debug_mode_open` if `dockModeCode !== 0`.** The dock will reject the command if it's not idle (a mission is running, firmware upgrading, etc.). Show a confirm dialog explaining this before sending.

3. **Disable all restricted command buttons when `debugModeActive` is false.** A user clicking a restricted button without debug mode should get a clear toast/notification, not a silent API call.

4. **Surface API failures with the backend's `message` string.** Don't swallow them. The backend's failure messages are the operator's primary diagnostic.

5. **Show the raw `mode_code` number alongside the label.** Operators may need to see `dock=IDLE (0)` vs `dock=UNKNOWN (—)` to tell if the dock is reporting state at all.

6. **Destructive commands (`device_format`, `drone_format`, `device_reboot`) require a second confirmation.** Reboot interrupts any active mission; format wipes data. A simple `window.confirm()` or modal is fine.

---

## State machine

```
                    ┌────────────────────────────────┐
                    │  Dock not subscribed / offline │
                    │  debugModeActive: false        │
                    │  All buttons disabled          │
                    └────────────────────────────────┘
                                  │
                       (OSD arrives, mode_code = 0)
                                  ▼
                    ┌────────────────────────────────┐
                    │  IDLE                          │
                    │  Toggle button: "Enable"       │
                    │  Restricted buttons disabled   │
                    └────────────────────────────────┘
                                  │
                       (user clicks Enable → POST debug_mode_open)
                       (wait for OSD mode_code = 2)
                                  ▼
                    ┌────────────────────────────────┐
                    │  REMOTE DEBUG (mode_code = 2)  │
                    │  Toggle button: "Disable"      │
                    │  Restricted buttons ENABLED    │
                    └────────────────────────────────┘
                                  │
                       (user clicks Disable → POST debug_mode_close)
                       (wait for OSD mode_code = 0)
                                  ▼
                              (back to IDLE)
```

Other `mode_code` values (`1` On-site, `3` Upgrading, `4` Working) treat as "debug mode unavailable" — show the state but don't expose the toggle as actionable.

---

## Implementation order

1. **Backend sanity check.** Confirm `/control/api/v1/devices/{dock_sn}/jobs/{service_identifier}` exists and accepts `{action: 0}`. Hit `debug_mode_open` from Postman/curl and confirm a `{code: 0}` response.

2. **MQTT subscription.** Add `thing/product/+/osd` to the frontend's existing MQTT client (or create one if there isn't one). Parse incoming messages, extract `mode_code` from dock SN's topic, store in state.

3. **State + freshness.** Track `lastSeen` timestamp; flag dock as offline if no message in 8 seconds.

4. **Render the panel.** Mode status card + toggle + disabled-by-default command grid.

5. **Wire the toggle.** Click → API call → wait for OSD confirmation. Add the confirm-if-not-idle dialog.

6. **Wire restricted commands.** Each button → `POST /jobs/{service_id}` with `{action: 0}` or specific action value.

7. **Failure handling.** Display backend error messages in a toast or persistent log strip.

8. **Confirmation dialogs for destructive operations.**

---

## Gotchas / lessons learned the hard way

- **`action` is mandatory on every job body.** The backend's docs say "No Payload Required" for some services, but the runtime requires `{action: 0}` minimum. This is the #1 cause of `code: -1, message: "action must not be null"` failures.

- **Optimistic state updates create ghost states.** If you flip `debugModeActive = true` on API success, then the dock refuses to enter debug mode (e-stop pressed, mission running), the UI thinks debug mode is active but it isn't. Always wait for OSD confirmation.

- **The backend's "is online" check can lag the broker.** The DJI Cloud API uses `sys/product/{sn}/status` for device online/offline events, separate from OSD freshness. If the backend isn't subscribed to that topic, it may report dock as offline even when OSD is flowing. The frontend's freshness check (last OSD timestamp) is more reliable than asking the backend.

- **`mode_code` is the only correct debug-mode indicator.** Don't infer from cover state, charging state, or any other field. The DJI thing model treats `mode_code` as authoritative for the dock's working mode.

- **Physical E-stop button on the dock blocks all restricted commands.** The DJI doc enumerates a `check_scram_state` ("emergency stop button status") step in the event progress messages. If your operator reports "commands fail even in debug mode", first check whether the physical red button on the dock is depressed.

- **Dock 3 firmware version matters.** Some commands (`air_conditioner_mode_switch`, `esim_*`) only exist on Dock 3. If targeting both Dock 1 and Dock 3, gate these by device type.

- **MQTT topic prefix is exactly `thing/product/{sn}/`.** No leading slash, all lowercase, SN exactly as registered (case-sensitive). One typo and you'll never receive OSD.

---

## Testing checklist

- [ ] With dock idle, click Enable Debug Mode → OSD `mode_code` flips to 2 within ~3s → toggle changes to "Disable" and command buttons enable.
- [ ] Click Disable Debug Mode → OSD `mode_code` flips back to 0 → buttons disable.
- [ ] Try Enable while a mission is running (mode_code=4) → confirm dialog appears → if confirmed, API returns failure with descriptive message.
- [ ] Click a restricted command (e.g. Cover Open) while debug mode is OFF → toast warning, no API call.
- [ ] Click Cover Open while in debug mode → cover physically opens, OSD `cover_state` flips to 1.
- [ ] Reboot dock → confirm dialog → after acknowledgment, dock pill goes offline within 10s, comes back ~60s later.
- [ ] Send malformed body (missing `action`) directly in DevTools → confirm backend returns `"action must not be null"`.
- [ ] Disconnect dock physically → after 8s, dock pill goes red, all buttons disable.

---

## Appendix A — Related features (port separately when ready)

These were built alongside debug mode in the reference HTML and follow the same patterns.

### HMS health warnings

Subscribe to `thing/product/+/events`, filter for `method === "hms"`, and surface `data.list[]` items as toast-style cards. Each entry has `level` (0 Notification, 1 Reminder, 2 Warning), `code`, `module`, `in_the_sky`, `device_type`, `imminent`. De-dupe by `code` so repeated warnings don't stack. Auto-dismiss level 0/1 after ~30s; level 2 sticks until user dismisses.

### DRC stick_control migration

The Cloud API doc explicitly marks `drone_control` (m/s velocity-based) as deprecated. Replace with `stick_control` (1024±660 channel-based, 1024 = neutral). Publish at 5–10 Hz on `thing/product/{sn}/drc/down`. Mapping: roll = lateral, pitch = forward, throttle = vertical, yaw = rotation. `seq` increments at the top level (sibling of `method` and `data`), not inside `data` like `drone_control` did.

### Per-device online indicator

Track `lastSeen[sn]` updated on every incoming MQTT message from that SN. A device is "online" if last message arrived within 8 seconds. Display as a colored pill with a "Xs ago" counter. Differentiates "dock physically off" from "frontend disconnected from broker" — the existing broker-status indicator only tells you the latter.

---

## Appendix B — File references

- `drone_tracker_3d.html` — working reference implementation
- Backend route handlers — `<discover via Claude Code>`
- Existing MQTT client setup — `<discover via Claude Code>`
- Existing API client / fetch wrapper — `<discover via Claude Code>`
