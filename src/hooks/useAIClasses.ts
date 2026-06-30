import { useQuery } from '@tanstack/react-query';
import { fetchAIClasses } from '@/lib/api/device-config';

const aiClassKeys = {
  all: ['omniwatch', 'ai-classes'] as const,
};

export function useAIClasses() {
  return useQuery({
    queryKey: aiClassKeys.all,
    queryFn: fetchAIClasses,
    staleTime: Infinity,
    retry: 1,
  });
}
