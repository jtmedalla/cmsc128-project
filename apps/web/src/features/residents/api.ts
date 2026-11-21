import { residentListSchema, residentProfileSchema } from '@repo/shared';
import { queryOptions } from '@tanstack/react-query';
import { apiFetch, apiFetchOrNull } from '@/lib/api';

/** Residents directory. Needs a signed-in responder or admin. */
export const residentsQuery = queryOptions({
  queryKey: ['residents'],
  queryFn: ({ signal }) =>
    apiFetch('/residents', residentListSchema, { signal }),
});

/** One resident's profile, or null when no resident has that ID. Needs a signed-in responder or admin. */
export const residentQuery = (id: string) =>
  queryOptions({
    queryKey: ['residents', 'detail', id],
    queryFn: ({ signal }) =>
      apiFetchOrNull(`/residents/${id}`, residentProfileSchema, {
        signal,
        // 400 is a malformed ID, which can't match any resident either.
        missing: [400, 404],
      }),
  });
