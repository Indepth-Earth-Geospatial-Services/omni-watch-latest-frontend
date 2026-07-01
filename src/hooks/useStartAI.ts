import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { fetchStreamUrl } from '@/lib/api/device-config';
import axios from 'axios';

const AI_DETECTION_PROXY = '/api/ai-detection';

export function useStartAI() {
  return useMutation<void, Error, string>({
    mutationFn: async (deviceSn: string) => {
      const { url } = await fetchStreamUrl(deviceSn);
      await axios.post(`${AI_DETECTION_PROXY}/streams/start-ai`, { streamId: url });
    },
    onSuccess: () => {
      toast.success('AI detection started');
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to start AI detection');
    },
  });
}
