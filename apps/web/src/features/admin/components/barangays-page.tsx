import {
  type Barangay,
  type BarangayUpdate,
  barangaySchema,
  hazardTypeSchema,
} from '@repo/shared';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { LoadError } from '@/components/load-error';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { api } from '@/lib/api';
import { label } from '@/lib/format';
import { adminQueries } from '../queries';

export function BarangaysPage() {
  const { data, isPending, isError, refetch } = useQuery(
    adminQueries.barangays(),
  );

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-2xl font-semibold">Barangays</h1>
        <p className="text-sm text-muted-foreground">
          Flags and hazards decide which barangays an advisory reaches.
        </p>
      </div>
      {isPending ? (
        <Skeleton className="h-64" />
      ) : isError ? (
        <LoadError what="barangays" onRetry={() => void refetch()} />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Barangay</TableHead>
              <TableHead>Coastal</TableHead>
              <TableHead>Upland</TableHead>
              <TableHead>Hazards</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((barangay) => (
              <BarangayRow key={barangay.id} barangay={barangay} />
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}

function BarangayRow({ barangay }: { barangay: Barangay }) {
  const queryClient = useQueryClient();
  const { mutate, isPending } = useMutation({
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

  return (
    <TableRow>
      <TableCell className="font-medium">{barangay.name}</TableCell>
      <TableCell>
        <Switch
          aria-label={`${barangay.name} is coastal`}
          checked={barangay.isCoastal}
          disabled={isPending}
          onCheckedChange={(isCoastal) => save({ isCoastal })}
        />
      </TableCell>
      <TableCell>
        <Switch
          aria-label={`${barangay.name} is upland`}
          checked={barangay.isUpland}
          disabled={isPending}
          onCheckedChange={(isUpland) => save({ isUpland })}
        />
      </TableCell>
      <TableCell>
        <ToggleGroup
          multiple
          variant="outline"
          size="sm"
          aria-label={`${barangay.name} hazards`}
          value={barangay.hazards}
          disabled={isPending}
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
      </TableCell>
    </TableRow>
  );
}
