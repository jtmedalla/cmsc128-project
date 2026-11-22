import { setWorkerUrl } from 'maplibre-gl';
import workerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?url';
import { useContext } from 'react';
import { Map as BaseMap, type MapRef } from '@/components/ui/map';
import { ThemeContext } from '@/hooks/use-theme';

/* Serve MapLibre's worker from our build, not unpkg, so maps work offline. */
setWorkerUrl(workerUrl);

/** [lng, lat] the app's maps open on: the municipality's poblacion. */
const DEFAULT_CENTER: [number, number] = [122.24, 10.7];
const DEFAULT_ZOOM = 11;

/* OpenFreeMap's Liberty: detailed labels, colored roads and 3D buildings. */
const LIBERTY = 'https://tiles.openfreemap.org/styles/liberty';
const STYLES = { light: LIBERTY, dark: LIBERTY };

/** The app's map: mapcn's `Map` with our base map, view and theme; any prop overrides them. */
export function Map({
  ref,
  ...props
}: React.ComponentProps<typeof BaseMap> & { ref?: React.Ref<MapRef> }) {
  // mapcn only reads a `dark` or `light` class on <html> and otherwise follows
  // the OS, but our toggle sets no class in light mode. Pass the chosen theme;
  // leave "system" (or no provider) to mapcn, which then follows the OS as we do.
  const theme = useContext(ThemeContext)?.theme;
  return (
    <BaseMap
      ref={ref}
      center={DEFAULT_CENTER}
      zoom={DEFAULT_ZOOM}
      theme={theme === 'system' ? undefined : theme}
      styles={STYLES}
      {...props}
    />
  );
}
