import { z } from 'zod';
import { geoPoint } from '../codecs.js';

const barangayRef = z.object({ id: z.uuid(), name: z.string() }).nullable();

/** `GET /geo/geocode?q=`: free text to search for within Miagao. */
export const geocodeQuerySchema = z.object({ q: z.string().trim().min(1) });

/** A place found for free text; the route answers 404 when nothing matches. */
export const geocodeResultSchema = z.object({
  point: geoPoint,
  barangay: barangayRef,
});
export type GeocodeResult = z.infer<typeof geocodeResultSchema>;

/** `GET /geo/reverse?lat=&lng=`: a point to name. */
export const reverseGeocodeQuerySchema = z.object({
  lat: z.coerce.number().min(-90).max(90),
  lng: z.coerce.number().min(-180).max(180),
});

/** The place at a point; `label` is null when nothing is near. */
export const reverseGeocodeResultSchema = z.object({
  label: z.string().nullable(),
  barangay: barangayRef,
});
export type ReverseGeocodeResult = z.infer<typeof reverseGeocodeResultSchema>;
