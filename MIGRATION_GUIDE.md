# Frontend Migration Guide: Static Config → Database Integration

## Overview

The frontend has been migrated from static configuration files to **database-driven** stream management with automatic polling for real-time updates.

---

## What Changed

### Before (Static Config)
```typescript
import { webrtcStreams } from '@/config/webrtc-streams';

function MyComponent() {
  const streams = webrtcStreams; // Hardcoded, never updates
  // ...
}
```

### After (Database + React Query)
```typescript
import { useDrones } from '@/hooks/useDrones';

function MyComponent() {
  const { data: streams, isLoading, error } = useDrones(30000); // Auto-updates every 30s
  // ...
}
```

---

## Setup Required

### 1. Install React Query (if not already installed)

```bash
npm install @tanstack/react-query
```

### 2. Add React Query Provider to your app

Update your main App component or `main.tsx`:

```typescript
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: true,
      retry: 3,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      {/* Your app components */}
    </QueryClientProvider>
  );
}
```

### 3. Create `.env` file (optional)

```env
# Drone Management API URL
VITE_DRONE_API_URL=http://127.0.0.1:5000/api/v1/drones
```

---

## Usage Examples

### Example 1: Fetch All Drones

```typescript
import { useDrones } from '@/hooks/useDrones';

function DroneList() {
  const { data: streams, isLoading, error, refetch } = useDrones(30000);

  if (isLoading) return <div>Loading drones...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div>
      <h2>All Drones ({streams?.length || 0})</h2>
      <button onClick={() => refetch()}>Refresh Now</button>

      {streams?.map((stream) => (
        <div key={stream.id}>
          <h3>{stream.metadata?.alias || stream.name}</h3>
          <p>Status: {stream.isOnline ? 'Online' : 'Offline'}</p>
          <p>Clean Stream: {stream.streamUrl}</p>
          {stream.metadata?.aiStreamUrl && (
            <p>AI Stream: {stream.metadata.aiStreamUrl}</p>
          )}
        </div>
      ))}
    </div>
  );
}
```

### Example 2: Fetch Only Active Drones

```typescript
import { useActiveDrones } from '@/hooks/useDrones';

function ActiveDronesMap() {
  const { data: activeDrones, isLoading } = useActiveDrones();

  if (isLoading) return <p>Loading...</p>;

  return (
    <div>
      <h2>Active Drones ({activeDrones?.length || 0})</h2>
      {activeDrones?.map((drone) => (
        <DroneMarker key={drone.id} drone={drone} />
      ))}
    </div>
  );
}
```

### Example 3: Fetch AI-Enabled Drones Only

```typescript
import { useAIDrones } from '@/hooks/useDrones';

function AIDetectionStreams() {
  const { data: aiDrones } = useAIDrones(10000); // Poll every 10 seconds

  return (
    <div>
      {aiDrones?.map((drone) => (
        <VideoPlayer
          key={drone.id}
          streamUrl={drone.metadata?.aiStreamUrl || drone.streamUrl}
          showDetections={true}
        />
      ))}
    </div>
  );
}
```

### Example 4: Custom Polling Interval

```typescript
import { useDrones } from '@/hooks/useDrones';

function Dashboard() {
  // Poll every 5 seconds for live updates
  const { data: streams } = useDrones(5000);

  // Or disable polling by passing 0
  const { data: staticStreams } = useDrones(0);

  return <>{/* ... */}</>;
}
```

---

## Stream URL Format

The new system uses the following URL format:

### Clean Stream (No AI Detection)
```
ws://localhost:6080/sn
```
- Accessed via: `stream.streamUrl`
- Shows raw video feed without AI overlays

### AI Detection Stream
```
ws://localhost:6080/sn/ai
```
- Accessed via: `stream.metadata.aiStreamUrl`
- Shows video with AI detection bounding boxes and labels
- Only available if `stream.startai === true`

### Example Usage
```typescript
function VideoPlayer({ stream }: { stream: WebRTCStream }) {
  const [showAI, setShowAI] = useState(stream.startai);

  const streamUrl = showAI && stream.metadata?.aiStreamUrl
    ? stream.metadata.aiStreamUrl  // AI stream
    : stream.streamUrl;             // Clean stream

  return (
    <div>
      <video src={streamUrl} />
      {stream.startai && (
        <button onClick={() => setShowAI(!showAI)}>
          {showAI ? 'Show Clean Feed' : 'Show AI Detection'}
        </button>
      )}
    </div>
  );
}
```

