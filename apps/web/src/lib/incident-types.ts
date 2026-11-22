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

/** Icons for the common incident type codes. */
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

/**
 * The icon for an incident type. Admins manage the types, so any code missing
 * above (including "other"), or no type at all, falls back to a question mark.
 */
export function incidentTypeIcon(type: { code: string } | null): LucideIcon {
  return (type && ICONS[type.code]) ?? CircleHelp;
}
