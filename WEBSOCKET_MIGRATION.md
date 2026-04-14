# WebSocket Migration Guide

## Overview

This guide helps you migrate from polling-based drone updates to WebSocket real-time updates.

## The Problem: Polling

The current `useDrones` hook polls the API every 30 seconds:

```typescript
// ❌ OLD: Polling approach (useDrones.ts)
export function useDrones(pollingInterval: number = 30000) {
  return useQuery({
    queryKey: ['drones'],
    queryFn: getAllDrones,
    refetchInterval: pollingInterval,  // Polls every 30 seconds!
    // ...
  });
}
```

**Issues with polling:**
- Unnecessary API calls every 30 seconds
- Delayed updates (up to 30 seconds)
- Higher server load
- Network bandwidth waste

## The Solution: WebSocket

The new `useDronesWebSocket` hook uses WebSocket for instant updates:

```typescript
// ✅ NEW: WebSocket approach (useDronesWebSocket.ts)
export function useDronesWebSocket(options) {
  // Fetches drones once on mount
  // Then listens to WebSocket for real-time updates
  // No polling!
}
```

**Benefits:**
- ✅ Instant updates (sub-second)
- ✅ No unnecessary API calls
- ✅ Lower server load
- ✅ Better user experience

---

## Migration Steps

### Step 1: Install socket.io-client

```bash
cd Frontend/command-line-frontend
npm install socket.io-client
```

### Step 2: Update Environment Variables

Add WebSocket URL to `.env.local`:

```bash
# .env.local
NEXT_PUBLIC_DRONE_API_URL=http://127.0.0.1:5000/api/v1/drones
NEXT_PUBLIC_WS_URL=http://localhost:5000
```

### Step 3: Replace Imports

**Before:**
```typescript
import { useDrones, useActiveDrones, useAIDrones } from '@/hooks/useDrones';
```

**After:**
```typescript
import { useDronesWebSocket, useActiveDronesWebSocket, useAIDronesWebSocket } from '@/hooks/useDronesWebSocket';
```

### Step 4: Update Hook Usage

#### Basic Usage

**Before:**
```typescript
function MyComponent() {
  const { data: drones, isLoading, error } = useDrones(30000);

  return (
    <div>
      {isLoading && <p>Loading...</p>}
      {error && <p>Error: {error.message}</p>}
      {drones?.map(drone => <DroneCard key={drone.id} drone={drone} />)}
    </div>
  );
}
```

**After:**
```typescript
function MyComponent() {
  const { drones, isLoading, error, isConnected } = useDronesWebSocket();

  return (
    <div>
      {isLoading && <p>Loading...</p>}
      {error && <p>Error: {error.message}</p>}
      {!isConnected && <p>⚠️ Disconnected from real-time updates</p>}
      {drones.map(drone => <DroneCard key={drone.id} drone={drone} />)}
    </div>
  );
}
```

#### Active Drones

**Before:**
```typescript
const { data: activeDrones } = useActiveDrones(30000);
```

**After:**
```typescript
const { drones: activeDrones, isConnected } = useActiveDronesWebSocket();
```

#### AI-Enabled Drones

**Before:**
```typescript
const { data: aiDrones } = useAIDrones(30000);
```

**After:**
```typescript
const { drones: aiDrones, isConnected } = useAIDronesWebSocket();
```

#### Single Drone Subscription

**New feature** - Subscribe to only one drone's events:

```typescript
function DroneDetailPage({ serialNumber }: { serialNumber: string }) {
  const { drone, isConnected } = useSingleDroneWebSocket(serialNumber);

  return (
    <div>
      {drone && <DroneDetails drone={drone} />}
      {isConnected && <span>🟢 Live</span>}
    </div>
  );
}
```

---

## Component Migration Examples

### Example 1: Drone List Page

**Before (useDrones.ts):**
```typescript
// pages/drones.tsx
import { useDrones } from '@/hooks/useDrones';

export default function DronesPage() {
  const { data: drones, isLoading, error, refetch } = useDrones(30000);

  if (isLoading) return <p>Loading...</p>;
  if (error) return <p>Error loading drones</p>;

  return (
    <div>
      <button onClick={() => refetch()}>Refresh</button>
      {drones?.map(drone => (
        <DroneCard key={drone.id} drone={drone} />
      ))}
    </div>
  );
}
```

