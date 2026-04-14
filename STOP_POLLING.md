# Stop Polling - Quick Fix Guide

## The Problem

You're seeing timestamps every few seconds in your test HTML file because your frontend is polling `/api/v1/drones` every **30 seconds**.

## What's Causing It

### File: `src/hooks/useDrones.ts`

This hook polls the API repeatedly:

```typescript
// Line 41-46
export function useDrones(pollingInterval: number = 30000) {
  return useQuery({
    queryKey: ['drones'],
    queryFn: getAllDrones,
    refetchInterval: pollingInterval,  // ❌ Polls every 30 seconds!
    refetchOnWindowFocus: true,         // ❌ Also polls when you focus window
    staleTime: 10000,
    // ...
  });
}
```

**Three hooks are polling:**
1. `useDrones()` - Polls every 30 seconds
2. `useActiveDrones()` - Polls every 30 seconds
3. `useAIDrones()` - Polls every 30 seconds

## Where It's Being Used

Find all components using these hooks:

```bash
cd "Frontend/command-line-frontend"
grep -r "useDrones\|useActiveDrones\|useAIDrones" src/ --include="*.tsx" --include="*.ts"
```

Common locations:
- Dashboard pages
- Drone list pages
- Active streams page
- AI detection pages

## The Solution

Replace polling with WebSocket real-time updates.

### Quick Migration (Single Component)

**Step 1:** Find a component using `useDrones`:

```typescript
// Before
import { useDrones } from '@/hooks/useDrones';

function DronesPage() {
  const { data: drones, isLoading, error } = useDrones();
  // ...
}
```

**Step 2:** Replace with WebSocket version:

```typescript
// After
import { useDronesWebSocket } from '@/hooks/useDronesWebSocket';

function DronesPage() {
  const { drones, isLoading, error, isConnected } = useDronesWebSocket();
  // ...
}
```

**Changes:**
- ✅ `data` → `drones` (no wrapper)
- ✅ Add `isConnected` for connection status
- ✅ No more polling!

### Add Environment Variable

Create/update `.env.local`:

```bash
NEXT_PUBLIC_WS_URL=http://localhost:5000
```

---

## Test It's Working

### 1. Before Migration - See Polling

Open browser DevTools → Network tab → Filter: `drones`

You'll see:
```
GET /api/v1/drones  [Status: 200]  (0:00)
GET /api/v1/drones  [Status: 200]  (0:30)  ← 30 seconds later
GET /api/v1/drones  [Status: 200]  (1:00)  ← 30 seconds later
GET /api/v1/drones  [Status: 200]  (1:30)  ← 30 seconds later
```

### 2. After Migration - No Polling

Network tab shows:
```
GET /api/v1/drones  [Status: 200]  (0:00)  ← Only once on mount
WS  /ws/events      [Status: 101]  (0:01)  ← WebSocket connection
```

### 3. Test Real-Time Updates

Open two browser tabs:
1. **Tab 1:** Your frontend with WebSocket
2. **Tab 2:** Test client (`test-websocket-client.html`)

Update a drone:
```bash
curl -X PATCH http://localhost:5000/api/v1/drones/sn/DRONE123 \
  -H "Content-Type: application/json" \
  -d '{"streamIsOn": true}'
```

**Result:** Both tabs update **instantly** with no API calls!

---

## Migration Checklist

- [ ] Verify backend is running with WebSocket support
  ```bash
  cd Backend/drone-mangement-system-backend
  npm run dev
  # Look for: "✓ WebSocket: Running at /ws/events"
  ```

- [ ] Verify Redis is running
  ```bash
  docker ps | grep redis
  ```

- [ ] Add environment variable
  ```bash
  echo "NEXT_PUBLIC_WS_URL=http://localhost:5000" >> Frontend/command-line-frontend/.env.local
  ```

- [ ] Find components using polling hooks
  ```bash
  grep -r "useDrones\|useActiveDrones\|useAIDrones" Frontend/command-line-frontend/src/
  ```

- [ ] Replace one component at a time
  - [ ] Import `useDronesWebSocket` instead of `useDrones`
  - [ ] Update destructured props (`data` → `drones`)
  - [ ] Test real-time updates work

- [ ] Remove polling interval parameters
  - Before: `useDrones(30000)`
  - After: `useDronesWebSocket()` (no parameter)

- [ ] Test in production environment

---

## Rollback Plan (If Needed)

If WebSocket isn't working, you can temporarily disable it:

### Option 1: Use Both (Feature Flag)

```typescript
const USE_WEBSOCKET = false; // Toggle here

function MyComponent() {
  const pollingData = useDrones(30000);
  const websocketData = useDronesWebSocket();

  const { drones, isLoading, error } = USE_WEBSOCKET ? websocketData : pollingData;
}
```

### Option 2: Revert Import

```typescript
// Revert to polling
import { useDrones } from '@/hooks/useDrones';  // Old version
// import { useDronesWebSocket } from '@/hooks/useDronesWebSocket';  // New version
```

---

## Performance Impact

### Current (Polling)
- 1 frontend instance = **120 API calls/hour**
- 10 users = **1,200 API calls/hour**
- 100 users = **12,000 API calls/hour**

### After WebSocket
- 1 frontend instance = **1 API call on mount** + events only
- 10 users = **10 API calls on mount** + events only
- 100 users = **100 API calls on mount** + events only

**Result:** 99% reduction in API calls!

---

## Summary

**The Problem:**
- `useDrones()` polls `/api/v1/drones` every 30 seconds
- This creates constant GET requests you're seeing

**The Solution:**
- Replace with `useDronesWebSocket()` for real-time updates
- No more polling, instant updates via WebSocket

**Next Step:**
```bash
# 1. Find where it's used
grep -r "useDrones" Frontend/command-line-frontend/src/ --include="*.tsx"

# 2. Replace import in one file
# Before: import { useDrones } from '@/hooks/useDrones';
# After:  import { useDronesWebSocket } from '@/hooks/useDronesWebSocket';

# 3. Test it works
```

**Full guide:** See [WEBSOCKET_MIGRATION.md](./WEBSOCKET_MIGRATION.md)
