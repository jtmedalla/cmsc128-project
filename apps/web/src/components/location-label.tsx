import { Link } from '@tanstack/react-router';
import { cn } from 'cn';
import { MapPin } from 'lucide-react';
import { IconText } from '@/components/icon-text';

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
  const label = (
    <IconText
      icon={MapPin}
      className={cn(
        reportId && 'underline-offset-4 group-hover/location:underline',
        className,
      )}
    >
      {text}
    </IconText>
  );
  if (!reportId) return label;
  return (
    <Link
      to="/dashboard/map"
      search={{ report: reportId }}
      className="group/location"
    >
      {label}
    </Link>
  );
}
