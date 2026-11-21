import { healthSchema } from '@repo/shared';
import { queryOptions } from '@tanstack/react-query';
import { api } from '@/lib/api';

export const healthQueries = {
  all: () => ['health'] as const,

  /**
   * API health. A 503 still carries a report of which check failed, so it
   * resolves; only an unreachable API or malformed body rejects.
   */
  status: () =>
    queryOptions({
      queryKey: [...healthQueries.all(), 'status'],
      queryFn: ({ signal }) =>
        api.get('/health', healthSchema, { signal, acceptStatuses: [503] }),
      refetchInterval: 30_000,
    }),
};
