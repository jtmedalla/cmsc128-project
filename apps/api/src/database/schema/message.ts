import { relations, sql } from 'drizzle-orm';
import {
  index,
  jsonb,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core';
import { user } from './auth.js';
import { direction, sourceChannel } from './enums.js';
import { report } from './report.js';
import { resident } from './resident.js';

/**
 * Every inbound and outbound chat message. Saved before processing, so it is
 * the fallback record when parsing fails.
 */
export const message = pgTable(
  'message',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    residentId: uuid('resident_id')
      .notNull()
      .references(() => resident.id, { onDelete: 'restrict' }),
    reportId: uuid('report_id').references(() => report.id, {
      onDelete: 'restrict',
    }),
    channel: sourceChannel('channel').notNull(),
    direction: direction('direction').notNull(),
    /** The responder who sent it; null for the bot or the resident. */
    senderId: text('sender_id').references(() => user.id, {
      onDelete: 'restrict',
    }),
    /** Raw text; null for location-only messages. */
    body: text('body'),
    /** Location payloads, and storage keys if files are added. */
    attachments: jsonb('attachments'),
    /** Platform message ID; unique per channel, so platform retries are dropped. */
    externalId: text('external_id'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex('message_channel_external_id_key')
      .on(table.channel, table.externalId)
      .where(sql`${table.externalId} is not null`),
    index('message_resident_id_created_at_idx').on(
      table.residentId,
      table.createdAt,
    ),
    index('message_report_id_idx').on(table.reportId),
  ],
);

export const messageRelations = relations(message, ({ one }) => ({
  resident: one(resident, {
    fields: [message.residentId],
    references: [resident.id],
  }),
  report: one(report, {
    fields: [message.reportId],
    references: [report.id],
  }),
  sender: one(user, {
    fields: [message.senderId],
    references: [user.id],
  }),
}));
