import { barangaySchema } from '@repo/shared';
import { queryOptions } from '@tanstack/react-query';
import { api } from '@/lib/api';

/**
 * Accounts, invites, incident types, agencies and barangays. Add each as a
 * `queryOptions` keyed under `all()` (docs/architecture.md).
 */
export const adminQueries = {
  all: () => ['admin'] as const,

  /** All 119 barangays with their targeting flags and hazards. */
  barangays: () =>
    queryOptions({
      queryKey: [...adminQueries.all(), 'barangays'],
      queryFn: ({ signal }) =>
        api.get('/geo/barangays', barangaySchema.array(), { signal }),
    }),
};
