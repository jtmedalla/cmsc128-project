import { z } from 'zod';
import { stringToDate } from '../codecs.js';
import { languageSchema, sexSchema } from '../enums.js';

export const residentListItemSchema = z.object({
  id: z.uuid(),
  name: z.string().nullable(),
  contactNumber: z.string().nullable(),
  barangay: z.string().nullable(),
  reportCount: z.number().int().nonnegative(),
  broadcastsOptIn: z.boolean(),
  languagePreference: languageSchema,
  lastMessaged: stringToDate.nullable(),
});

export const residentListSchema = z.array(residentListItemSchema);

export type ResidentListItem = z.infer<typeof residentListItemSchema>;

export const residentProfileSchema = residentListItemSchema.extend({
  age: z.number().int().nonnegative().nullable(),
  sex: sexSchema.nullable(),
  locationText: z.string().nullable(),
});

export const residentIdParamsSchema = z.object({ id: z.uuid() });

export type ResidentProfile = z.infer<typeof residentProfileSchema>;
