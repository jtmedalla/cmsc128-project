import { Link } from '@tanstack/react-router';
import { cn } from 'cn';
import { MapPin } from 'lucide-react';

/**
 * A place with a pin icon. Given a report, it links to the map centered on that
 * report; leave `reportId` out inside another link, or when there's no report.
 */
export function LocationLabel({
  text,
  reportId,
  className,
}: {
  text: string;
  reportId?: string;
  className?: string;
}) {
  const content = (
    <>
      {/* One line tall, so the pin centers on the first line even when the text wraps. */}
      <span aria-hidden className="flex h-lh shrink-0 items-center">
        <MapPin className="size-[1em]" />
      </span>
      <span>{text}</span>
    </>
  );
  const classes = cn('inline-flex items-start gap-1', className);

  if (!reportId) return <span className={classes}>{content}</span>;
  return (
    <Link
      to="/dashboard/map"
      search={{ report: reportId }}
      className={cn(classes, 'underline-offset-4 hover:underline')}
    >
      {content}
    </Link>
  );
}
