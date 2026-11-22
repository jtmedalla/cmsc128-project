import type { Direction } from '@repo/shared';
import { MessagesSquare } from 'lucide-react';
import { Bubble, BubbleContent } from '@/components/ui/bubble';
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty';
import {
  Message,
  MessageContent,
  MessageHeader,
} from '@/components/ui/message';
import {
  MessageScroller,
  MessageScrollerButton,
  MessageScrollerContent,
  MessageScrollerItem,
  MessageScrollerProvider,
  MessageScrollerViewport,
} from '@/components/ui/message-scroller';
import { formatTime } from '@/lib/format';

/** One chat message, from a report's conversation or a resident's thread. */
export type ThreadMessage = {
  id: string;
  direction: Direction;
  /** The responder who sent it; null for the bot or the resident. */
  senderId: string | null;
  body: string | null;
  attachments: { type: string }[] | null;
  createdAt: Date;
};

type Sender = 'resident' | 'bot' | 'responder';

/** Outbound with a sender_id is a responder; without one, the bot (see `message.senderId` in the API schema). */
function senderOf(m: ThreadMessage): Sender {
  if (m.direction === 'inbound') return 'resident';
  return m.senderId ? 'responder' : 'bot';
}

const SENDERS = {
  resident: { name: 'Resident', align: 'start', variant: 'muted' },
  bot: { name: 'MIGO', align: 'end', variant: 'secondary' },
  responder: { name: 'Responder', align: 'end', variant: 'default' },
} as const;

/** The text, or what an attachment-only message holds. */
function contentOf(m: ThreadMessage) {
  if (m.body !== null) return m.body;
  return m.attachments?.some((a) => a.type === 'location')
    ? 'Shared a location'
    : '(attachment)';
}

/**
 * A conversation that scrolls inside its parent and opens at the newest
 * message: residents on the left, MIGO and responders on the right. The
 * parent sets the height.
 */
export function MessageThread({ messages }: { messages: ThreadMessage[] }) {
  if (!messages.length) {
    return (
      <Empty>
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <MessagesSquare />
          </EmptyMedia>
          <EmptyTitle>No messages yet</EmptyTitle>
          <EmptyDescription>
            The conversation shows here once it starts.
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }

  return (
    <MessageScrollerProvider>
      <MessageScroller>
        <MessageScrollerViewport>
          <MessageScrollerContent className="gap-4 p-4">
            {messages.map((m) => {
              const sender = SENDERS[senderOf(m)];
              return (
                <MessageScrollerItem key={m.id} messageId={m.id}>
                  <Message align={sender.align}>
                    <MessageContent>
                      {/* Side and color already tell senders apart; screen readers hear the name. */}
                      <MessageHeader>
                        <span className="sr-only">{sender.name}, </span>
                        {formatTime(m.createdAt)}
                      </MessageHeader>
                      <Bubble variant={sender.variant} align={sender.align}>
                        <BubbleContent className="whitespace-pre-wrap">
                          {contentOf(m)}
                        </BubbleContent>
                      </Bubble>
                    </MessageContent>
                  </Message>
                </MessageScrollerItem>
              );
            })}
          </MessageScrollerContent>
        </MessageScrollerViewport>
        <MessageScrollerButton />
      </MessageScroller>
    </MessageScrollerProvider>
  );
}
