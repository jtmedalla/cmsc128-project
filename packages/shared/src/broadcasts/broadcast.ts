import { z } from 'zod';
import { broadcastKindSchema } from '../enums.js';
import { stringToDate } from '../codecs.js';

/** A sent broadcast of any kind, as responder lists show it. */
export const broadcastSummarySchema = z.object({
  id: z.uuid(),
  kind: broadcastKindSchema,
  messageBody: z.string(),
  sentAt: stringToDate,
  createdBy: z.object({
    id: z.string(),
    name: z.string(),
  }),
});
export type BroadcastSummary = z.output<typeof broadcastSummarySchema>;
