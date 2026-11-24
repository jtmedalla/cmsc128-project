import { z } from 'zod';
import { stringToDate } from '../codecs.js';
import { userRoleSchema } from '../enums.js';

/** A dashboard account as admins manage it. */
export const accountSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string(),
  role: userRoleSchema,
  /** False once an admin deactivates the account; it can't sign in. */
  active: z.boolean(),
  createdAt: stringToDate,
});
export type Account = z.output<typeof accountSchema>;

export const accountIdParamsSchema = z.object({ id: z.string().min(1) });

/** A role change, a (de)activation, or both. */
export const accountUpdateSchema = z
  .object({ role: userRoleSchema, active: z.boolean() })
  .partial()
  .refine((value) => value.role !== undefined || value.active !== undefined, {
    message: 'Change the role or the active flag',
  });
export type AccountUpdate = z.infer<typeof accountUpdateSchema>;
