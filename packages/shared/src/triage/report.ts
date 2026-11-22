import { z } from 'zod';
import { geoPoint, stringToDate } from '../codecs.js';
import { messageAttachmentsSchema } from '../channels/message.js';
import {
  directionSchema,
  reportStatusSchema,
  severityLevelSchema,
  sexSchema,
  sourceChannelSchema,
} from '../enums.js';
import { parseConfidenceSchema } from '../intake/parsed.js';

/** A report as the triage feed lists it. */
export const reportFeedItemSchema = z.object({
  id: z.uuid(),
  status: reportStatusSchema,
  isProxy: z.boolean(),
  incidentType: z
    .object({ id: z.uuid(), code: z.string(), name: z.string() })
    .nullable(),
  severity: severityLevelSchema.nullable(),
  barangay: z.object({ id: z.uuid(), name: z.string() }).nullable(),
  locationText: z.string().nullable(),
  location: geoPoint.nullable(),
  incidentAt: stringToDate.nullable(),
  sourceChannel: sourceChannelSchema,
  parsedAutomatically: z.boolean(),
  parseConfidence: parseConfidenceSchema.nullable(),
  /** Null when a responder logged the report for an unknown caller. */
  resident: z.object({ id: z.uuid(), name: z.string().nullable() }).nullable(),
  /** The responder who logged it from the dashboard; null for resident reports. */
  creator: z.object({ id: z.string(), name: z.string() }).nullable(),
  victimCount: z.int().min(0),
  /** The message the report came from, for the feed card; null if none or attachment-only. */
  firstMessage: z.string().nullable(),
  createdAt: stringToDate,
  updatedAt: stringToDate,
});
export type ReportFeedItem = z.output<typeof reportFeedItemSchema>;

/**
 * One report as a signed-in responder reviews it. Unlike the feed item, it
 * carries the resident's contact number, so it must never reach a public page.
 */
// The detail carries the victims and messages themselves, so it drops the feed's summaries.
export const reportDetailSchema = reportFeedItemSchema
  .omit({ victimCount: true, firstMessage: true })
  .extend({
    resident: z
      .object({
        id: z.uuid(),
        name: z.string().nullable(),
        contactNumber: z.string().nullable(),
      })
      .nullable(),
    victims: z.array(
      z.object({
        id: z.uuid(),
        sex: sexSchema.nullable(),
        ageMin: z.int().min(0).nullable(),
        ageMax: z.int().min(0).nullable(),
        medicalCondition: z.string().nullable(),
      }),
    ),
    /** The conversation the report came from, oldest first. */
    messages: z.array(
      z.object({
        id: z.uuid(),
        direction: directionSchema,
        /** `message.sender_id`: the responder who sent it; null for the bot or the resident. */
        senderId: z.string().nullable(),
        body: z.string().nullable(),
        attachments: messageAttachmentsSchema.nullable(),
        createdAt: stringToDate,
      }),
    ),
  });
export type ReportDetail = z.output<typeof reportDetailSchema>;

/** Route params for one report, e.g. `GET /triage/reports/:id`. */
export const reportIdParamsSchema = z.object({ id: z.uuid() });
