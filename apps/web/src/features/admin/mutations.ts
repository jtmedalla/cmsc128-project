import {
  type AgencyCreate,
  type AgencyUpdate,
  agencySchema,
  type IncidentTypeCreate,
  type IncidentTypeUpdate,
  incidentTypeSchema,
} from '@repo/shared';
import {
  useIsMutating,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query';
import { infoQueries } from '@/features/info';
import { intakeQueries } from '@/features/intake';
import { api } from '@/lib/api';
import { adminQueries } from './queries';

/** Refetches the admin list and the types report forms offer. */
function useInvalidateIncidentTypes() {
  const queryClient = useQueryClient();
  return () =>
    Promise.all([
      queryClient.invalidateQueries(adminQueries.incidentTypes()),
      queryClient.invalidateQueries(intakeQueries.incidentTypes()),
    ]);
}

export function useCreateIncidentTypeMutation() {
  const invalidate = useInvalidateIncidentTypes();
  return useMutation({
    mutationFn: (input: IncidentTypeCreate) =>
      api.post('/admin/incident-types', input, incidentTypeSchema),
    onSuccess: invalidate,
  });
}

/** Renames, retires or restores one incident type. */
export function useUpdateIncidentTypeMutation(id: string) {
  const invalidate = useInvalidateIncidentTypes();
  return useMutation({
    mutationFn: (changes: IncidentTypeUpdate) =>
      api.patch(`/admin/incident-types/${id}`, changes, incidentTypeSchema),
    onSuccess: invalidate,
  });
}

/** Deletes a type nothing uses; the API answers 409 for one in use. */
export function useDeleteIncidentTypeMutation(id: string) {
  const invalidate = useInvalidateIncidentTypes();
  return useMutation({
    mutationFn: () => api.delete(`/admin/incident-types/${id}`),
    onSuccess: invalidate,
  });
}

/** Refetches the admin list and the public hotlines. */
function useInvalidateAgencies() {
  const queryClient = useQueryClient();
  return () =>
    Promise.all([
      queryClient.invalidateQueries(adminQueries.agencies()),
      queryClient.invalidateQueries(infoQueries.hotlines()),
    ]);
}

export function useCreateAgencyMutation() {
  const invalidate = useInvalidateAgencies();
  return useMutation({
    mutationFn: (input: AgencyCreate) =>
      api.post('/admin/agencies', input, agencySchema),
    onSuccess: invalidate,
  });
}

/**
 * Saves every field of one agency; pass the unchanged ones as they are.
 * `isPending` covers every update of that agency, so its other controls wait.
 */
export function useUpdateAgencyMutation(id: string) {
  const invalidate = useInvalidateAgencies();
  const mutationKey = [...adminQueries.agencies().queryKey, 'update', id];
  const isPending = useIsMutating({ mutationKey }) > 0;
  const { mutate, mutateAsync } = useMutation({
    mutationKey,
    mutationFn: (values: AgencyUpdate) =>
      api.put(`/admin/agencies/${id}`, values, agencySchema),
    onSuccess: invalidate,
  });
  return { mutate, mutateAsync, isPending };
}

/** Deletes a private, unused agency; the API answers 409 otherwise. */
export function useDeleteAgencyMutation(id: string) {
  const invalidate = useInvalidateAgencies();
  return useMutation({
    mutationFn: () => api.delete(`/admin/agencies/${id}`),
    onSuccess: invalidate,
  });
}
