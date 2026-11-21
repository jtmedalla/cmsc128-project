import { healthSchema } from '@repo/shared';
import { queryOptions } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api';

/**
 * API health. A 503 still carries a report of which check failed, so it
 * resolves; only an unreachable API or malformed body rejects.
 */
export const healthQuery = queryOptions({
  queryKey: ['health'],
  queryFn: ({ signal }) =>
    apiFetch('/health', healthSchema, { signal, acceptStatuses: [503] }),
  refetchInterval: 30_000,
});
