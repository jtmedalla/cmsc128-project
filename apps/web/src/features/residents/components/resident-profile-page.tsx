import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { residentQuery } from '../api';
import { getRouteApi, Link } from '@tanstack/react-router';
const route = getRouteApi('/dashboard/_app/residents/$residentId');

const LANGUAGE_LABELS = {
  hil: 'Hiligaynon',
  krj: 'Kinaray-a',
  tgl: 'Tagalog',
  eng: 'English',
} as const;

function Field({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="flex flex-col gap-1">
      <dt className="text-muted-foreground text-sm">{label}</dt>
      <dd className="font-medium">{value || '—'}</dd>
    </div>
  );
}

export function ResidentProfilePage() {
  const { residentId } = route.useParams();
  const { data, isPending, isError, refetch } = useQuery(
    residentQuery(residentId),
  );

  if (isPending) return <Skeleton className="h-64 w-full" />;
  if (isError) {
    return (
      <div className="flex flex-col items-start gap-2">
        <p>Couldn't load this resident.</p>
        <Button onClick={() => void refetch()}>Try again</Button>
      </div>
    );
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
            <Field label="Contact number" value={data.contactNumber} />
            <Field label="Barangay" value={data.barangay} />
            <Field label="Age" value={data.age?.toString()} />
            <Field
              label="Sex"
              value={
                data.sex === 'male'
                  ? 'Male'
                  : data.sex === 'female'
                    ? 'Female'
                    : null
              }
            />
            <Field label="Home address" value={data.locationText} />
            <Field
              label="Preferred language"
              value={LANGUAGE_LABELS[data.languagePreference]}
            />
            <Field
              label="Advisories"
              value={data.broadcastsOptIn ? 'Opted in' : 'Opted out'}
            />
          </dl>
        </CardContent>
      </Card>
    </div>
  );
}
