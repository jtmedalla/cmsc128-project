import type { Language } from '@repo/shared';

/** Language names; ISO codes don't title-case into them. */
export const LANGUAGE_LABELS: Record<Language, string> = {
  hil: 'Hiligaynon',
  krj: 'Kinaray-a',
  tgl: 'Tagalog',
  eng: 'English',
};

/** "storm_surge" → "Storm surge" */
export function label(value: string) {
  const text = value.replaceAll('_', ' ');
  return text.charAt(0).toUpperCase() + text.slice(1);
}

/** "Oct 29, 2026, 4:30 PM" in Philippine format. */
export function formatTime(date: Date) {
  return date.toLocaleString('en-PH', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}
