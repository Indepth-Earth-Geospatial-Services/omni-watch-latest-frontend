# Plan: Integrate Stream Keys from /api/streams

## Summary

The AI detection page currently uses `deviceSn` as the stream ID in WHEP URLs, but the actual stream key from the backend is different (e.g., `livestream1581F5FJD238900D79WS-67-0-0`). This plan fetches stream keys from the backend's `/api/streams` endpoint, maps them to devices by extracting the `deviceSn` from the key format, and passes the correct stream key to the WHEP URL builder. A manual refresh button is added to the StreamSelector dropdown.

## User Story

As a SOC operator,
I want the AI detection page to connect to live streams using the correct stream keys from the backend,
So that video feeds display correctly with bounding box overlays.

## Metadata

| Field | Value |
|-------|-------|
| Type | ENHANCEMENT |
| Complexity | MEDIUM |
| Systems Affected | Frontend (AI Detection page, StreamSelector, VideoGrid, StreamVideoCard) |
| Jira Issue | N/A |

---

## Key Insight: Stream Key Format

Backend returns stream keys like: `livestream1581F5FJD238900D79WS-67-0-0`

Extraction logic:
```
"livestream1581F5FJD238900D79WS-67-0-0"
  → remove "livestream" prefix
  → "1581F5FJD238900D79WS-67-0-0"
  → split by "-", take first part
  → "1581F5FJD238900D79WS" (this is the deviceSn)
```

---

## Patterns to Follow

### React Query Hook with Manual Refetch
```ts
// SOURCE: src/hooks/useDeviceLogs.ts:63-74
export function useUploadedLogs(deviceSn?: string, params?: UploadedLogsQueryParams) {
  return useQuery({
    queryKey: logKeys(workspaceId).uploaded(deviceSn ?? ''),
    queryFn: () => getUploadedLogs(workspaceId, deviceSn!, params),
    enabled: !!workspaceId && !!deviceSn,
    refetchInterval: 30_000,
    staleTime: 15_000,
  });
}
// Component destructures `refetch` and calls it on button click
```

### Refresh Button with Spinner
```ts
// SOURCE: src/app/(dashboard)/logs/page.tsx:217-224
<button
  onClick={() => refetch()}
  disabled={logsLoading}
  className="px-3 py-2 text-sm border border-gray-600 rounded-md hover:bg-gray-700 transition-colors disabled:opacity-50"
>
  <RefreshCw className={`w-4 h-4 mr-2 ${logsLoading ? "animate-spin" : ""}`} />
  Refresh
</button>
```

### API Proxy Route
```ts
// SOURCE: src/app/api/omniwatch/[...path]/route.ts:20, 62-71
const BASE_URL = process.env.OMNIWATCH_API_URL ?? 'http://34.35.12.123:8000';
export async function GET(request: Request, { params }: { params: { path: string[] } }) {
  const segments = params.path.join('/');
  const targetUrl = `${BASE_URL}/api/v1/${segments}/`;
  // ... proxy logic
}
```

### Query Key Factory
```ts
// SOURCE: src/hooks/useDJIDevices.ts:32-38
const deviceKeys = (workspaceId: string) => ({
  all: ['dji', 'devices', workspaceId] as const,
  list: ['dji', 'devices', workspaceId, 'list'] as const,
  // ...
});
```

---

## Files to Change

| File | Action | Purpose |
|------|--------|---------|
| `src/app/api/streams/route.ts` | CREATE | Proxy `/api/streams` to backend (avoids CORS) |
| `src/hooks/useStreamKeys.ts` | CREATE | React Query hook to fetch and cache stream keys |
| `src/components/features/ai-detection/StreamSelector.tsx` | UPDATE | Add refresh button, accept `streamKeys` map |
| `src/components/features/ai-detection/VideoGrid.tsx` | UPDATE | Pass `streamKey` to StreamVideoCard |
| `src/components/features/ai-detection/StreamVideoCard.tsx` | UPDATE | Accept `streamKey` prop for WHEP URL |
| `src/app/(dashboard)/ai-detection/page.tsx` | UPDATE | Wire up `useStreamKeys`, pass to children |
| `src/components/features/ai-detection/DetectionVideoFeed.tsx` | UPDATE | Use stream key for WHEP URL |

---

## Tasks

### Task 1: Create API Proxy Route for /api/streams

- **File**: `src/app/api/streams/route.ts`
- **Action**: CREATE
- **Implement**: Proxy GET requests to the backend's `/api/streams` endpoint. Follow the pattern from `src/app/api/omniwatch/[...path]/route.ts`.
- **Details**:
  - Backend URL: `process.env.NEXT_PUBLIC_AI_DETECTION_BACKEND_URL || 'http://136.116.89.216'`
  - Target: `${BACKEND_URL}/api/streams`
  - Return the JSON response directly (array of stream key strings)
  - Handle errors with 503 response