---

## API Reference

### `useDrones(pollingInterval)`

Fetches all drones from the database.

**Parameters:**
- `pollingInterval` (number, default: 30000): Polling interval in milliseconds

**Returns:**
```typescript
{
  data: WebRTCStream[] | undefined;
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
}
```

### `useActiveDrones(pollingInterval)`

Fetches only drones where `streamIsOn === true`.

### `useAIDrones(pollingInterval)`

Fetches only drones where `isUsingAiDetection === true` and `streamIsOn === true`.

---

## Migration Steps for Existing Components

### Step 1: Identify Components Using Static Config

Search for:
```typescript
import { webrtcStreams } from '@/config/webrtc-streams';
```

### Step 2: Replace with React Query Hook

**Before:**
```typescript
import { webrtcStreams } from '@/config/webrtc-streams';

function LiveFeed() {
  const streams = webrtcStreams;
  return <>{/* render streams */}</>;
}
```

**After:**
```typescript
import { useDrones } from '@/hooks/useDrones';

function LiveFeed() {
  const { data: streams, isLoading } = useDrones();

  if (isLoading) return <div>Loading...</div>;
  if (!streams) return <div>No streams available</div>;

  return <>{/* render streams */}</>;
}
```

### Step 3: Update Stream URL Access

**Before:**
```typescript
<VideoPlayer url={stream.streamUrl} />
```

**After (with AI toggle):**
```typescript
// Clean stream
<VideoPlayer url={stream.streamUrl} />

// AI stream (if enabled)
{stream.startai && stream.metadata?.aiStreamUrl && (
  <VideoPlayer url={stream.metadata.aiStreamUrl} />
)}
```

---

## Helper Functions (Backward Compatibility)

If you need the old helper functions, update them to use React Query:

```typescript
import { useDrones } from '@/hooks/useDrones';

// Get all streams (now uses database)
export function getAllStreams() {
  const { data } = useDrones(0); // No polling
  return data || [];
}

// Get streams by status
export function getStreamsByStatus(isOnline: boolean) {
  const { data } = useDrones(0);
  return data?.filter((stream) => stream.isOnline === isOnline) || [];
}

// Get stream by ID
export function getStreamById(id: string) {
  const { data } = useDrones(0);
  return data?.find((stream) => stream.id === id);
}

// Get AI-enabled streams
export function getAIEnabledStreams() {
  const { data } = useAIDrones(0);
  return data || [];
}
```

---

## Troubleshooting

### Issue: "Query client not found"
**Solution:** Make sure you've wrapped your app with `QueryClientProvider`

### Issue: Streams not updating
**Solution:**
1. Check polling interval (should be > 0 for auto-updates)
2. Verify API URL in `.env`
3. Check if drone management API is running: `http://127.0.0.1:5000/api/v1/drones`

### Issue: CORS errors
**Solution:** Update your backend CORS settings to allow frontend origin

### Issue: Missing AI stream URL
**Solution:**
1. Make sure Python detector is running for that drone
2. Check `webRTCUrl` field in database
3. Verify drone has `isUsingAiDetection: true`

---

## Benefits

✅ **Real-time updates** - Streams automatically refresh from database
✅ **No manual config** - Add/remove drones via database, frontend updates automatically
✅ **Centralized management** - Single source of truth in MongoDB
✅ **Better UX** - Loading states, error handling, manual refresh
✅ **Type-safe** - Full TypeScript support
✅ **Scalable** - Works with any number of drones

---

## Testing

```typescript
// Test component
import { useDrones } from '@/hooks/useDrones';

function TestDrones() {
  const { data, isLoading, error } = useDrones(5000);

  console.log('Drones:', data);
  console.log('Loading:', isLoading);
  console.log('Error:', error);

  return <pre>{JSON.stringify(data, null, 2)}</pre>;
}
```

Check console to see:
- Stream URLs (clean and AI)
- Drone metadata
- Online status
- AI detection status
