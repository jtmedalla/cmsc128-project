import type { ReportStatus, SeverityLevel } from '@repo/shared';
import { cn } from 'cn';
import { Badge } from '@/components/ui/badge';
import { label } from '@/lib/format';

/**
 * The wireframe's report card badge (Figma "Incident Feed/Report Card"):
 * pill, 11px medium text, and a 6px dot before the label.
 */
function StateBadge({
  className,
  dotClassName,
  children,
}: {
  className: string;
  dotClassName: string;
  children: React.ReactNode;
}) {
  return (
    <Badge className={cn('h-auto rounded-xl text-[11px]', className)}>
      <span aria-hidden className={cn('size-1.5 rounded-full', dotClassName)} />
      {children}
    </Badge>
  );
}

/**
 * One color per severity, rising from green to red. Moderate keeps the
 * wireframe's exact badge (amber with a green dot); the wireframe draws Low the
 * same way, but by decision each level now gets its own color.
 */
const severityColors: Record<SeverityLevel, { badge: string; dot: string }> = {
  low: { badge: 'bg-[#dcfce7] text-[#14532d]', dot: 'bg-[#16a34a]' },
  moderate: { badge: 'bg-[#fef3c7] text-[#78350f]', dot: 'bg-[#16a34a]' },
  high: { badge: 'bg-[#ffedd5] text-[#7c2d12]', dot: 'bg-[#ea580c]' },
  critical: { badge: 'bg-[#fee2e2] text-[#7f1d1d]', dot: 'bg-[#dc2626]' },
};

export function SeverityBadge({ severity }: { severity: SeverityLevel }) {
  const colors = severityColors[severity];
  return (
    <StateBadge className={colors.badge} dotClassName={colors.dot}>
      {label(severity)}
    </StateBadge>
  );
}

/**
 * One color per report status, in the wireframe's pattern: a light (100) background,
 * dark (900) text, and a mid-tone (600) dot. Pending keeps the wireframe's exact grey.
 * Record<ReportStatus, ...> makes TypeScript flag a status added without a color.
 */
const statusColors: Record<ReportStatus, { badge: string; dot: string }> = {
  // Wireframe "New": not reviewed yet.
  pending: { badge: 'bg-[#f4f4f5] text-[#27272a]', dot: 'bg-[#71717a]' },
  // Blue: a responder checked it (#39).
  validated: { badge: 'bg-[#dbeafe] text-[#1e3a8a]', dot: 'bg-[#2563eb]' },
  // Violet: responders are on the way; a hue no severity uses.
  dispatched: { badge: 'bg-[#ede9fe] text-[#4c1d95]', dot: 'bg-[#7c3aed]' },
  // Green: handled.
  resolved: { badge: 'bg-[#dcfce7] text-[#14532d]', dot: 'bg-[#16a34a]' },
  // Slate: finished and inactive; blue-grey so it doesn't read as pending's grey.
  closed: { badge: 'bg-[#e2e8f0] text-[#0f172a]', dot: 'bg-[#475569]' },
  // Red: not a real incident.
  invalid: { badge: 'bg-[#fee2e2] text-[#7f1d1d]', dot: 'bg-[#dc2626]' },
};

export function StatusBadge({ status }: { status: ReportStatus }) {
  const colors = statusColors[status];
  return (
    <StateBadge className={colors.badge} dotClassName={colors.dot}>
      {label(status)}
    </StateBadge>
  );
}
