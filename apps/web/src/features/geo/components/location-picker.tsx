import type { Barangay, GeoPoint } from '@repo/shared';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Search } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { Map as AppMap } from '@/components/map';
import { Field, FieldDescription, FieldLabel } from '@/components/ui/field';
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from '@/components/ui/input-group';
import {
  MapControls,
  MapMarker,
  MarkerContent,
  useMap,
} from '@/components/ui/map';
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from '@/components/ui/combobox';
import type { LocationValue } from '../location';
import { geoQueries } from '../queries';

const PLACE_ZOOM = 16;
const BARANGAY_ZOOM = 14;

/** Calls `onPick` with the point a click lands on. */
function ClickToPick({ onPick }: { onPick: (point: GeoPoint) => void }) {
  const { map } = useMap();
  useEffect(() => {
    if (!map) return;
    const handle = (event: { lngLat: GeoPoint }) =>
      onPick({ lng: event.lngLat.lng, lat: event.lngLat.lat });
    map.on('click', handle);
    return () => {
      map.off('click', handle);
    };
  }, [map, onPick]);
  return null;
}

/** Flies to each new `target`. */
function FlyTo({
  target,
}: {
  target: { point: GeoPoint; zoom: number } | null;
}) {
  const { map } = useMap();
  useEffect(() => {
    if (map && target) map.flyTo({ center: target.point, zoom: target.zoom });
  }, [map, target]);
  return null;
}

/**
 * A location field over a map, with an optional barangay select, kept in
 * sync: searching the text, clicking the map, dragging the pin or "my
 * location" moves the pin and selects its barangay, and a pin names its
 * place; choosing a barangay moves the pin to it.
 */
export function LocationPicker({
  value,
  onChange,
  withBarangay = false,
  label = 'Location',
}: {
  value: LocationValue;
  onChange: (value: LocationValue) => void;
  /** Adds a barangay select that stays in sync with the pin. */
  withBarangay?: boolean;
  label?: string;
}) {
  const queryClient = useQueryClient();
  const barangays = useQuery({
    ...geoQueries.barangays(),
    enabled: withBarangay,
  });
  const [flyTarget, setFlyTarget] = useState<{
    point: GeoPoint;
    zoom: number;
  } | null>(null);
  const [searching, setSearching] = useState(false);
  // Lookups answer after more edits; they merge into the latest value.
  const latest = useRef(value);
  useEffect(() => {
    latest.current = value;
  }, [value]);
  // Only the latest search or pin may place the location; earlier answers are stale.
  const pinId = useRef(0);

  const update = (change: Partial<LocationValue>) => {
    latest.current = { ...latest.current, ...change };
    onChange(latest.current);
  };

  async function search() {
    const query = value.text.trim();
    if (!query) {
      toast.info('Type a place to find it on the map.');
      return;
    }
    const id = ++pinId.current;
    setSearching(true);
    try {
      const found = await queryClient.fetchQuery(geoQueries.geocode(query));
      if (id !== pinId.current) return;
      if (!found) {
        toast.info('No place in Miagao matches. Pin it on the map instead.');
        return;
      }
      update({ point: found.point, barangayId: found.barangay?.id ?? null });
      setFlyTarget({ point: found.point, zoom: PLACE_ZOOM });
    } catch {
      toast.error("Couldn't search for the place. Try again.");
    } finally {
      setSearching(false);
    }
  }

  async function pin(point: GeoPoint) {
    const id = ++pinId.current;
    update({ point });
    try {
      const place = await queryClient.fetchQuery(geoQueries.reverse(point));
      if (id !== pinId.current) return;
      update({
        ...(place.label && { text: place.label }),
        barangayId: place.barangay?.id ?? null,
      });
    } catch {
      // The pin stays; the place can still be typed.
    }
  }

  /** Pins the barangay's centroid and names it, as a pin names its place. */
  function selectBarangay(barangay: Barangay | null) {
    pinId.current++;
    if (!barangay) {
      update({ barangayId: null });
      return;
    }
    update({
      barangayId: barangay.id,
      point: barangay.centroid,
      text: barangay.name,
    });
    setFlyTarget({ point: barangay.centroid, zoom: BARANGAY_ZOOM });
  }

  return (
    <>
      {withBarangay && (
        <Field>
          <FieldLabel htmlFor="location-barangay">Barangay</FieldLabel>
          <Combobox
            items={barangays.data ?? []}
            value={
              barangays.data?.find((b) => b.id === value.barangayId) ?? null
            }
            onValueChange={(barangay: Barangay | null) =>
              selectBarangay(barangay)
            }
            itemToStringLabel={(barangay: Barangay) => barangay.name}
          >
            <ComboboxInput
              id="location-barangay"
              placeholder="Unknown"
              showClear
            />
            <ComboboxContent>
              <ComboboxEmpty>No barangay found.</ComboboxEmpty>
              <ComboboxList>
                {(barangay: Barangay) => (
                  <ComboboxItem key={barangay.id} value={barangay}>
                    {barangay.name}
                  </ComboboxItem>
                )}
              </ComboboxList>
            </ComboboxContent>
          </Combobox>
        </Field>
      )}
      <Field>
        <FieldLabel htmlFor="location-text">{label}</FieldLabel>
        <InputGroup>
          <InputGroupInput
            id="location-text"
            placeholder="Street, landmark or sitio"
            value={value.text}
            onChange={(event) => update({ text: event.target.value })}
            onKeyDown={(event) => {
              if (event.key !== 'Enter') return;
              // Enter searches instead of submitting the form.
              event.preventDefault();
              void search();
            }}
          />
          <InputGroupAddon align="inline-end">
            <InputGroupButton
              aria-label="Find on map"
              size="icon-xs"
              disabled={searching}
              onClick={() => void search()}
            >
              <Search />
            </InputGroupButton>
          </InputGroupAddon>
        </InputGroup>
        <div className="h-48 overflow-hidden rounded-lg border">
          <AppMap className="size-full">
            <ClickToPick onPick={pin} />
            <FlyTo target={flyTarget} />
            {value.point && (
              <MapMarker
                longitude={value.point.lng}
                latitude={value.point.lat}
                draggable
                onDragEnd={pin}
              >
                {/* MIGO orange, so the pin being placed stands out from report pins. */}
                <MarkerContent>
                  <div className="size-4 rounded-full border-2 border-background bg-highlight shadow-lg" />
                </MarkerContent>
              </MapMarker>
            )}
            <MapControls
              showLocate
              onLocate={({ longitude, latitude }) =>
                void pin({ lng: longitude, lat: latitude })
              }
            />
          </AppMap>
        </div>
        <FieldDescription>
          Search the place, click the map or use your location to pin it.
        </FieldDescription>
      </Field>
    </>
  );
}
