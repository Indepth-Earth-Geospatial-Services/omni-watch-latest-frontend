import { useQuery } from '@tanstack/react-query';

const streamQueryKey = ['streams', 'keys'] as const;

export interface StreamEntry {
  deviceSn: string;
  streamKey: string;
}

function extractDeviceSn(streamKey: string): string {
  return streamKey.replace('livestream', '').split('-')[0];
}

export function useStreamKeys() {
  return useQuery({
    queryKey: streamQueryKey,
    queryFn: async (): Promise<StreamEntry[]> => {
      const res = await fetch('/api/streams');
      if (!res.ok) throw new Error(`Failed to fetch streams: ${res.status}`);
      const data: string[] = await res.json();
      return data.map((key) => ({
        deviceSn: extractDeviceSn(key),
        streamKey: key,
      }));
    },
    staleTime: Infinity,
  });
}
