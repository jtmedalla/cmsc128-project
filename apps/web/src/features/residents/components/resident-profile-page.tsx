import { useQuery } from '@tanstack/react-query';
import { DetailItem } from '@/components/detail-item';
import { LoadError } from '@/components/load-error';
import { label, LANGUAGE_LABELS } from '@/lib/format';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { residentQueries } from '../queries';
import { getRouteApi, Link } from '@tanstack/react-router';
const route = getRouteApi('/dashboard/_app/residents/$residentId');

export function ResidentProfilePage() {
  const { residentId } = route.useParams();
  const { data, isPending, isError, refetch } = useQuery(
    residentQueries.detail(residentId),
  );

  if (isPending) return <Skeleton className="h-64 w-full" />;
  if (isError) {
    return <LoadError what="this resident" onRetry={() => void refetch()} />;
  }
  if (!data) return <p>Resident not found.</p>;

  return (
    <div className="flex flex-col gap-4">
      <Link
        to="/dashboard/residents"
        className="text-muted-foreground text-sm hover:underline"
      >
        ← Residents
      </Link>
      <h1 className="text-2xl font-bold">{data.name ?? 'Unnamed resident'}</h1>
      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid gap-4 sm:grid-cols-2">
            <DetailItem label="Contact number" value={data.contactNumber} />
            <DetailItem label="Barangay" value={data.barangay} />
            <DetailItem label="Age" value={data.age?.toString()} />
            <DetailItem label="Sex" value={data.sex && label(data.sex)} />
            <DetailItem label="Home address" value={data.locationText} />
            <DetailItem
              label="Preferred language"
              value={LANGUAGE_LABELS[data.languagePreference]}
            />
            <DetailItem
              label="Advisories"
              value={data.broadcastsOptIn ? 'Opted in' : 'Opted out'}
            />
          </dl>
        </CardContent>
      </Card>
    </div>
  );
}
