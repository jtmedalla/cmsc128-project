import workerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?url';
import { queryOptions, useQuery } from '@tanstack/react-query';
import { setWorkerUrl, type StyleSpecification } from 'maplibre-gl';
import { useContext, useMemo } from 'react';
import { Map as BaseMap, type MapRef } from '@/components/ui/map';
import { ThemeContext } from '@/hooks/use-theme';
import { paintStyle } from '@/lib/map-palette';

/* Serve MapLibre's worker from our build, not unpkg, so maps work offline. */
setWorkerUrl(workerUrl);

/** [lng, lat] the app's maps open on: the municipality's poblacion. */
const DEFAULT_CENTER: [number, number] = [122.24, 10.7];
const DEFAULT_ZOOM = 11;

/* OpenFreeMap's Liberty: detailed labels, roads and 3D buildings. */
const LIBERTY = 'https://tiles.openfreemap.org/styles/liberty';

/* Liberty's style JSON, fetched once per session; tiles load from it. */
const libertyQuery = queryOptions({
  queryKey: ['basemap', 'liberty'],
  queryFn: async (): Promise<StyleSpecification> => {
    const response = await fetch(LIBERTY);
    if (!response.ok) throw new Error(`Liberty style: ${response.status}`);
    return response.json();
  },
  staleTime: Infinity,
});

/**
 * Liberty recolored for both themes before MapLibre draws it, so the stock
 * colors never flash. Undefined until the style JSON arrives.
 */
function useBasemapStyles() {
  const { data } = useQuery(libertyQuery);
  return useMemo(
    () =>
      data && {
        light: paintStyle(data, 'light'),
        dark: paintStyle(data, 'dark'),
      },
    [data],
  );
}

/** The app's map: mapcn's `Map` with our base map, view and theme; any prop overrides them. */
export function Map({
  ref,
  ...props
}: React.ComponentProps<typeof BaseMap> & { ref?: React.Ref<MapRef> }) {
  // mapcn only reads a `dark` or `light` class on <html> and otherwise follows
  // the OS, but our toggle sets no class in light mode. Pass the chosen theme;
  // leave "system" (or no provider) to mapcn, which then follows the OS as we do.
  const theme = useContext(ThemeContext)?.theme;
  const styles = useBasemapStyles();
  return (
    <BaseMap
      ref={ref}
      center={DEFAULT_CENTER}
      zoom={DEFAULT_ZOOM}
      theme={theme === 'system' ? undefined : theme}
      // A blank base with the loader until our styles are ready; mapcn then swaps them in.
      {...(styles ? { styles } : { blank: true, loading: true })}
      {...props}
    />
  );
}
