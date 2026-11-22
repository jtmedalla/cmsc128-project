import { useQuery } from '@tanstack/react-query';
import { ContactNumber } from '@/components/contact-number';
import { DetailItem } from '@/components/detail-item';
import { LoadError } from '@/components/load-error';
import { SexLabel } from '@/components/sex-label';
import { LocationLabel } from '@/components/location-label';
import { formatLocation, LANGUAGE_LABELS } from '@/lib/format';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
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
  const home = formatLocation(data.locationText, data.barangay);
  const name = data.name ?? 'Unnamed resident';

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink render={<Link to="/dashboard/residents" />}>
                Residents
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{name}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        <h1 className="text-xl font-semibold">{name}</h1>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid gap-4 sm:grid-cols-2">
            <DetailItem
              label="Contact number"
              value={
                data.contactNumber && (
                  <ContactNumber number={data.contactNumber} />
                )
              }
            />
            <DetailItem label="Age" value={data.age?.toString()} />
            <DetailItem
              label="Sex"
              value={data.sex && <SexLabel sex={data.sex} />}
            />
            {/* No link: a resident's address has no point on the map. */}
            <DetailItem
              label="Home address"
              value={home && <LocationLabel text={home} />}
            />
            <DetailItem
              label="Preferred language"
              value={LANGUAGE_LABELS[data.languagePreference]}
            />
            <DetailItem
              label="Broadcasts"
              value={data.broadcastsOptIn ? 'Opted in' : 'Opted out'}
            />
          </dl>
        </CardContent>
      </Card>
    </div>
  );
}
