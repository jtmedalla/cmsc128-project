import type { Barangay } from '@repo/shared';
import type * as GeoJSON from 'geojson';
import { useMemo, useState } from 'react';
import { Map as AppMap } from '@/components/map';
import { MapControls, MapGeoJSON } from '@/components/ui/map';

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

/** Barangay boundaries colored by coastal and upland flags; clicking one picks it. */
export function BarangaysMap({
  barangays,
  onSelect,
}: {
  barangays: Barangay[];
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