- **Validate**: `pnpm run build`

### Task 2: Create useStreamKeys Hook

- **File**: `src/hooks/useStreamKeys.ts`
- **Action**: CREATE
- **Implement**: React Query hook that:
  1. Fetches stream keys from `/api/streams`
  2. Extracts `deviceSn` from each key using the pattern: `key.replace('livestream', '').split('-')[0]`
  3. Returns a `Map<string, string>` mapping `deviceSn` → `streamKey`
  4. Exposes `refetch` for manual refresh
  5. Exposes `isFetching` for loading spinner
- **Mirror**: `src/hooks/useDJIDevices.ts:98-138` (query structure), `src/hooks/useDeviceLogs.ts:63-74` (manual refetch)
- **Query Key**: `['streams', 'keys']`
- **No auto-refresh** — only fetch on mount and manual refetch
- **Validate**: `pnpm run build`

### Task 3: Update StreamSelector with Refresh Button

- **File**: `src/components/features/ai-detection/StreamSelector.tsx`
- **Action**: UPDATE
- **Implement**:
  1. Add props: `streamKeyMap: Map<string, string>`, `onRefresh: () => void`, `isRefreshing: boolean`
  2. Add a "Refresh" button at the bottom of the dropdown (before the max-limit warning)
  3. Button shows `RefreshCw` icon with spin animation when `isRefreshing` is true
  4. Button calls `onRefresh` on click
- **Mirror**: `src/app/(dashboard)/logs/page.tsx:217-224` (refresh button pattern)
- **Validate**: `pnpm run build`

### Task 4: Update VideoGrid to Pass Stream Keys

- **File**: `src/components/features/ai-detection/VideoGrid.tsx`
- **Action**: UPDATE
- **Implement**:
  1. Add prop: `streamKeyMap: Map<string, string>`
  2. In `activeStreams` useMemo, look up the stream key for each device: `streamKeyMap.get(sn)`
  3. Skip devices that don't have a stream key (not currently streaming)
  4. Pass `streamKey` to `StreamVideoCard`
- **Mirror**: `src/components/features/ai-detection/VideoGrid.tsx:27-36` (existing mapping logic)
- **Validate**: `pnpm run build`

### Task 5: Update StreamVideoCard to Accept Stream Key

- **File**: `src/components/features/ai-detection/StreamVideoCard.tsx`
- **Action**: UPDATE
- **Implement**:
  1. Add prop: `streamKey: string`
  2. Change `buildWhepUrl` call to use `streamKey` instead of `streamId`
  3. Update the `key` prop on `<WebRTCPlayer>` to use `streamKey`
- **Mirror**: `src/components/features/ai-detection/StreamVideoCard.tsx:15-18, 34`
- **Validate**: `pnpm run build`

### Task 6: Wire Up Stream Keys in AI Detection Page

- **File**: `src/app/(dashboard)/ai-detection/page.tsx`
- **Action**: UPDATE
- **Implement**:
  1. Import and call `useStreamKeys()` hook
  2. Pass `streamKeyMap`, `onRefresh: refetch`, `isRefreshing: isFetching` to `StreamSelector`
  3. Pass `streamKeyMap` to `VideoGrid`
- **Mirror**: `src/app/(dashboard)/ai-detection/page.tsx:75-77` (how hooks are wired)
- **Validate**: `pnpm run build`

### Task 7: Update DetectionVideoFeed to Use Stream Key

- **File**: `src/components/features/ai-detection/DetectionVideoFeed.tsx`
- **Action**: UPDATE
- **Implement**:
  1. Add prop: `streamKeyMap: Map<string, string>`
  2. Look up stream key for `activeStreamId`: `streamKeyMap.get(activeStreamId)`
  3. Use stream key in `buildWhepUrl` call
  4. Skip rendering if no stream key found
- **Mirror**: `src/components/features/ai-detection/DetectionVideoFeed.tsx:32-42`
- **Validate**: `pnpm run build`

---

## Validation

```bash
# Type check
pnpm run build

# Lint
pnpm run lint
```

---

## Acceptance Criteria

- [ ] `/api/streams` proxy route returns stream keys from backend
- [ ] `useStreamKeys` hook fetches and caches stream keys
- [ ] Stream keys are mapped to devices by extracting deviceSn
- [ ] StreamSelector shows refresh button that re-fetches stream keys
- [ ] VideoGrid only shows devices that have a stream key (are actively streaming)
- [ ] StreamVideoCard uses stream key (not deviceSn) in WHEP URL
- [ ] DetectionVideoFeed uses stream key for WHEP URL
- [ ] Type check passes
- [ ] Lint passes
