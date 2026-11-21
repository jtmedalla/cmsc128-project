import { recentAdvisorySchema } from '@repo/shared';
import { queryOptions } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api';

/** The five most recently sent advisories, newest first. */
export const recentAdvisoriesQuery = queryOptions({
  queryKey: ['broadcasts', 'advisories', 'recent'],
  queryFn: ({ signal }) =>
    apiFetch('/broadcasts/advisories/recent', recentAdvisorySchema.array(), {
      signal,
    }),
});
