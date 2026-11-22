import { z } from 'zod';
import { geoPoint, stringToDate } from '../codecs.js';
import {
  anyoneHurtSchema,
  severityLevelSchema,
  sourceChannelSchema,
} from '../enums.js';
import { parseConfidenceSchema } from './parsed.js';
import { victimInputSchema } from './victim.js';

/**
 * A new report from any intake path: Messenger, web chat, the classifier,
 * the guided form or the dashboard. Unknown fields stay null for triage to
 * fill in.
 */
export const reportInputSchema = z
  .object({
    /** Always the sender, even for proxy reports; null for an unknown caller. */
    residentId: z.uuid().nullish(),
    /** The responder who logged it from the dashboard. */
    createdBy: z.string().min(1).nullish(),
    sourceChannel: sourceChannelSchema,
    isProxy: z.boolean().default(false),
    incidentTypeId: z.uuid().nullish(),
    severity: severityLevelSchema.nullish(),
    barangayId: z.uuid().nullish(),
    locationText: z.string().trim().min(1).nullish(),
    location: geoPoint.nullish(),
    /** A `Date`, or an ISO string over the wire. */
    incidentAt: z.coerce.date<Date | string>().nullish(),
    /** Defaults to `yes` when `victims` isn't empty. */
    anyoneHurt: anyoneHurtSchema.nullish(),
    victims: z.array(victimInputSchema).default([]),
    /** The resident's messages the report came from; linked to it. */
    messageIds: z.array(z.uuid()).default([]),
    /** False for form reports and classifier fallbacks. */
    parsedAutomatically: z.boolean().default(false),
    parseConfidence: parseConfidenceSchema.nullish(),
  })
  .refine(({ residentId, createdBy }) => residentId || createdBy, {
    message: 'A report needs a resident or a responder',
    path: ['residentId'],
  })
  .refine(({ residentId, messageIds }) => residentId || !messageIds.length, {
    message: 'Only a resident report has messages',
    path: ['messageIds'],
  });
export type ReportInput = z.input<typeof reportInputSchema>;

/**
 * A report a responder logs from the dashboard, such as a phone or radio call
 * (FR38). The API records the responder as its creator.
 */
export const dashboardReportInputSchema = z.object({
  incidentTypeId: z.uuid().nullish(),
  severity: severityLevelSchema.nullish(),
  barangayId: z.uuid().nullish(),
  locationText: z.string().trim().min(1).nullish(),
  /** An ISO string over the wire; a codec so the API can describe it in JSON Schema. */
  incidentAt: stringToDate.nullish(),
  anyoneHurt: anyoneHurtSchema.nullish(),
  victims: z.array(victimInputSchema).default([]),
});
export type DashboardReportInput = z.input<typeof dashboardReportInputSchema>;
export type DashboardReport = z.output<typeof dashboardReportInputSchema>;

/** An active incident type, as report forms list it. */
export const incidentTypeOptionSchema = z.object({
  id: z.uuid(),
  code: z.string(),
  name: z.string(),
});
export type IncidentTypeOption = z.infer<typeof incidentTypeOptionSchema>;

/** The created report's ID, returned by `POST /intake/reports`. */
export const createdReportSchema = z.object({ id: z.uuid() });
