import { z } from 'zod';
import { broadcastKindSchema } from '../enums.js';
import { stringToDate } from '../codecs.js';

/** A sent broadcast as it appears in the responder recent-advisories list. */
export const recentAdvisorySchema = z.object({
  id: z.uuid(),
  kind: broadcastKindSchema,
  messageBody: z.string(),
  sentAt: stringToDate,
  createdBy: z.object({
    id: z.string(),
    name: z.string(),
  }),
});
export type RecentAdvisory = z.output<typeof recentAdvisorySchema>;
