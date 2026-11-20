import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

type BroadcastCardProps = {
  recipient: string;
  posted: string;
  title: string;
  message: string;
  onViewRecipients: () => void;
  onResend: () => void;
};

export function BroadcastCard({
  recipient,
  posted,
  title,
  message,
  onViewRecipients,
  onResend,
}: BroadcastCardProps) {
  return (
    <article className="rounded-xl border border-border bg-card px-6 py-6 shadow-sm md:px-8">
      <div className="mb-2 flex items-start justify-between gap-4">
        <div className="flex min-w-0 items-center gap-2">
          <p className="truncate text-sm text-muted-foreground">
            {recipient} posted {posted}
          </p>
        </div>

        <Badge
          variant="secondary"
          className="h-8 shrink-0 rounded-full bg-primary px-3 text-sm text-primary-foreground"
        >
          Sent
        </Badge>
      </div>

      <h2 className="mb-3 text-lg font-bold leading-tight">{title}</h2>

      <p className="mb-4 text-sm leading-7">{message}</p>

      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-9 px-2 text-sm font-medium"
          onClick={onViewRecipients}
        >
          View recipients
        </Button>

        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-9 px-2 text-sm font-medium"
          onClick={onResend}
        >
          Resend
        </Button>
      </div>
    </article>
  );
}
