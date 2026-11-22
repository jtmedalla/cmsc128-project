import {
  Activity,
  CarFront,
  CircleHelp,
  Flame,
  HeartPulse,
  type LucideIcon,
  Mountain,
  Tent,
  Waves,
  Wind,
} from 'lucide-react';
import { IconText } from '@/components/icon-text';

/**
 * Icons for the common incident type codes. Admins manage the types, so any
 * code missing here (including "other") falls back to a question mark.
 */
const ICONS: Record<string, LucideIcon> = {
  fire: Flame,
  flood: Waves,
  storm_surge: Wind,
  landslide: Mountain,
  earthquake: Activity,
  accident: CarFront,
  medical: HeartPulse,
  evacuation: Tent,
};

/** An incident type's icon and name; a report without one reads "Unclassified incident". */
export function IncidentTypeLabel({
  type,
  className,
  children,
}: {
  type: { code: string; name: string } | null;
  className?: string;
  /** Text in place of the type's name, such as a report title. */
  children?: React.ReactNode;
}) {
  return (
    <IconText
      icon={(type && ICONS[type.code]) ?? CircleHelp}
      className={className}
    >
      {children ?? type?.name ?? 'Unclassified incident'}
    </IconText>
  );
}
