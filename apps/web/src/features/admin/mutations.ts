import {
  type IncidentTypeCreate,
  type IncidentTypeUpdate,
  incidentTypeSchema,
} from '@repo/shared';
import { useMutation, useQueryClient } from '@tanstack/react-query';
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
