import { barangaySchema, incidentTypeOptionSchema } from '@repo/shared';
import { queryOptions } from '@tanstack/react-query';
import { api } from '@/lib/api';

/** Report-form data: the incident types and barangays to pick from. */
export const intakeQueries = {
  all: () => ['intake'] as const,

  /** Active incident types, by name. */
  incidentTypes: () =>
    queryOptions({
      queryKey: [...intakeQueries.all(), 'incident-types'],
      queryFn: ({ signal }) =>
        api.get('/intake/incident-types', incidentTypeOptionSchema.array(), {
          signal,
        }),
    }),

  barangays: () =>
    queryOptions({
      queryKey: [...intakeQueries.all(), 'barangays'],
      queryFn: ({ signal }) =>
        api.get('/geo/barangays', barangaySchema.array(), { signal }),
      staleTime: Infinity,
    }),
};
