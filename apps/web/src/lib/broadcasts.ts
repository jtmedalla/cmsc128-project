import { recentAdvisorySchema, type RecentAdvisory } from '@repo/shared';
import { queryOptions } from '@tanstack/react-query';
import { API_URL } from './env';

/** The five most recently sent advisories, newest first. */
export const recentAdvisoriesQuery = queryOptions({
  queryKey: ['broadcast', 'advisories', 'recent'],
  queryFn: async (): Promise<RecentAdvisory[]> => {
    const res = await fetch(`${API_URL}/broadcast/advisories/recent`, {
      credentials: 'include',
    });
    if (!res.ok) {
      throw new Error(`Couldn't load advisories (${res.status})`);
    }
    return recentAdvisorySchema.array().parse(await res.json());
  },
});
