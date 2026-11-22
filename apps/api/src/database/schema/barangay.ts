import { relations } from 'drizzle-orm';
import { boolean, index, pgTable, text, uuid } from 'drizzle-orm/pg-core';
import { geometryMultiPolygon, geometryPoint } from './columns.js';
import { hazardType } from './enums.js';
import { report } from './report.js';
import { resident } from './resident.js';

/**
 * Miagao's 119 barangays, for resolving locations and targeting broadcasts.
 * Seeded by migration from `scripts/build-barangays.py` (PSA boundaries,
 * Project NOAH hazard maps, Copernicus elevation).
 */
export const barangay = pgTable(
  'barangay',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    name: text('name').notNull().unique(),
    /** Pin when only the barangay is known. */
    centroid: geometryPoint('centroid').notNull(),
    /** PSA/NAMRIA 2023 boundary. */
    boundary: geometryMultiPolygon('boundary'),
    /** Targets storm surge and gale advisories. */
    isCoastal: boolean('is_coastal').default(false).notNull(),
    /** Targets landslide advisories. */
    isUpland: boolean('is_upland').default(false).notNull(),
    /** From Project NOAH hazard maps; matched by `broadcast.target_hazard`. */
    hazards: hazardType('hazards').array().default([]).notNull(),
  },
  (table) => [
    index('barangay_centroid_idx').using('gist', table.centroid),
    index('barangay_boundary_idx').using('gist', table.boundary),
  ],
);

export const barangayRelations = relations(barangay, ({ many }) => ({
  residents: many(resident),
  reports: many(report),
}));
