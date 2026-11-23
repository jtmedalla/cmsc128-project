import { accountSchema, agencySchema, incidentTypeSchema } from '@repo/shared';
import { queryOptions } from '@tanstack/react-query';
import { api } from '@/lib/api';

/**
 * Accounts, invites, incident types and agencies, each a `queryOptions` keyed
 * under `all()` (docs/architecture.md). Barangays live in `@/features/geo`.
 */
export const adminQueries = {
  all: () => ['admin'] as const,

  /** Every dashboard account with its role and whether it's active. */
  users: () =>
    queryOptions({
      queryKey: [...adminQueries.all(), 'users'],
      queryFn: ({ signal }) =>
        api.get('/admin/users', accountSchema.array(), { signal }),
    }),

  /** Every incident type, retired ones included, by name. */
  incidentTypes: () =>
    queryOptions({
      queryKey: [...adminQueries.all(), 'incident-types'],
      queryFn: ({ signal }) =>
        api.get('/admin/incident-types', incidentTypeSchema.array(), {
          signal,
        }),
    }),

  /** Every agency, retired ones included, by name. */
  agencies: () =>
    queryOptions({
      queryKey: [...adminQueries.all(), 'agencies'],
      queryFn: ({ signal }) =>
        api.get('/admin/agencies', agencySchema.array(), { signal }),
    }),
};
