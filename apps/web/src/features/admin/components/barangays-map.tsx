import type { Barangay } from '@repo/shared';
import type * as GeoJSON from 'geojson';
import { useEffect, useMemo, useState } from 'react';
import { Map as AppMap } from '@/components/map';
import { MapControls, MapGeoJSON, useMap } from '@/components/ui/map';

type Terrain = 'coastal' | 'upland' | 'both' | 'neither';
type Properties = { id: string; name: string; terrain: Terrain };

const TERRAIN: Record<Terrain, { label: string; color: string }> = {
  coastal: { label: 'Coastal', color: '#3b82f6' },
  upland: { label: 'Upland', color: '#16a34a' },
  both: { label: 'Both', color: '#9333ea' },
  neither: { label: 'Neither', color: '#a3a3a3' },
};

function terrain({ isCoastal, isUpland }: Barangay): Terrain {
  if (isCoastal && isUpland) return 'both';
  if (isCoastal) return 'coastal';
  if (isUpland) return 'upland';
  return 'neither';
}

/**
 * Barangay boundaries colored by coastal and upland flags, outlining those
 * whose name contains `selected` as the table filter does; clicking one picks it.
 */
export function BarangaysMap({
  barangays,
  selected,
  onSelect,
}: {
  barangays: Barangay[];
  selected: string;
  onSelect: (name: string) => void;
}) {
  const [hovered, setHovered] = useState<string | null>(null);
  const data = useMemo(
    (): GeoJSON.FeatureCollection<GeoJSON.MultiPolygon, Properties> => ({
      type: 'FeatureCollection',
      features: barangays.flatMap((barangay) =>
        barangay.boundary
          ? [
              {
                type: 'Feature',
                geometry: barangay.boundary,
                properties: {
                  id: barangay.id,
                  name: barangay.name,
                  terrain: terrain(barangay),
                },
              },
            ]
          : [],
      ),
    }),
    [barangays],
  );
  const highlighted = useMemo(() => {
    const query = selected.trim().toLowerCase();
    return {
      ...data,
      features: query
        ? data.features.filter((feature) =>
            feature.properties.name.toLowerCase().includes(query),
          )
        : [],
    };
  }, [data, selected]);

  return (
    <div className="relative h-80 overflow-hidden rounded-md border">
      <AppMap className="size-full">
        <MapGeoJSON
          id="barangays"
          data={data}
          promoteId="id"
          interactive
          fillPaint={{
            'fill-color': [
              'match',
              ['get', 'terrain'],
              'coastal',
              TERRAIN.coastal.color,
              'upland',
              TERRAIN.upland.color,
              'both',
              TERRAIN.both.color,
              TERRAIN.neither.color,
            ],
            'fill-opacity': 0.35,
          }}
          fillHoverPaint={{ 'fill-opacity': 0.6 }}
          linePaint={{ 'line-color': '#525252', 'line-width': 0.75 }}
          onHover={(event) =>
            setHovered(event?.feature.properties.name ?? null)
          }
          onClick={(event) => onSelect(event.feature.properties.name)}
        />
        <MapGeoJSON
          id="barangay-selected"
          data={highlighted}
          fillPaint={false}
          linePaint={{ 'line-color': '#f59e0b', 'line-width': 3 }}
        />
        <FitBounds features={highlighted.features} />
        <MapControls showFullscreen />
      </AppMap>
      <div className="absolute top-2 left-2 flex flex-col gap-1 rounded-md bg-background/90 px-2 py-1.5 text-xs shadow-sm">
        {hovered && <span className="font-medium">{hovered}</span>}
        <div className="flex flex-wrap gap-x-3 gap-y-1">
          {Object.values(TERRAIN).map(({ label, color }) => (
            <span key={label} className="flex items-center gap-1">
              <span
                className="size-2.5 rounded-sm"
                style={{ backgroundColor: color }}
              />
              {label}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

/** Moves the map to frame `features`; stays put when there are none. */
function FitBounds({
  features,
}: {
  features: GeoJSON.Feature<GeoJSON.MultiPolygon>[];
}) {
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
