import { type BarangayUpdate, barangaySchema } from '@repo/shared';
import {
  useIsMutating,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query';
import { api } from '@/lib/api';
import { geoQueries } from './queries';

/**
 * Sets one barangay's flags and hazards (admin only). `isPending` covers every
 * update of that barangay, so its other controls wait too.
 */
export function useUpdateBarangayMutation(id: string) {
  const queryClient = useQueryClient();
  const mutationKey = [...geoQueries.all(), 'update', id];
  const isPending = useIsMutating({ mutationKey }) > 0;
  const { mutate } = useMutation({
    mutationKey,
    mutationFn: (changes: BarangayUpdate) =>
      api.patch(`/geo/barangays/${id}`, changes, barangaySchema),
    // Patch the cached row instead of invalidating: a refetch would download
    // all 119 boundaries again for one flag.
    onSuccess: (updated) => {
      queryClient.setQueryData(geoQueries.barangays().queryKey, (rows) =>
        rows?.map((row) => (row.id === updated.id ? updated : row)),
      );
    },
  });
  return { mutate, isPending };
}
