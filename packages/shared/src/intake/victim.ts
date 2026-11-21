import { z } from 'zod';
import { sexSchema } from '../enums.js';

/**
 * No name field: victim names are never stored (FR9). Age is a range, since
 * reporters often guess: an exact age has `ageMin` equal to `ageMax`, and an
 * open range like 60+ has no `ageMax`.
 */
export const victimInputSchema = z
  .object({
    sex: sexSchema.nullish(),
    ageMin: z.int().min(0).nullish(),
    ageMax: z.int().min(0).nullish(),
    medicalCondition: z.string().trim().min(1).nullish(),
  })
  .refine(
    ({ ageMin, ageMax }) =>
      ageMin == null || ageMax == null || ageMin <= ageMax,
    { message: 'ageMax must not be below ageMin', path: ['ageMax'] },
  );

export type VictimInput = z.infer<typeof victimInputSchema>;
