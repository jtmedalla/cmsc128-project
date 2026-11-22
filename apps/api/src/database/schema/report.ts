import { randomBytes } from 'node:crypto';
import { relations, sql } from 'drizzle-orm';
import {
  boolean,
  check,
  index,
  integer,
  jsonb,
  type AnyPgColumn,
  pgTable,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core';
import { agencyReferral } from './agency.js';
import { user } from './auth.js';
import { barangay } from './barangay.js';
import { geometryPoint, timestamps } from './columns.js';
import {
  anyoneHurt,
  reportStatus,
  severityLevel,
  sex,
  sourceChannel,
} from './enums.js';
import { message } from './message.js';
import { resident } from './resident.js';

/** Kinds of incident. Seeded by migration; admins add types and retire them. */
export const incidentType = pgTable('incident_type', {
  id: uuid('id').primaryKey().defaultRandom(),
  /** Stable key the classifier returns. */
  code: text('code').notNull().unique(),
  name: text('name').notNull(),
  /** Inactive types are hidden from the classifier and forms. */
  isActive: boolean('is_active').default(true).notNull(),
});

/**
 * An incident report. `residentId` is the sender, even when `isProxy` marks
 * the report as being about someone else.
 */
export const report = pgTable(
  'report',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    /** 128-bit, base64url; the key for `/status/:token`. */
    trackingToken: text('tracking_token')
      .notNull()
      .unique()
      .$defaultFn(() => randomBytes(16).toString('base64url')),
    /** Null only for responder-created reports from an unknown caller. */
    residentId: uuid('resident_id').references(() => resident.id, {
      onDelete: 'restrict',
    }),
    /** About someone other than the sender. */
    isProxy: boolean('is_proxy').default(false).notNull(),
    /** The responder who entered it; null for resident reports. */
    createdBy: text('created_by').references(() => user.id, {
      onDelete: 'restrict',
    }),
    reviewedBy: text('reviewed_by').references(() => user.id, {
      onDelete: 'restrict',
    }),
    /** The report this one repeats. */
    duplicateOfId: uuid('duplicate_of_id').references(
      (): AnyPgColumn => report.id,
      { onDelete: 'restrict' },
    ),
    /** `invalid` retires false alarms and duplicates; reports are never deleted. */
    status: reportStatus('status').default('pending').notNull(),
    incidentTypeId: uuid('incident_type_id').references(() => incidentType.id, {
      onDelete: 'restrict',
    }),
    severity: severityLevel('severity'),
    /** Null until the reporter says; `yes` with no victims means no details yet. */
    anyoneHurt: anyoneHurt('anyone_hurt'),
    barangayId: uuid('barangay_id').references(() => barangay.id, {
      onDelete: 'restrict',
    }),
    /** As reported. */
    locationText: text('location_text'),
    location: geometryPoint('location'),
    incidentAt: timestamp('incident_at'),
    sourceChannel: sourceChannel('source_channel').notNull(),
    /** False for form and fallback reports. */
    parsedAutomatically: boolean('parsed_automatically')
      .default(false)
      .notNull(),
    /** Field → confidence, shaped by `parseConfidenceSchema`. */
    parseConfidence: jsonb('parse_confidence'),
    ...timestamps,
  },
  (table) => [
    index('report_resident_id_idx').on(table.residentId),
    index('report_status_created_at_idx').on(table.status, table.createdAt),
    index('report_incident_type_id_idx').on(table.incidentTypeId),
    index('report_barangay_id_idx').on(table.barangayId),
    index('report_duplicate_of_id_idx').on(table.duplicateOfId),
    index('report_location_idx').using('gist', table.location),
  ],
);

/**
 * A person hurt in a report. No name is ever stored (FR9). A victim with every
 * column null means the reporter couldn't tell. Age is a range because
 * reporters guess: "60s" is 60 to 69, and Senior is 60 with no maximum.
 */
export const victim = pgTable(
  'victim',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    reportId: uuid('report_id')
      .notNull()
      .references(() => report.id, { onDelete: 'restrict' }),
    sex: sex('sex'),
    /** Equal to `age_max` for an exact age. */
    ageMin: integer('age_min'),
    /** Null for an open range like 60+. */
    ageMax: integer('age_max'),
    medicalCondition: text('medical_condition'),
  },
  (table) => [
    check('victim_age_min_check', sql`${table.ageMin} >= 0`),
    check(
      'victim_age_range_check',
      sql`${table.ageMax} >= coalesce(${table.ageMin}, 0)`,
    ),
    index('victim_report_id_idx').on(table.reportId),
  ],
);

/** Audit trail: one row per corrected field or status change. */
export const reportEdit = pgTable(
  'report_edit',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    reportId: uuid('report_id')
      .notNull()
      .references(() => report.id, { onDelete: 'restrict' }),
    responderId: text('responder_id')
      .notNull()
      .references(() => user.id, { onDelete: 'restrict' }),
    /** Column name, including `status`. */
    field: text('field').notNull(),
    oldValue: jsonb('old_value'),
    newValue: jsonb('new_value'),
    editedAt: timestamp('edited_at').defaultNow().notNull(),
  },
  (table) => [
    index('report_edit_report_id_edited_at_idx').on(
      table.reportId,
      table.editedAt,
    ),
  ],
);

export const incidentTypeRelations = relations(incidentType, ({ many }) => ({
  reports: many(report),
}));

export const reportRelations = relations(report, ({ one, many }) => ({
  resident: one(resident, {
    fields: [report.residentId],
    references: [resident.id],
  }),
  creator: one(user, {
    fields: [report.createdBy],
    references: [user.id],
    relationName: 'report_creator',
  }),
  reviewer: one(user, {
    fields: [report.reviewedBy],
    references: [user.id],
    relationName: 'report_reviewer',
  }),
  duplicateOf: one(report, {
    fields: [report.duplicateOfId],
    references: [report.id],
    relationName: 'report_duplicate',
  }),
  duplicates: many(report, { relationName: 'report_duplicate' }),
  incidentType: one(incidentType, {
    fields: [report.incidentTypeId],
    references: [incidentType.id],
  }),
  barangay: one(barangay, {
    fields: [report.barangayId],
    references: [barangay.id],
  }),
  victims: many(victim),
  messages: many(message),
  edits: many(reportEdit),
  referrals: many(agencyReferral),
}));

export const victimRelations = relations(victim, ({ one }) => ({
  report: one(report, {
    fields: [victim.reportId],
    references: [report.id],
  }),
}));

export const reportEditRelations = relations(reportEdit, ({ one }) => ({
  report: one(report, {
    fields: [reportEdit.reportId],
    references: [report.id],
  }),
  responder: one(user, {
    fields: [reportEdit.responderId],
    references: [user.id],
  }),
}));
