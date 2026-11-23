import { hotlineSchema } from '@repo/shared';
import { queryOptions } from '@tanstack/react-query';
import { api } from '@/lib/api';

/**
 * Office info, hotlines and knowledge-base answers, each a `queryOptions`
 * keyed under `all()` (docs/architecture.md).
 */
export const infoQueries = {
  all: () => ['info'] as const,

  /** Public agencies' numbers, by name. */
  hotlines: () =>
    queryOptions({
      queryKey: [...infoQueries.all(), 'hotlines'],
      queryFn: ({ signal }) =>
        api.get('/info/hotlines', hotlineSchema.array(), { signal }),
    }),
};
