import { residentListSchema, residentProfileSchema } from '@repo/shared';
import { queryOptions } from '@tanstack/react-query';
import { api } from '@/lib/api';

/** Resident queries. Every endpoint needs a signed-in responder or admin. */
export const residentQueries = {
  all: () => ['residents'] as const,

  /** The residents directory. */
  list: () =>
    queryOptions({
      queryKey: [...residentQueries.all(), 'list'],
      queryFn: ({ signal }) =>
        api.get('/residents', residentListSchema, { signal }),
    }),

  /** One resident's profile, or null when no resident has that ID. */
  detail: (id: string) =>
    queryOptions({
      queryKey: [...residentQueries.all(), 'detail', id],
      queryFn: ({ signal }) =>
        api.getOrNull(`/residents/${id}`, residentProfileSchema, {
          signal,
          // 400 is a malformed ID, which can't match any resident either.
          missing: [400, 404],
        }),
    }),
};
