import { z } from 'zod';
import {
  type AnyoneHurt,
  anyoneHurtSchema,
  type SeverityLevel,
  severityLevelSchema,
  type Sex,
  sexSchema,
} from '../enums.js';

/**
 * Details intake asks residents for, in the order they're asked. Chat skips
 * the ones it already knows; the public form shows them all.
 */
export const intakeFieldSchema = z.enum([
  'incidentType',
  'barangay',
  'severity',
  'anyoneHurt',
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

/**
 * The option whose names include `text`, ignoring case and surrounding
 * spaces, or null.
 */
export function matchChoice<T>(
  text: string,
  options: readonly T[],
  namesOf: (option: T) => string[],
): T | null {
  const key = text.trim().toLowerCase();
  return (
    options.find((option) =>
      namesOf(option).some((name) => name.toLowerCase() === key),
    ) ?? null
  );
}

/** Matches a severity as its value or label, ignoring case. */
export function parseSeverity(text: string): SeverityLevel | null {
  return matchChoice(text, severityLevelSchema.options, (level) => [
    level,
    SEVERITY_LABELS[level],
  ]);
}

/** The "Don't know" choice offered on questions residents may not know. */
export const DONT_KNOW = "Don't know";

const DONT_KNOW_WORDS = [
  DONT_KNOW,
  'dont know',
  'don’t know',
  'unknown',
  'not sure',
  'ambot',
  'hindi ko alam',
];

/** Whether the resident answered that they don't know. */
export function isDontKnow(text: string): boolean {
  return (
    matchChoice(
      text.replace(/[.!]+$/, ''),
      [DONT_KNOW],
      () => DONT_KNOW_WORDS,
    ) !== null
  );
}

export const ANYONE_HURT_LABELS: Record<AnyoneHurt, string> = {
  yes: 'Yes',
  no: 'No',
  unknown: DONT_KNOW,
};

/** Other words residents use for each answer, in English and local languages. */
const ANYONE_HURT_WORDS: Record<AnyoneHurt, string[]> = {
  yes: ['oo', 'huo', 'meron', 'may ara'],
  no: ['none', 'no one', 'nobody', 'wala', 'wala man', 'hindi', 'indi'],
  unknown: DONT_KNOW_WORDS,
};

/** Matches an "Is anyone hurt?" answer as its value, label or a known word. */
export function parseAnyoneHurt(text: string): AnyoneHurt | null {
  return matchChoice(
    text.replace(/[.!]+$/, ''),
    anyoneHurtSchema.options,
    (a) => [a, ANYONE_HURT_LABELS[a], ...ANYONE_HURT_WORDS[a]],
  );
}

export const SEX_LABELS: Record<Sex, string> = {
  male: 'Male',
  female: 'Female',
};

const SEX_WORDS: Record<Sex, string[]> = {
  male: ['m', 'man', 'boy', 'lalaki', 'lalake'],
  female: ['f', 'woman', 'girl', 'babae', 'babayi'],
};

/** Matches a sex as its value, label or a known word, ignoring case. */
export function parseSex(text: string): Sex | null {
  return matchChoice(text.replace(/[.!]+$/, ''), sexSchema.options, (sex) => [
    sex,
    SEX_LABELS[sex],
    ...SEX_WORDS[sex],
  ]);
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
