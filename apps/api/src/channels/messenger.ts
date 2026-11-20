import { env } from '../config/env.js';

/** Messenger's limits for quick replies. */
export const MAX_QUICK_REPLIES = 13;
const MAX_QUICK_REPLY_TITLE = 20;

/** Matches the Graph API version Chat SDK's Messenger adapter uses. */
const GRAPH_API = 'https://graph.facebook.com/v21.0';

/**
 * Sends text with tappable quick replies, which Chat SDK's adapter doesn't
 * support. A tap arrives as an ordinary message whose text is the title.
 * Returns the sent message's ID.
 */
export async function sendQuickReplies(
  recipientId: string,
  text: string,
  choices: string[],
): Promise<string> {
  const url = new URL(`${GRAPH_API}/me/messages`);
  url.searchParams.set('access_token', env.FACEBOOK_PAGE_ACCESS_TOKEN ?? '');
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      recipient: { id: recipientId },
      messaging_type: 'RESPONSE',
      message: {
        text,
        quick_replies: choices.slice(0, MAX_QUICK_REPLIES).map((choice) => ({
          content_type: 'text',
          title: choice.slice(0, MAX_QUICK_REPLY_TITLE),
          payload: choice,
        })),
      },
    }),
  });
  const body = (await response.json()) as {
    message_id?: string;
    error?: { message: string };
  };
  if (!response.ok || !body.message_id) {
    throw new Error(
      `Messenger quick replies failed: ${body.error?.message ?? response.status}`,
    );
  }
  return body.message_id;
}
