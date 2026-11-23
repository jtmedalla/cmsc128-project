import { z } from 'zod';

/** An incident type as admins manage it, retired ones included. */
export const incidentTypeSchema = z.object({
  id: z.uuid(),
  /** Stable key the classifier returns; set once from the first name. */
  code: z.string(),
  name: z.string(),
  /** False once retired: hidden from intake and report forms. */
  isActive: z.boolean(),
  /**
   * Whether a report has it or a report correction names it. Only types not
   * in use can be deleted; the rest are retired.
   */
  inUse: z.boolean(),
});
export type IncidentType = z.infer<typeof incidentTypeSchema>;

export const incidentTypeIdParamsSchema = z.object({ id: z.uuid() });

/** The code for a new type's name: lowercase words joined by underscores. */
export function incidentTypeCode(name: string) {
  return name
    .normalize('NFD')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_|_$/g, '');
}

const nameSchema = z.string().trim().min(1, 'Enter a name').max(60);

export const incidentTypeCreateSchema = z.object({
  name: nameSchema.refine((name) => incidentTypeCode(name) !== '', {
    message: 'Use at least one letter or number',
  }),
});
export type IncidentTypeCreate = z.infer<typeof incidentTypeCreateSchema>;

/** A rename, a retirement or a restore; the code never changes. */
export const incidentTypeUpdateSchema = z
  .object({ name: nameSchema, isActive: z.boolean() })
  .partial()
  .refine((changes) => Object.keys(changes).length > 0, {
    message: 'Nothing to change',
  });
export type IncidentTypeUpdate = z.infer<typeof incidentTypeUpdateSchema>;
