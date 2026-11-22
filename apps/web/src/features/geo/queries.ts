import {
  barangaySchema,
  type GeoPoint,
  geocodeResultSchema,
  reverseGeocodeResultSchema,
} from '@repo/shared';
import { queryOptions } from '@tanstack/react-query';
import { api } from '@/lib/api';

/** Geo queries, for any signed-in user. */
export const geoQueries = {
  all: () => ['geo'] as const,

  /** All 119 barangays with boundaries, targeting flags and hazards. */
  barangays: () =>
    queryOptions({
      queryKey: [...geoQueries.all(), 'barangays'],
      queryFn: ({ signal }) =>
        api.get('/geo/barangays', barangaySchema.array(), { signal }),
    }),

  /** The place text names in Miagao, or null when none matches. Places don't move. */
  geocode: (q: string) =>
    queryOptions({
      queryKey: [...geoQueries.all(), 'geocode', q],
      queryFn: ({ signal }) =>
        api.getOrNull(
          `/geo/geocode?${new URLSearchParams({ q })}`,
          geocodeResultSchema,
          { signal },
        ),
      staleTime: Infinity,
    }),

  /** The place and barangay at a point. */
  reverse: ({ lng, lat }: GeoPoint) =>
    queryOptions({
      queryKey: [...geoQueries.all(), 'reverse', lng, lat],
      queryFn: ({ signal }) =>
        api.get(
          `/geo/reverse?${new URLSearchParams({ lat: String(lat), lng: String(lng) })}`,
          reverseGeocodeResultSchema,
          { signal },
        ),
      staleTime: Infinity,
    }),
};
