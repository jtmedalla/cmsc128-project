import { incidentTypeOptionSchema } from '@repo/shared';
import { queryOptions } from '@tanstack/react-query';
import { api } from '@/lib/api';

/** Report-form data, such as the incident types to pick from. */
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
};
