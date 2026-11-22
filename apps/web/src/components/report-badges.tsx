import type { ReportStatus, SeverityLevel } from '@repo/shared';
import { cn } from 'cn';
import { Signal } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { label } from '@/lib/format';
import {
  severityStyles,
  type StateStyle,
  statusStyles,
} from '@/lib/report-states';

function StateBadge({
  style: { icon: Icon, badge },
  track = false,
  className,
  children,
}: {
  style: StateStyle;
  /** Draws the full signal faintly behind the icon, so empty bars still show. */
  track?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <Badge className={cn(badge, className)}>
      <span
        aria-hidden
        data-icon="inline-start"
        className="relative size-3 shrink-0 [&>svg]:absolute"
      >
        {track && <Signal className="size-3 opacity-25" />}
        <Icon className="size-3" />
      </span>
      {children}
    </Badge>
  );
}

export function SeverityBadge({
  severity,
  className,
}: {
  severity: SeverityLevel;
  className?: string;
}) {
  return (
    <StateBadge style={severityStyles[severity]} track className={className}>
      {label(severity)}
    </StateBadge>
  );
}

export function StatusBadge({
  status,
  className,
}: {
  status: ReportStatus;
  className?: string;
}) {
  return (
    <StateBadge style={statusStyles[status]} className={className}>
      {label(status)}
    </StateBadge>
  );
}
