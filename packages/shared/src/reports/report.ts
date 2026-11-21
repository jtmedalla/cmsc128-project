import { z } from 'zod';
import { geoPoint, stringToDate } from '../codecs.js';
import {
  directionSchema,
  reportStatusSchema,
  severityLevelSchema,
  sexSchema,
  sourceChannelSchema,
} from '../enums.js';
import { parseConfidenceSchema } from './parsed.js';
import { victimInputSchema } from './victim.js';

/**
 * A new report from any intake path: Messenger, web chat, the classifier or
 * the guided form. Unknown fields stay null for triage to fill in.
 */
export const reportInputSchema = z.object({
  /** Always the sender, even for proxy reports. */
  residentId: z.uuid(),
  sourceChannel: sourceChannelSchema,
  isProxy: z.boolean().default(false),
  incidentTypeId: z.uuid().nullish(),
  severity: severityLevelSchema.nullish(),
  barangayId: z.uuid().nullish(),
  locationText: z.string().trim().min(1).nullish(),
  location: geoPoint.nullish(),
  /** A `Date`, or an ISO string over the wire. */
  incidentAt: z.coerce.date<Date | string>().nullish(),
  victims: z.array(victimInputSchema).default([]),
  /** The resident's messages the report came from; linked to it. */
  messageIds: z.array(z.uuid()).default([]),
  /** False for form reports and classifier fallbacks. */
  parsedAutomatically: z.boolean().default(false),
  parseConfidence: parseConfidenceSchema.nullish(),
});
export type ReportInput = z.input<typeof reportInputSchema>;

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
  victimCount: z.int().min(0),
  /** The message the report came from, for the feed card; null if none or attachment-only. */
  firstMessage: z.string().nullable(),
  createdAt: stringToDate,
  updatedAt: stringToDate,
});
export type ReportFeedItem = z.output<typeof reportFeedItemSchema>;

/**
 * `message.attachments`: location payloads and media (docs/database.md). Only
 * `type` is kept; the page needs just enough to tell a location share apart.
 */
export const messageAttachmentsSchema = z.array(z.object({ type: z.string() }));

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
