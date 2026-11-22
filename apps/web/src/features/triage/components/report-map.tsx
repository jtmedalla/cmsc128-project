import type { ReportFeedItem } from '@repo/shared';
import { cn } from 'cn';
import { MapPinOff } from 'lucide-react';
import { Map as AppMap } from '@/components/map';
import { ReportMarker } from '@/components/report-marker';
import { MapControls } from '@/components/ui/map';

const ZOOM = 15;

/** The report's pin on a small map, or a note when it has no point yet. */
export function ReportMap({
  report,
  className,
}: {
  report: Pick<ReportFeedItem, 'id' | 'location' | 'incidentType' | 'severity'>;
  className?: string;
}) {
  const box = 'h-56 w-full overflow-hidden rounded-lg border';

  if (!report.location) {
    return (
      <div
        className={cn(
          box,
          'flex flex-col items-center justify-center gap-2 bg-muted/40 text-sm text-muted-foreground',
          className,
        )}
      >
        <MapPinOff className="size-5" />
        No pinned location
      </div>
    );
  }

  const { lng, lat } = report.location;
  return (
    <div className={cn(box, className)}>
      {/* `center` only applies on mount, so a new report gets a new map. */}
      <AppMap
        key={report.id}
        className="size-full"
        center={[lng, lat]}
        zoom={ZOOM}
      >
        <ReportMarker report={report} lngLat={report.location} />
        <MapControls />
      </AppMap>
    </div>
  );
}
