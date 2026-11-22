import type { ReportFeedItem } from '@repo/shared';
import { MapMarker, MarkerContent } from '@/components/ui/map';
import { ReportPin } from '@/components/report-pin';

/** One located report's pin, for any map; `children` (e.g. a `MarkerPopup`) attach to it. */
export function ReportMarker({
  report,
  lngLat,
  focused = false,
  children,
}: {
  report: Pick<ReportFeedItem, 'incidentType' | 'severity'>;
  lngLat: { lng: number; lat: number };
  /** The report the map was opened on: drawn larger, above its neighbors. */
  focused?: boolean;
  children?: React.ReactNode;
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
      {children}
    </MapMarker>
  );
}
