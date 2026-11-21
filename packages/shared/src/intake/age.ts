import { spellOutNumbers } from '../numbers.js';
import { matchChoice } from './intake.js';

/** An age in years from `min` to `max`; null `max` means "and up". */
export interface AgeRange {
  min: number | null;
  max: number | null;
}

/** Age groups residents can tap; Senior follows the PH senior-citizen age. */
export const AGE_GROUPS = {
  Child: { min: 0, max: 17 },
  Adult: { min: 18, max: 59 },
  Senior: { min: 60, max: null },
} as const satisfies Record<string, AgeRange>;
type AgeGroup = keyof typeof AGE_GROUPS;

const AGE_GROUP_WORDS: Record<AgeGroup, string[]> = {
  Child: ['kid', 'baby', 'infant', 'minor', 'bata'],
  Adult: ['grown up', 'grown-up', 'tito', 'tita'],
  Senior: [
    'elderly',
    'old',
    'senior citizen',
    'lolo',
    'lola',
    'matanda',
    'tigulang',
  ],
};

const MAX_AGE = 120;

/**
 * Year units after an age ("18 years old", "18yrs", "18 y/o", "18 taon",
 * "18 taong gulang"), stripped before matching so "60 years and above" reads
 * as "60 and above". The lookarounds stop it matching inside other words
 * ("toyo").
 */
const YEAR_UNITS =
  /(?<![a-z])(?:years?|yrs?|y\/?o|y\.o|anyos?|taong?(?:\s+gulang)?|gulang|tuig)(?![a-z])\.?(?:\s*old\b)?/g;

interface AgeRule {
  pattern: RegExp;
  read: (match: RegExpExecArray) => { min: number; max: number | null };
}

/** Years into a decade each part covers, e.g. "late 60s" is 67 to 69. */
type DecadePart = 'whole' | 'early' | 'mid' | 'late';
const DECADE_PARTS: Record<DecadePart, { from: number; to: number }> = {
  whole: { from: 0, to: 9 },
  early: { from: 0, to: 3 },
  mid: { from: 4, to: 6 },
  late: { from: 7, to: 9 },
};

/** The first number a rule captured, then the second. */
const first = (m: RegExpExecArray) => Number(m[1]);
const second = (m: RegExpExecArray) => Number(m[2]);

/**
 * Ways residents write an age, tried in order on lowercased text; the first
 * match wins. Specific shapes come before the exact-age fallback.
 */
