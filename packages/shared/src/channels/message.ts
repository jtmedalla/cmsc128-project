import { z } from 'zod';

/**
 * `message.attachments`: location payloads and media (see the API's message schema). Only
 * `type` is kept; the page needs just enough to tell a location share apart.
 */
export const messageAttachmentsSchema = z.array(z.object({ type: z.string() }));
