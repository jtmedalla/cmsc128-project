import { queryOptions } from '@tanstack/react-query';
import { authClient } from './auth-client';

export const authQueries = {
  all: () => ['auth'] as const,

  /**
   * The signed-in session, or null. Route guards read it from the cache with
   * `revalidateIfStale`, so a revoked session or role change is picked up once
   * the cached copy is older than `staleTime`.
   */
  session: () =>
    queryOptions({
      queryKey: [...authQueries.all(), 'session'],
      queryFn: async () => {
        const { data, error } = await authClient.getSession();
        // Throw so a server error isn't mistaken for "signed out".
        if (error) throw error;
        return data;
      },
      staleTime: 60_000,
      // Guards fetch through ensureQueryData, which doesn't retry unless told to.
      retry: 2,
    }),
};
