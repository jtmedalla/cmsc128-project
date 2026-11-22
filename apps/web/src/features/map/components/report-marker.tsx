import type { ReportFeedItem } from '@repo/shared';
import * as maplibregl from 'maplibre-gl';
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { ReportPin } from './report-pin';

/** Places one located report's pin on the map, and removes it on unmount. */
export function ReportMarker({
  map,
  report,
  lngLat,
  focused,
}: {
  map: maplibregl.Map;
  report: ReportFeedItem;
  lngLat: { lng: number; lat: number };
  focused: boolean;
}) {
  /* MapLibre positions this element; React renders the pin into it. */
  const [element] = useState(() => document.createElement('div'));
  const { lng, lat } = lngLat;

  useEffect(() => {
    // TODO(#66): show the report's popup on click.
    const marker = new maplibregl.Marker({
      element,
      /* The focused pin draws above its neighbors. */
      className: focused ? 'z-10' : undefined,
    })
      .setLngLat([lng, lat])
      .addTo(map);
    return () => {
      marker.remove();
    };
  }, [map, element, lng, lat, focused]);

  return createPortal(<ReportPin report={report} focused={focused} />, element);
}
