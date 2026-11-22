import { Link } from '@tanstack/react-router';
import { CircleCheck, RotateCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatTime } from '@/lib/format';

type BroadcastCardProps = {
  id: string;
  sender: string;
  sentAt: Date;
  message: string;
  onResend: () => void;
};

/** One sent broadcast; the whole card opens its page, and Resend sits above the link. */
export function BroadcastCard({
  id,
  sender,
  sentAt,
  message,
  onResend,
}: BroadcastCardProps) {
  return (
    <article className="relative flex flex-col gap-2 rounded-xl border bg-card p-4 transition-colors hover:bg-muted/50">
      <div className="flex items-center justify-between gap-2">
        <p className="truncate text-xs text-muted-foreground">
          {sender} · {formatTime(sentAt)}
        </p>
        <span className="flex shrink-0 items-center gap-1 text-xs text-muted-foreground">
          <CircleCheck aria-hidden className="size-3.5" />
          Sent
        </span>
      </div>
      {/* The link's ::after stretches over the card, so the button stays a sibling, not nested in it. */}
      <Link
        to="/dashboard/broadcasts/$broadcastId"
        params={{ broadcastId: id }}
        className="text-sm whitespace-pre-wrap after:absolute after:inset-0 after:rounded-xl focus-visible:outline-none focus-visible:after:ring-3 focus-visible:after:ring-ring/50"
      >
        {message}
      </Link>
      <div className="flex justify-end">
        <Button
          type="button"
          variant="secondary"
          size="sm"
          className="relative z-10"
          onClick={onResend}
        >
          <RotateCw data-icon="inline-start" />
          Resend
        </Button>
      </div>
    </article>
  );
}
