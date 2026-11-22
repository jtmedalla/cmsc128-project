import { Link } from '@tanstack/react-router';
import { cn } from 'cn';
import { UserRound } from 'lucide-react';
import { IconText } from '@/components/icon-text';

/**
 * A resident with a person icon, linked to their profile. A report from no known
 * resident reads "Unknown caller". Pass `link={false}` inside another link.
 */
export function ResidentLabel({
  resident,
  link = true,
  className,
}: {
  resident: { id: string; name: string | null } | null;
  link?: boolean;
  className?: string;
}) {
  const linked = link && resident !== null;
  const label = (
    <IconText
      icon={UserRound}
      className={cn(
        linked && 'underline-offset-4 group-hover/resident:underline',
        className,
      )}
    >
      {resident ? resident.name || 'Unnamed resident' : 'Unknown caller'}
    </IconText>
  );
  if (!linked) return label;
  return (
    <Link
      to="/dashboard/residents/$residentId"
      params={{ residentId: resident.id }}
      className="group/resident"
    >
      {label}
    </Link>
  );
}
