import { barangaySchema } from '@repo/shared';
import { queryOptions } from '@tanstack/react-query';
import { api } from '@/lib/api';

/** Geo queries, for any signed-in user. */
export const geoQueries = {
  all: () => ['geo'] as const,

  /** All 119 barangays with boundaries, targeting flags and hazards. */
  barangays: () =>
    queryOptions({
      queryKey: [...geoQueries.all(), 'barangays'],
      queryFn: ({ signal }) =>
        api.get('/geo/barangays', barangaySchema.array(), { signal }),
    }),
};
