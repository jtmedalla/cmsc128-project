import type { GeoPoint } from '@repo/shared';
import { and, eq, isNotNull, sql } from 'drizzle-orm';
import { barangay } from '../schema/index.js';
import type { Executor } from '../transaction.js';

/** Marks seeded chat identities, so a second run can tell it already ran. */
export const SEED_PREFIX = 'seed-';

/** Fake but well-formed PH mobile numbers; none belongs to a real person. */
export const fakeMobile = (n: number) => `0917000${String(n).padStart(4, '0')}`;

/** A time `days`, `hours` and `minutes` before the seed runs. */
export function ago({
  days = 0,
  hours = 0,
  minutes = 0,
}: {
  days?: number;
  hours?: number;
  minutes?: number;
}) {
  return new Date(Date.now() - ((days * 24 + hours) * 60 + minutes) * 60_000);
}

/** `date` plus `minutes`, for spacing out a conversation. */
export const later = (date: Date, minutes: number) =>
  new Date(date.getTime() + minutes * 60_000);

/**
 * A point a few hundred meters from `center`, so pins in one barangay don't
 * stack. Deterministic per `n`, so every run places them the same.
 */
export function near(center: GeoPoint, n: number): GeoPoint {
  const angle = n * 2.4;
  const distance = 0.0008 + (n % 4) * 0.0005;
  return {
    lng: Number((center.lng + Math.cos(angle) * distance).toFixed(6)),
    lat: Number((center.lat + Math.sin(angle) * distance).toFixed(6)),
  };
}

export interface Accounts {
  admin: string;
  /** The main responder, who handles most reports. */
  responder: string;
  /** A second responder, onboarded through an invite. */
  golez: string;
}

/** What every seed step needs: the transaction and the rows it builds on. */
export interface SeedContext {
  tx: Executor;
  accounts: Accounts;
  barangays: Map<
    string,
    { id: string; centroid: GeoPoint; isCoastal: boolean; isUpland: boolean }
  >;
  incidentTypes: Map<string, { id: string; name: string }>;
  agencies: Map<string, string>;
}

/** Looks up a barangay seeded by migration, failing loudly on a typo. */
export function barangayOf(ctx: SeedContext, name: string) {
  const found = ctx.barangays.get(name);
  if (!found) throw new Error(`Unknown barangay ${name}`);
  return found;
}

/**
 * A point inside the barangay's boundary, so pins land in the right place.
 * The seed `n` makes PostGIS pick the same point on every run.
 */
export async function pointIn(
  ctx: SeedContext,
  name: string,
  n: number,
): Promise<GeoPoint> {
  const place = barangayOf(ctx, name);
  const [row] = await ctx.tx
    .select({
      point: sql<string>`ST_AsGeoJSON(ST_GeometryN(ST_GeneratePoints(${barangay.boundary}, 1, ${n + 1}), 1))`,
    })
    .from(barangay)
    .where(and(eq(barangay.id, place.id), isNotNull(barangay.boundary)));
  if (!row) return near(place.centroid, n);
  const [lng, lat] = (JSON.parse(row.point) as { coordinates: number[] })
    .coordinates;
  return { lng: Number(lng!.toFixed(6)), lat: Number(lat!.toFixed(6)) };
}