const AGE_RULES: AgeRule[] = [
  // Babies, as the first number only, so "1 yr 6 months" stays 1:
  // "6 months", "6 mos", "6 buwan" / "6 na buwan" (Tagalog),
  // "6 bulan" / "6 ka bulan" (Hiligaynon).
  {
    pattern: /^\D*(\d+)\s*(?:(?:na|ka)\s+)?(?:months?|mos?|buwan|bulan)\b/,
    read: (m) => ({
      min: Math.floor(first(m) / 12),
      max: Math.floor(first(m) / 12),
    }),
  },
  // "2 weeks", "3 wks", "2 linggo", "2 semana", "5 days", "5 araw", "5 adlaw".
  {
    pattern:
      /^\D*(\d+)\s*(?:(?:na|ka)\s+)?(?:weeks?|wks?|linggo|semana|days?|araw|adlaw)\b/,
    read: () => ({ min: 0, max: 0 }),
  },
  // A range: "18-20", "18 to 20", "18 hanggang 20", "18 asta 20".
  {
    pattern: /(\d+)\s*(?:-|to|hanggang|asta)\s*(\d+)/,
    read: (m) => ({ min: first(m), max: second(m) }),
  },
  // "between 18 and 20", "between 18 & 20".
  {
    pattern: /\bbetween\s+(\d+)\s*(?:and|&)\s*(\d+)/,
    read: (m) => ({ min: first(m), max: second(m) }),
  },
  // Younger than an age, excluding it: "under 18", "below 18", "less than 18",
  // "younger than 18", "wala pang 18" (not yet 18), "<18" (but not "<=").
  {
    pattern:
      /(?:\b(?:under|below|less than|younger than|wala\s+pa(?:ng)?)|<(?!=))\s*(\d+)/,
    read: (m) => ({ min: 0, max: first(m) - 1 }),
  },
  // Up to an age, including it: "up to 18", "at most 18", "hanggang 18",
  // "<=18", "≤18".
  {
    pattern: /(?:\b(?:up to|at most|hanggang)|<=|≤)\s*(\d+)/,
    read: (m) => ({ min: 0, max: first(m) }),
  },
  // The same, with the word after the age: "18 and below", "18 or younger",
  // "18 or less", "18 and under", "18 down", "18 pababa". Includes the age,
  // as in local usage, so "17 below" means 17 or younger.
  {
    pattern:
      /(\d+)\s*(?:(?:and|or|&)\s*)?(?:below|under|younger|less|down|pababa)\b/,
    read: (m) => ({ min: 0, max: first(m) }),
  },
  // Older than an age, excluding it: "over 60", "above 60", "more than 60",
  // "older than 60", "lampas 60" / "lagpas 60" (past 60), ">60" (but not ">=").
  {
    pattern:
      /(?:\b(?:over|above|more than|older than|lampas|lagpas)|>(?!=))\s*(\d+)/,
    read: (m) => ({ min: first(m) + 1, max: null }),
  },
  // From an age up, including it: "at least 60", ">=60", "≥60".
  {
    pattern: /(?:\bat least|>=|≥)\s*(\d+)/,
    read: (m) => ({ min: first(m), max: null }),
  },
  // The same, with the word after the age: "60+", "60 and up",
  // "60 and above", "60 or older", "60 or more", "60 above", "60 pataas".
  {
    pattern:
      /(\d+)\s*(?:\+|(?:(?:and|or|&)\s*)?(?:up|above|over|older|more|pataas)\b)/,
    read: (m) => ({ min: first(m), max: null }),
  },
  // A decade, "60s" or "60's", or part of one: "early 60s" (60-63),
  // "mid-60s" (64-66), "late 60s" (67-69).
  {
    pattern: /\b(?:(early|mid|late)[\s-]*)?(\d+)0'?s\b/,
    read: (m) => {
      const decade = second(m) * 10;
      const { from, to } = DECADE_PARTS[(m[1] ?? 'whole') as DecadePart];
      return { min: decade + from, max: decade + to };
    },
  },
  // An exact age, the first number: "18", "about 8" is 8 to 8.
  {
    pattern: /(\d+)/,
    read: (m) => ({ min: first(m), max: first(m) }),
  },
];

/**
 * An age as a group ("Senior"), a range ("60-70"), a bound ("under 18",
 * "60+"), a decade ("60s", "late 60s"), months for babies ("6 months" is 0)
 * or an exact age ("about 18" is 18 to 18). See `AGE_RULES` for every form.
 * Null if `text` has none, or an age below 0 or over 120.
 */
export function parseAgeRange(text: string): AgeRange | null {
  const group = matchChoice(
    text.replace(/[.!]+$/, ''),
    Object.keys(AGE_GROUPS) as AgeGroup[],
    (g) => [g, ...AGE_GROUP_WORDS[g]],
  );
  if (group) return { ...AGE_GROUPS[group] };

  const clean = spellOutNumbers(text.toLowerCase()).replace(YEAR_UNITS, ' ');
  for (const { pattern, read } of AGE_RULES) {
    const match = pattern.exec(clean);
    if (!match) continue;
    const { min, max } = read(match);
    if (max !== null && max < 0) return null;
    if (min > MAX_AGE || (max ?? 0) > MAX_AGE) return null;
    return max !== null && max < min ? { min: max, max: min } : { min, max };
  }
  return null;
}

/** "18 years old", "60-69 years old", "60+ years old", or null if unknown. */
export function formatAgeRange(
  min: number | null,
  max: number | null,
): string | null {
  if (min === null && max === null) return null;
  if (max === null) return `${min}+ years old`;
  if (min === null || min === 0) return `Under ${max + 1}`;
  if (min === max) return `${min} years old`;
  return `${min}-${max} years old`;
}
