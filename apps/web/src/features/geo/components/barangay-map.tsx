import type { Barangay } from '@repo/shared';
import type * as GeoJSON from 'geojson';
import { useEffect, useMemo, useState } from 'react';
import { Map as AppMap } from '@/components/map';
import { MapControls, MapGeoJSON, useMap } from '@/components/ui/map';
import { cn } from '@/lib/utils';

type Properties = { id: string; name: string; color: string };
type Feature = GeoJSON.Feature<GeoJSON.MultiPolygon, Properties>;

export type BarangayMapProps = {
  barangays: Barangay[];
  /** Fill color per barangay. */
  color: (barangay: Barangay) => string;
  /** Barangays to outline; the map frames them when there are any. */
  outlinedIds?: readonly string[];
  onBarangayClick?: (barangay: Barangay) => void;
  /** Swatches shown in the corner. */
  legend?: { label: string; color: string }[];
  className?: string;
};

/** Barangay boundaries, filled by `color`, with `outlinedIds` outlined and framed. */
export function BarangayMap({
  barangays,
  color,
  outlinedIds = [],
  onBarangayClick,
  legend,
  className,
}: BarangayMapProps) {
  const [hovered, setHovered] = useState<string | null>(null);
  const features = useMemo(
    () =>
      barangays.flatMap((barangay): Feature[] =>
        barangay.boundary
          ? [
              {
                type: 'Feature',
                geometry: barangay.boundary,
                properties: {
                  id: barangay.id,
                  name: barangay.name,
                  color: color(barangay),
                },
              },
            ]
          : [],
      ),
    [barangays, color],
  );
  const outlined = useMemo(() => {
    const ids = new Set(outlinedIds);
    return features.filter((feature) => ids.has(feature.properties.id));
  }, [features, outlinedIds]);

  return (
    <div
      className={cn('relative overflow-hidden rounded-md border', className)}
    >
      <AppMap className="size-full">
        <MapGeoJSON
          id="barangays"
          data={{ type: 'FeatureCollection', features }}
          promoteId="id"
          interactive
          fillPaint={{ 'fill-color': ['get', 'color'], 'fill-opacity': 0.35 }}
          fillHoverPaint={{ 'fill-opacity': 0.6 }}
          linePaint={{ 'line-color': '#525252', 'line-width': 0.75 }}
          onHover={(event) =>
            setHovered(event?.feature.properties.name ?? null)
          }
          onClick={(event) => {
            const barangay = barangays.find(
              (b) => b.id === event.feature.properties.id,
            );
            if (barangay) onBarangayClick?.(barangay);
          }}
        />
        <MapGeoJSON
          id="barangays-outlined"
          data={{ type: 'FeatureCollection', features: outlined }}
          fillPaint={false}
          linePaint={{ 'line-color': '#f59e0b', 'line-width': 3 }}
        />
        <FitBounds features={outlined} />
        <MapControls showFullscreen />
      </AppMap>
      {(hovered || legend) && (
        <div className="absolute top-2 left-2 flex flex-col gap-1 rounded-md bg-background/90 px-2 py-1.5 text-xs shadow-sm">
          {hovered && <span className="font-medium">{hovered}</span>}
          {legend && (
            <div className="flex flex-wrap gap-x-3 gap-y-1">
              {legend.map(({ label, color }) => (
                <span key={label} className="flex items-center gap-1">
                  <span
                    className="size-2.5 rounded-sm"
                    style={{ backgroundColor: color }}
                  />
                  {label}
                </span>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/** Moves the map to frame `features`; stays put when there are none. */
function FitBounds({ features }: { features: Feature[] }) {
  const { map, isLoaded } = useMap();
  let [west, south, east, north] = [Infinity, Infinity, -Infinity, -Infinity];
  for (const feature of features) {
    for (const [lng, lat] of feature.geometry.coordinates.flat(2)) {
      west = Math.min(west, lng!);
      south = Math.min(south, lat!);
      east = Math.max(east, lng!);
      north = Math.max(north, lat!);
    }
  }
  const found = features.length > 0;
  useEffect(() => {
    if (map && isLoaded && found) {
      map.fitBounds([west, south, east, north], { padding: 40, maxZoom: 14 });
    }
  }, [map, isLoaded, found, west, south, east, north]);
  return null;
}
