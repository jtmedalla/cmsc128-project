import { healthSchema } from '@repo/shared';
import { queryOptions } from '@tanstack/react-query';
import { API_URL } from './env';

/**
 * API health. A 503 still carries a report of which check failed, so it
 * resolves; only an unreachable API or malformed body rejects.
 */
export const healthQuery = queryOptions({
  queryKey: ['health'],
  queryFn: async ({ signal }) => {
    const res = await fetch(`${API_URL}/health`, { signal });
    return healthSchema.parse(await res.json());
  },
  refetchInterval: 30_000,
});
