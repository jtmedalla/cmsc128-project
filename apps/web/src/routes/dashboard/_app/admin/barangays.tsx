import { createFileRoute } from '@tanstack/react-router';
import { BarangaysPage } from '@/features/admin';

export const Route = createFileRoute('/dashboard/_app/admin/barangays')({
  // ?barangay=<name> filters the table and outlines it on the map.
  validateSearch: (search): { barangay?: string } => ({
    barangay: typeof search.barangay === 'string' ? search.barangay : undefined,
  }),
  component: function BarangaysRoute() {
    const navigate = Route.useNavigate();
    return (
      <BarangaysPage
        barangay={Route.useSearch().barangay}
        onBarangayChange={(name) =>
          void navigate({
            search: { barangay: name || undefined },
            replace: true,
          })
        }
      />
    );
  },
});