**After (useDronesWebSocket.ts):**
```typescript
// pages/drones.tsx
import { useDronesWebSocket } from '@/hooks/useDronesWebSocket';

export default function DronesPage() {
  const { drones, isLoading, error, isConnected, refresh } = useDronesWebSocket();

  if (isLoading) return <p>Loading...</p>;
  if (error) return <p>Error loading drones</p>;

  return (
    <div>
      <div className="status-bar">
        {isConnected ? '🟢 Live Updates' : '🔴 Disconnected'}
        <button onClick={refresh}>Refresh</button>
      </div>
      {drones.map(drone => (
        <DroneCard key={drone.id} drone={drone} />
      ))}
    </div>
  );
}
```

### Example 2: Active Streams Dashboard

**Before:**
```typescript
import { useActiveDrones } from '@/hooks/useDrones';

export default function ActiveStreams() {
  const { data: activeDrones } = useActiveDrones(10000); // Polls every 10s

  return (
    <div>
      <h2>Active Streams ({activeDrones?.length || 0})</h2>
      {activeDrones?.map(drone => (
        <VideoPlayer key={drone.id} stream={drone} />
      ))}
    </div>
  );
}
```

**After:**
```typescript
import { useActiveDronesWebSocket } from '@/hooks/useDronesWebSocket';

export default function ActiveStreams() {
  const { drones: activeDrones, isConnected } = useActiveDronesWebSocket();

  return (
    <div>
      <h2>
        Active Streams ({activeDrones.length})
        {isConnected && <span className="live-badge">LIVE</span>}
      </h2>
      {activeDrones.map(drone => (
        <VideoPlayer key={drone.id} stream={drone} />
      ))}
    </div>
  );
}
```

---

## API Reference

### `useDronesWebSocket(options?)`

Fetch all drones with WebSocket real-time updates.

**Options:**
```typescript
interface UseDronesWebSocketOptions {
  subscribeToAll?: boolean;   // Subscribe to all drone events (default: true)
  droneSerial?: string;        // Subscribe to specific drone only
}
```

**Returns:**
```typescript
{
  drones: WebRTCStream[];      // Array of drones
  isLoading: boolean;          // Initial loading state
  error: Error | null;         // Error state
  isConnected: boolean;        // WebSocket connection status
  refresh: () => Promise<void>; // Manually refresh all drones
  socket: Socket | null;       // Socket.IO instance (for advanced use)
}
```

### `useActiveDronesWebSocket()`

Returns only drones with `streamIsOn === true`.

### `useAIDronesWebSocket()`

Returns only drones with `isUsingAiDetection === true` and `streamIsOn === true`.

### `useSingleDroneWebSocket(droneSerial: string)`

Subscribe to a specific drone's events only.

---

## WebSocket Events Received

The hooks automatically handle these events:

| Event Type | Description | Trigger |
|-----------|-------------|---------|
| `drone.created` | New drone registered | POST /api/v1/drones/register |
| `drone.updated` | Drone data changed | PATCH /api/v1/drones/:id |
| `drone.stream.status` | Stream toggled on/off | PATCH with `streamIsOn` |
| `drone.ai.detection.toggled` | AI detection toggled | PATCH with `isUsingAiDetection` |
| `drone.detection.classes.changed` | Detection classes updated | PATCH with `detectionClasses` |
| `drone.deleted` | Drone removed | DELETE /api/v1/drones/:id |

---

## Testing the Migration

### 1. Start Backend with WebSocket Support

```bash
cd Backend/drone-mangement-system-backend
npm run dev
```

You should see:
```
✓ All services initialized successfully
  - MongoDB: Connected
  - Redis: Connected
  - WebSocket: Running at /ws/events
```

### 2. Update Your Frontend Component

Replace one usage of `useDrones` with `useDronesWebSocket` in a test page.

### 3. Test Real-Time Updates

