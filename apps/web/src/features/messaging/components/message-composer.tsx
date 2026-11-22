import { SendHorizontal } from 'lucide-react';
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from '@/components/ui/input-group';

/** The reply box under a conversation. */
// TODO(#12): send replies. #12 is the messaging epic; until a task covers
// replies, the box is shown disabled.
export function MessageComposer({
  placeholder = 'Type your message',
}: {
  placeholder?: string;
}) {
  return (
    <InputGroup>
      <InputGroupInput
        placeholder={placeholder}
        aria-label="Message"
        disabled
      />
      <InputGroupAddon align="inline-end">
        <InputGroupButton size="icon-xs" aria-label="Send" disabled>
          <SendHorizontal />
        </InputGroupButton>
      </InputGroupAddon>
    </InputGroup>
  );
}
