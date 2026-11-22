import {
  type Barangay,
  type BarangayUpdate,
  barangaySchema,
  hazardTypeSchema,
} from '@repo/shared';
import {
  useIsMutating,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query';
import { toast } from 'sonner';
import { Switch } from '@/components/ui/switch';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { api } from '@/lib/api';
import { label } from '@/lib/format';
import { adminQueries } from '../queries';

/** Saves one barangay's flags and hazards; `pending` while any save for it runs. */
function useUpdateBarangay(barangay: Barangay) {
  const queryClient = useQueryClient();
  const mutationKey = ['barangay', barangay.id];
  const pending = useIsMutating({ mutationKey }) > 0;
  const { mutate } = useMutation({
    mutationKey,
    mutationFn: (changes: BarangayUpdate) =>
      api.patch(`/geo/barangays/${barangay.id}`, changes, barangaySchema),
    onSuccess: (updated) => {
      queryClient.setQueryData(adminQueries.barangays().queryKey, (rows) =>
        rows?.map((row) => (row.id === updated.id ? updated : row)),
      );
    },
    onError: () => {
      toast.error(`Couldn't update ${barangay.name}. Try again.`);
    },
  });
  const save = (changes: Partial<BarangayUpdate>) => {
    const { isCoastal, isUpland, hazards } = barangay;
    mutate({ isCoastal, isUpland, hazards, ...changes });
  };
  return { save, pending };
}

export function FlagSwitch({
  barangay,
  flag,
}: {
  barangay: Barangay;
  flag: 'isCoastal' | 'isUpland';
}) {
  const { save, pending } = useUpdateBarangay(barangay);
  return (
    <Switch
      aria-label={`${barangay.name} is ${flag === 'isCoastal' ? 'coastal' : 'upland'}`}
      checked={barangay[flag]}
      disabled={pending}
      onCheckedChange={(checked) => save({ [flag]: checked })}
    />
  );
}

export function HazardToggles({ barangay }: { barangay: Barangay }) {
  const { save, pending } = useUpdateBarangay(barangay);
  return (
    <ToggleGroup
      multiple
      variant="outline"
      size="sm"
      aria-label={`${barangay.name} hazards`}
      value={barangay.hazards}
      disabled={pending}
      onValueChange={(values) =>
        save({ hazards: hazardTypeSchema.array().parse(values) })
      }
    >
      {hazardTypeSchema.options.map((hazard) => (
        <ToggleGroupItem key={hazard} value={hazard}>
          {label(hazard)}
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  );
}