Open your frontend and:
1. Watch the Network tab - you should see **no more polling** to `/api/v1/drones`
2. Open the test client: `test-websocket-client.html`
3. Update a drone via API:
   ```bash
   curl -X PATCH http://localhost:5000/api/v1/drones/sn/DRONE123 \
     -H "Content-Type: application/json" \
     -d '{"streamIsOn": true}'
   ```
4. Your frontend should update **instantly** without any API call!

---

## Gradual Migration Strategy

You don't have to migrate everything at once. Here's a safe approach:

### Phase 1: Test with One Component
1. Pick a non-critical component (e.g., drone list page)
2. Replace `useDrones` with `useDronesWebSocket`
3. Test thoroughly

### Phase 2: Migrate Active Streams
1. Replace `useActiveDrones` with `useActiveDronesWebSocket`
2. Verify real-time stream status updates work

### Phase 3: Migrate AI Dashboard
1. Replace `useAIDrones` with `useAIDronesWebSocket`
2. Test AI detection toggle updates

### Phase 4: Keep Old Hook as Fallback
You can keep both hooks and add a feature flag:

```typescript
// config/features.ts
export const USE_WEBSOCKET = process.env.NEXT_PUBLIC_USE_WEBSOCKET === 'true';

// In your component:
import { USE_WEBSOCKET } from '@/config/features';
import { useDrones } from '@/hooks/useDrones';
import { useDronesWebSocket } from '@/hooks/useDronesWebSocket';

function MyComponent() {
  const pollingResult = useDrones(30000);
  const websocketResult = useDronesWebSocket();

  const { drones, isLoading, error } = USE_WEBSOCKET ? websocketResult : pollingResult;

  // Rest of component...
}
```

---

## Troubleshooting

### WebSocket Not Connecting

**Issue:** `isConnected` is always `false`

**Solutions:**
1. Check backend is running: `http://localhost:5000`
2. Verify Redis is running: `docker ps | grep redis`
3. Check environment variable: `NEXT_PUBLIC_WS_URL=http://localhost:5000`
4. Check browser console for WebSocket errors

### No Real-Time Updates

**Issue:** Updates don't appear instantly

**Solutions:**
1. Check subscription: Look for `[WebSocket] Subscription confirmed` in console
2. Verify event handling: Look for `[WebSocket] Drone event received` in console
3. Test with the test client: `test-websocket-client.html`
4. Check backend logs for published events

### CORS Errors

**Issue:** WebSocket connection blocked by CORS

**Solution:** Backend already has CORS enabled for all origins. If you still see errors:

```typescript
// Backend: src/services/websocketServer.ts (already configured)
this.io = new SocketIOServer(httpServer, {
  cors: {
    origin: '*', // ✅ Already set
    methods: ['GET', 'POST']
  }
});
```

---

## Performance Comparison

### Before (Polling)

```
Time: 0s   -> Fetch all drones (GET /api/v1/drones)
Time: 30s  -> Fetch all drones (GET /api/v1/drones)
Time: 60s  -> Fetch all drones (GET /api/v1/drones)
Time: 90s  -> Fetch all drones (GET /api/v1/drones)
```

**10 minutes = 20 API calls** (even if nothing changed!)

### After (WebSocket)

```
Time: 0s   -> Fetch all drones once (GET /api/v1/drones)
Time: 0s   -> Establish WebSocket connection
Time: 45s  -> Drone updated → Instant WebSocket event
Time: 120s -> New drone added → Instant WebSocket event
```

**10 minutes = 1 API call + real-time events only when needed!**

---

## Next Steps

1. ✅ Install `socket.io-client`
2. ✅ Add `NEXT_PUBLIC_WS_URL` to `.env.local`
3. ✅ Replace one component's `useDrones` with `useDronesWebSocket`
4. ✅ Test real-time updates
5. ✅ Gradually migrate other components
6. ✅ Remove polling interval from all components
7. ✅ Remove old `useDrones` hook (once fully migrated)

---

## Questions?

- Backend architecture: See `Backend/drone-mangement-system-backend/ARCHITECTURE.md`
- WebSocket setup: See `Backend/drone-mangement-system-backend/REDIS_WEBSOCKET_SETUP.md`
- Test client: Open `Backend/drone-mangement-system-backend/test-websocket-client.html`
