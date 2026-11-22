import { relations } from 'drizzle-orm';
import {
  index,
  integer,
  pgTable,
  text,
  timestamp,
  unique,
  uuid,
} from 'drizzle-orm/pg-core';
import { user } from './auth.js';
import { geometryPolygon } from './columns.js';
import {
  broadcastKind,
  deliveryStatus,
  hazardType,
  sourceChannel,
} from './enums.js';
import { report } from './report.js';
import { resident } from './resident.js';

/** An advisory or survey sent to many residents. */
export const broadcast = pgTable(
  'broadcast',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    createdBy: text('created_by')
      .notNull()
      .references(() => user.id, { onDelete: 'restrict' }),
    kind: broadcastKind('kind').notNull(),
    messageBody: text('message_body').notNull(),
    /** Empty means the whole municipality. */
    targetBarangayIds: uuid('target_barangay_ids')
      .array()
      .default([])
      .notNull(),
    /** Matched against `barangay.hazards`. */
    targetHazard: hazardType('target_hazard'),
    /** Custom target area (Stretch). */
    targetArea: geometryPolygon('target_area'),
    /** Surveys only; sets the non-respondent window. */
    respondBy: timestamp('respond_by'),
    sentAt: timestamp('sent_at'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => [
    index('broadcast_created_by_idx').on(table.createdBy),
    index('broadcast_target_area_idx').using('gist', table.targetArea),
  ],
);

/** A survey answer, shown as a chat quick reply. */
export const broadcastOption = pgTable(
  'broadcast_option',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    broadcastId: uuid('broadcast_id')
      .notNull()
      .references(() => broadcast.id, { onDelete: 'restrict' }),
    label: text('label').notNull(),
    displayOrder: integer('display_order').notNull(),
  },
  (table) => [index('broadcast_option_broadcast_id_idx').on(table.broadcastId)],
);

/**
 * One send to one resident on one channel. Delivery counts come from here,
 * not from the size of the target.
 */
export const broadcastDelivery = pgTable(
  'broadcast_delivery',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    broadcastId: uuid('broadcast_id')
      .notNull()
      .references(() => broadcast.id, { onDelete: 'restrict' }),
    residentId: uuid('resident_id')
      .notNull()
      .references(() => resident.id, { onDelete: 'restrict' }),
    channel: sourceChannel('channel').notNull(),
    status: deliveryStatus('status').default('queued').notNull(),
    sentAt: timestamp('sent_at'),
  },
  (table) => [
    unique('broadcast_delivery_broadcast_resident_channel_key').on(
      table.broadcastId,
      table.residentId,
      table.channel,
    ),
    index('broadcast_delivery_resident_id_idx').on(table.residentId),
  ],
);

/** A resident's survey answer, one per resident per survey. */
export const broadcastResponse = pgTable(
  'broadcast_response',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    broadcastId: uuid('broadcast_id')
      .notNull()
      .references(() => broadcast.id, { onDelete: 'restrict' }),
    residentId: uuid('resident_id')
      .notNull()
      .references(() => resident.id, { onDelete: 'restrict' }),
    selectedOptionId: uuid('selected_option_id')
      .notNull()
      .references(() => broadcastOption.id, { onDelete: 'restrict' }),
    respondedAt: timestamp('responded_at').defaultNow().notNull(),
    /** Set when a responder escalates the response into a report. */
    escalatedReportId: uuid('escalated_report_id')
      .unique()
      .references(() => report.id, { onDelete: 'restrict' }),
  },
  (table) => [
    unique('broadcast_response_broadcast_resident_key').on(
      table.broadcastId,
      table.residentId,
    ),
    index('broadcast_response_resident_id_idx').on(table.residentId),
    index('broadcast_response_selected_option_id_idx').on(
      table.selectedOptionId,
    ),
  ],
);

export const broadcastRelations = relations(broadcast, ({ one, many }) => ({
  creator: one(user, {
    fields: [broadcast.createdBy],
    references: [user.id],
  }),
  options: many(broadcastOption),
  deliveries: many(broadcastDelivery),
  responses: many(broadcastResponse),
}));

export const broadcastOptionRelations = relations(
  broadcastOption,
  ({ one, many }) => ({
    broadcast: one(broadcast, {
      fields: [broadcastOption.broadcastId],
      references: [broadcast.id],
    }),
    responses: many(broadcastResponse),
  }),
);

export const broadcastDeliveryRelations = relations(
  broadcastDelivery,
  ({ one }) => ({
    broadcast: one(broadcast, {
      fields: [broadcastDelivery.broadcastId],
      references: [broadcast.id],
    }),
    resident: one(resident, {
      fields: [broadcastDelivery.residentId],
      references: [resident.id],
    }),
  }),
);

export const broadcastResponseRelations = relations(
  broadcastResponse,
  ({ one }) => ({
    broadcast: one(broadcast, {
      fields: [broadcastResponse.broadcastId],
      references: [broadcast.id],
    }),
    resident: one(resident, {
      fields: [broadcastResponse.residentId],
      references: [resident.id],
    }),
    selectedOption: one(broadcastOption, {
      fields: [broadcastResponse.selectedOptionId],
      references: [broadcastOption.id],
    }),
    escalatedReport: one(report, {
      fields: [broadcastResponse.escalatedReportId],
      references: [report.id],
    }),
  }),
);
