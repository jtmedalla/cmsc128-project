import { z } from 'zod';

/** A public, active agency's number, as `/info/hotlines` lists it. */
export const hotlineSchema = z.object({
  name: z.string(),
  contactNumber: z.string(),
});
export type Hotline = z.infer<typeof hotlineSchema>;
