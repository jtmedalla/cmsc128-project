import { relations } from 'drizzle-orm';
import {
  boolean,
  index,
  pgTable,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core';
import { user } from './auth.js';
import { report } from './report.js';

/**
 * Partner agencies for referrals and the public hotlines page. Seeded by
 * migration; retired with `isActive`. Only a private agency no referral names
 * can be deleted.
 */
export const agency = pgTable('agency', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull().unique(),
  contactNumber: text('contact_number'),
  /** Shown on `/info/hotlines`. */
  isPublic: boolean('is_public').default(false).notNull(),
  /** Offered for referrals. */
  isActive: boolean('is_active').default(true).notNull(),
});

/** A report handed to a partner agency; a report can have several. */
export const agencyReferral = pgTable(
  'agency_referral',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    reportId: uuid('report_id')
      .notNull()
      .references(() => report.id, { onDelete: 'restrict' }),
    agencyId: uuid('agency_id')
      .notNull()
      .references(() => agency.id, { onDelete: 'restrict' }),
    referredAt: timestamp('referred_at').defaultNow().notNull(),
    referredBy: text('referred_by')
      .notNull()
      .references(() => user.id, { onDelete: 'restrict' }),
  },
  (table) => [
    index('agency_referral_report_id_idx').on(table.reportId),
    index('agency_referral_agency_id_idx').on(table.agencyId),
  ],
);

export const agencyRelations = relations(agency, ({ many }) => ({
  referrals: many(agencyReferral),
}));

export const agencyReferralRelations = relations(agencyReferral, ({ one }) => ({
  report: one(report, {
    fields: [agencyReferral.reportId],
    references: [report.id],
  }),
  agency: one(agency, {
    fields: [agencyReferral.agencyId],
    references: [agency.id],
  }),
  responder: one(user, {
    fields: [agencyReferral.referredBy],
    references: [user.id],
  }),
}));
