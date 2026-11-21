import { residentListSchema, residentProfileSchema } from '@repo/shared';
import { queryOptions } from '@tanstack/react-query';
import { API_URL } from './env';

/** Residents directory. Needs a signed-in responder or admin. */
export const residentsQuery = queryOptions({
  queryKey: ['residents'],
  queryFn: async ({ signal }) => {
    const res = await fetch(`${API_URL}/residents`, {
      credentials: 'include',
      signal,
    });
    if (!res.ok) throw new Error(`Failed to load residents (${res.status})`);
    return residentListSchema.parse(await res.json());
  },
});

/** One resident's profile. Needs a signed-in responder or admin. */
export const residentQuery = (id: string) =>
  queryOptions({
    queryKey: ['residents', 'detail', id],
    queryFn: async ({ signal }) => {
      const res = await fetch(`${API_URL}/residents/${id}`, {
        credentials: 'include',
        signal,
      });
      if (res.status === 404) throw new Error('Resident not found');
      if (!res.ok) throw new Error(`Failed to load resident (${res.status})`);
      return residentProfileSchema.parse(await res.json());
    },
  });
