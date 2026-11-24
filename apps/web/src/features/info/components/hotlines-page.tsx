import type { Hotline } from '@repo/shared';
import { useQuery } from '@tanstack/react-query';
import { CallButton } from '@/components/contact-number';
import { LoadError } from '@/components/load-error';
import { Skeleton } from '@/components/ui/skeleton';
import { infoQueries } from '../queries';

/** Always first, and shown even when the agency list fails to load. */
const NATIONAL: Hotline = { name: 'National emergency', contactNumber: '911' };

function HotlineItem({ hotline }: { hotline: Hotline }) {
  return (
    <li className="flex items-center justify-between gap-3 rounded-xl border bg-card p-4">
      <div className="min-w-0">
        <p className="font-medium">{hotline.name}</p>
        <p className="text-sm text-muted-foreground">{hotline.contactNumber}</p>
      </div>
      <CallButton
        number={hotline.contactNumber}
        label={`Call ${hotline.name}: ${hotline.contactNumber}`}
        className="shrink-0"
      />
    </li>
  );
}

/** 911, then the public agencies admins list (FR46). */
export function HotlinesPage() {
  const { data, isPending, isError, refetch } = useQuery(
    infoQueries.hotlines(),
  );

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">Emergency hotlines</h1>
      <ul className="flex flex-col gap-3">
        <HotlineItem hotline={NATIONAL} />
        {isPending
          ? [0, 1, 2].map((i) => (
              <li key={i}>
                <Skeleton className="h-18 rounded-xl" />
              </li>
            ))
          : data?.map((hotline) => (
              <HotlineItem key={hotline.name} hotline={hotline} />
            ))}
      </ul>
      {isError && (
        <LoadError what="agency hotlines" onRetry={() => void refetch()} />
      )}
    </div>
  );
}
