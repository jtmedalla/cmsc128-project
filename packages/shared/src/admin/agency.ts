import { z } from 'zod';

/** A partner agency as admins manage it, retired ones included. */
export const agencySchema = z.object({
  id: z.uuid(),
  name: z.string(),
  /** A landline or mobile number, as dialed, e.g. `(033) 315-8000`. */
  contactNumber: z.string().nullable(),
  /** Listed on `/info/hotlines` while active. */
  isPublic: z.boolean(),
  /** False once retired: hidden from hotlines and referrals. */
  isActive: z.boolean(),
});
export type Agency = z.infer<typeof agencySchema>;

export const agencyIdParamsSchema = z.object({ id: z.uuid() });

const fieldsSchema = z.object({
  name: z.string().trim().min(1, 'Enter a name').max(100),
  contactNumber: z
    .string()
    .trim()
    .max(30)
    .regex(/^\+?[\d\s()-]*\d[\d\s()-]*$/, 'Enter a number like (033) 315-8000')
    .nullable(),
  isPublic: z.boolean(),
});

const hasNumberIfPublic = {
  check: ({
    isPublic,
    contactNumber,
  }: {
    isPublic: boolean;
    contactNumber: string | null;
  }) => !isPublic || contactNumber !== null,
  params: {
    message: 'A public agency needs a contact number',
    path: ['contactNumber'],
  },
};

export const agencyCreateSchema = fieldsSchema.refine(
  hasNumberIfPublic.check,
  hasNumberIfPublic.params,
);
export type AgencyCreate = z.infer<typeof agencyCreateSchema>;

/** Every editable field; callers send the others unchanged. */
export const agencyUpdateSchema = fieldsSchema
  .extend({ isActive: z.boolean() })
  .refine(hasNumberIfPublic.check, hasNumberIfPublic.params);
export type AgencyUpdate = z.infer<typeof agencyUpdateSchema>;
