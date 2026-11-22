import type { ReportFeedItem } from '@repo/shared';
import { MapMarker, MarkerContent } from '@/components/ui/map';
import { ReportPin } from '@/components/report-pin';

/** One located report's pin, for any map. */
// TODO(#66): show the report's popup on click.
export function ReportMarker({
  report,
  lngLat,
  focused = false,
}: {
  report: Pick<ReportFeedItem, 'incidentType' | 'severity'>;
  lngLat: { lng: number; lat: number };
  /** The report the map was opened on: drawn larger, above its neighbors. */
  focused?: boolean;
}) {
  return (
    <MapMarker
      longitude={lngLat.lng}
      latitude={lngLat.lat}
      className={focused ? 'z-10' : undefined}
    >
      <MarkerContent>
        <ReportPin report={report} focused={focused} />
      </MarkerContent>
    </MapMarker>
  );
}
