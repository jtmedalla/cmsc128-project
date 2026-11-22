import {
  type AnyoneHurt,
  parseAgeRange,
  type Sex,
  type VictimInput,
} from '@repo/shared';

/** A person as typed; the age is text until it parses. No name field (FR9). */
export interface VictimDraft {
  key: string;
  sex: Sex | null;
  age: string;
  medicalCondition: string;
}

export interface VictimsValue {
  /** Null until answered: nothing picked is unknown. */
  anyoneHurt: AnyoneHurt | null;
  victims: VictimDraft[];
}

/** True when the typed age doesn't parse; blank is just unknown. */
export function ageInvalid(age: string) {
  return age.trim() !== '' && !parseAgeRange(age);
}

/** Whether every sent person's age parses; hidden drafts don't count. */
export function victimsValid({ anyoneHurt, victims }: VictimsValue) {
  return anyoneHurt !== 'yes' || !victims.some((v) => ageInvalid(v.age));
}

/** The victims to send: only when someone is hurt, with blank details left unknown. */
export function toVictimInputs({
  anyoneHurt,
  victims,
}: VictimsValue): VictimInput[] {
  if (anyoneHurt !== 'yes') return [];
  return victims.map(({ sex, age, medicalCondition }) => {
    const range = age.trim() ? parseAgeRange(age) : null;
    return {
      sex,
      ageMin: range?.min ?? null,
      ageMax: range?.max ?? null,
      medicalCondition: medicalCondition.trim() || null,
    };
  });
}
