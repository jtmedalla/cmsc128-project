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
  /** True once a referral names it; only a retired, private, unused agency can be deleted. */
  inUse: z.boolean(),
});
export type Agency = z.infer<typeof agencySchema>;

export const agencyIdParamsSchema = z.object({ id: z.uuid() });

/** What the add and edit dialogs ask for. */
export const agencyDetailsSchema = z.object({
  name: z.string().trim().min(1, 'Enter a name').max(100),
  contactNumber: z
    .string()
    .trim()
    .max(30)
    .regex(/^\+?[\d\s()-]*\d[\d\s()-]*$/, 'Enter a number like (033) 315-8000')
    .nullable(),
});
export type AgencyDetails = z.infer<typeof agencyDetailsSchema>;

/** A new agency starts private; admins publish it from the table. */
export const agencyCreateSchema = agencyDetailsSchema;
export type AgencyCreate = AgencyDetails;

/** Every editable field; callers send the others unchanged. */
export const agencyUpdateSchema = agencyDetailsSchema
  .extend({ isPublic: z.boolean(), isActive: z.boolean() })
  .refine(
    ({ isPublic, contactNumber }) => !isPublic || contactNumber !== null,
    {
      message: 'A public agency needs a contact number',
      path: ['contactNumber'],
    },
  );
export type AgencyUpdate = z.infer<typeof agencyUpdateSchema>;
