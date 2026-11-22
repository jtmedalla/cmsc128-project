import type { ReportStatus, SeverityLevel } from '@repo/shared';
import {
  CircleCheck,
  CircleDashed,
  CircleDot,
  CircleX,
  Contrast,
  type LucideIcon,
  Signal,
  SignalHigh,
  SignalLow,
  SignalMedium,
} from 'lucide-react';

/** How a report state looks wherever it appears; colors come from the tokens in index.css. */
export type StateStyle = {
  icon: LucideIcon;
  /** Tinted background with readable text, for badges. */
  badge: string;
  /** The solid color with readable content on it, for pins, legends and charts. */
  solid: string;
};

/** Signal bars that fill as severity rises. Classes are spelled out so Tailwind finds them. */
export const severityStyles: Record<SeverityLevel, StateStyle> = {
  low: {
    icon: SignalLow,
    badge: 'bg-severity-low/12 text-severity-low-foreground',
    solid: 'bg-severity-low text-on-severity-low',
  },
  moderate: {
    icon: SignalMedium,
    badge: 'bg-severity-moderate/12 text-severity-moderate-foreground',
    solid: 'bg-severity-moderate text-on-severity-moderate',
  },
  high: {
    icon: SignalHigh,
    badge: 'bg-severity-high/12 text-severity-high-foreground',
    solid: 'bg-severity-high text-on-severity-high',
  },
  critical: {
    icon: Signal,
    badge: 'bg-severity-critical/12 text-severity-critical-foreground',
    solid: 'bg-severity-critical text-on-severity-critical',
  },
};

/** A circle that fills as a report moves from pending to resolved; invalid is crossed out. */
export const statusStyles: Record<ReportStatus, StateStyle> = {
  pending: {
    icon: CircleDashed,
    badge: 'bg-status-pending/12 text-status-pending-foreground',
    solid: 'bg-status-pending text-on-status-pending',
  },
  validated: {
    icon: CircleDot,
    badge: 'bg-status-validated/12 text-status-validated-foreground',
    solid: 'bg-status-validated text-on-status-validated',
  },
  dispatched: {
    icon: Contrast,
    badge: 'bg-status-dispatched/12 text-status-dispatched-foreground',
    solid: 'bg-status-dispatched text-on-status-dispatched',
  },
  resolved: {
    icon: CircleCheck,
    badge: 'bg-status-resolved/12 text-status-resolved-foreground',
    solid: 'bg-status-resolved text-on-status-resolved',
  },
  closed: {
    icon: CircleCheck,
    badge: 'bg-status-closed/12 text-status-closed-foreground',
    solid: 'bg-status-closed text-on-status-closed',
  },
  invalid: {
    icon: CircleX,
    badge: 'bg-status-invalid/12 text-status-invalid-foreground',
    solid: 'bg-status-invalid text-on-status-invalid',
  },
};
