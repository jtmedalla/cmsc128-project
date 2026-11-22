import { broadcastSummarySchema } from '@repo/shared';
import { queryOptions } from '@tanstack/react-query';
import { api } from '@/lib/api';

export const broadcastQueries = {
  all: () => ['broadcasts'] as const,

  /** The five most recently sent advisories, newest first. */
  recentAdvisories: () =>
    queryOptions({
      queryKey: [...broadcastQueries.all(), 'advisories', 'recent'],
      queryFn: ({ signal }) =>
        api.get(
          '/broadcasts/advisories/recent',
          broadcastSummarySchema.array(),
          {
            signal,
          },
        ),
    }),
};
