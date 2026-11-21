import { z } from 'zod';
import { geoPoint } from '../codecs.js';
import {
  anyoneHurtSchema,
  severityLevelSchema,
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
  /** Defaults to `yes` when `victims` isn't empty. */
  anyoneHurt: anyoneHurtSchema.nullish(),
  victims: z.array(victimInputSchema).default([]),
  /** The resident's messages the report came from; linked to it. */
  messageIds: z.array(z.uuid()).default([]),
  /** False for form reports and classifier fallbacks. */
  parsedAutomatically: z.boolean().default(false),
  parseConfidence: parseConfidenceSchema.nullish(),
});
export type ReportInput = z.input<typeof reportInputSchema>;
