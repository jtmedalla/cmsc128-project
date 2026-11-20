import { z } from 'zod';

export const healthStatusSchema = z.enum(['ok', 'error']);
export type HealthStatus = z.infer<typeof healthStatusSchema>;

export const healthSchema = z.object({
  /** `error` when any check fails. */
  status: healthStatusSchema,
  checks: z.object({
    database: healthStatusSchema,
  }),
  /** Seconds since the API process started. */
  uptime: z.number().nonnegative(),
  checkedAt: z.iso.datetime(),
});
export type Health = z.infer<typeof healthSchema>;
