import { toast } from 'sonner';

export async function requestHandler<T>(
  fn: () => Promise<T>,
  options?: {
    successMessage?: string;
    errorMessage?: string;
  }
): Promise<T> {
  try {
    const result = await fn();
    if (options?.successMessage) {
      toast.success(options.successMessage);
    }
    return result;
  } catch (err) {
    const message =
      err instanceof Error ? err.message : 'An unexpected error occurred';
    toast.error(options?.errorMessage || message);
    throw err;
  }
}
