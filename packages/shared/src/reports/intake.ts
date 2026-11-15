import { z } from 'zod';
import { type SeverityLevel, severityLevelSchema } from '../enums.js';

/**
 * Details intake asks residents for, in the order they're asked. Chat skips
 * the ones it already knows; the public form shows them all.
 */
export const intakeFieldSchema = z.enum([
  'incidentType',
  'barangay',
  'severity',
  'contactNumber',
]);
export type IntakeField = z.infer<typeof intakeFieldSchema>;
export const INTAKE_FIELDS = intakeFieldSchema.options;

export const SEVERITY_LABELS: Record<SeverityLevel, string> = {
  low: 'Low',
  moderate: 'Moderate',
  high: 'High',
  critical: 'Critical',
};

/** Matches a severity as its value or label, ignoring case. */
export function parseSeverity(text: string): SeverityLevel | null {
  const key = text.trim().toLowerCase();
  return (
    severityLevelSchema.options.find(
      (level) => level === key || SEVERITY_LABELS[level].toLowerCase() === key,
    ) ?? null
  );
}

/**
 * A Philippine mobile number, normalized to `09XXXXXXXXX`. Accepts spaces,
 * dashes and a `+63` or `63` prefix.
 */
export const contactNumberSchema = z
  .string()
  .transform((value) =>
    value.replace(/[\s()-]/g, '').replace(/^\+?63(?=9)/, '0'),
  )
  .pipe(
    z.string().regex(/^09\d{9}$/, 'Enter a mobile number like 09171234567'),
  );
