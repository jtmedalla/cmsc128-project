import {
  ANYONE_HURT_LABELS,
  contactNumberSchema,
  DONT_KNOW,
  type IntakeField,
  isDontKnow,
  matchChoice,
  AGE_GROUPS,
  type AgeRange,
  parseAgeRange,
  parseAnyoneHurt,
  parseSeverity,
  parseSex,
  SEVERITY_LABELS,
  SEX_LABELS,
  type Sex,
  type SourceChannel,
} from '@repo/shared';
import type { BarangayService } from '../geo/barangay.service.js';
import type { IntakeService } from './intake.service.js';

/** The resident and report a chat message belongs to. */
export interface Turn {
  channel: SourceChannel;
  residentId: string;
  reportId: string;
}

/** Services questions use to list choices and save answers. */
export interface QuestionDeps {
  intake: IntakeService;
  barangays: BarangayService;
}

export interface Question {
  ask: string;
  /** Sent before `ask` when an answer doesn't fit. */
  retry: string;
  /** Answers the resident can tap. */
  choices?(deps: QuestionDeps): Promise<string[]> | string[];
  /** Saves the answer; false if it doesn't fit the question. */
  answer(text: string, turn: Turn, deps: QuestionDeps): Promise<boolean>;
}

/**
 * What chat asks for each intake field, and how it reads the answer.
 * `victims` is asked person by person through {@link VICTIM_STEPS}.
 */
export const QUESTIONS: Record<Exclude<IntakeField, 'victims'>, Question> = {
  incidentType: {
    ask: 'What happened?',
    retry: 'Please pick the closest one.',
    choices: async ({ intake }) =>
      (await intake.incidentTypes()).map(({ name }) => name),
    async answer(text, turn, { intake }) {
      const type = matchChoice(text, await intake.incidentTypes(), (t) => [
        t.code,
        t.name,
      ]);
      if (!type) return false;
      await intake.answer(turn.reportId, { incidentTypeId: type.id });
      return true;
    },
  },

  barangay: {
    ask: 'Which barangay is it in?',
    retry: "We couldn't find that barangay. Please check the spelling.",
    async answer(text, turn, { intake, barangays }) {
      const barangay = text ? await barangays.findByName(text) : null;
      if (!barangay) return false;
      await intake.answer(turn.reportId, { barangayId: barangay.id });
      return true;
    },
  },

  severity: {
    ask: 'How serious is it?',
    retry: 'Please pick one.',
    choices: () => Object.values(SEVERITY_LABELS),
    async answer(text, turn, { intake }) {
      const severity = parseSeverity(text);
      if (!severity) return false;
      await intake.answer(turn.reportId, { severity });
      return true;
    },
  },

  anyoneHurt: {
    ask: 'Is anyone hurt?',
    retry: 'Please pick one.',
    choices: () => Object.values(ANYONE_HURT_LABELS),
    async answer(text, turn, { intake }) {
      const anyoneHurt = parseAnyoneHurt(text);
      if (!anyoneHurt) return false;
      await intake.answer(turn.reportId, { anyoneHurt });
      return true;
    },
  },

  contactNumber: {
    ask: 'What number can responders call you on?',
    retry: 'Please send a mobile number like 09171234567.',
    async answer(text, turn, { intake }) {
      const parsed = contactNumberSchema.safeParse(text);
      if (!parsed.success) return false;
      await intake.saveContactNumber(turn.residentId, parsed.data);
      return true;
    },
  },
};

export type VictimStep = 'sex' | 'age' | 'condition' | 'another';

/**
 * The person chat is asking about, kept in thread state until their last
 * detail, when they're saved as a victim.
 */
export interface VictimDraft {
  reportId: string;
  step: VictimStep;
  /** Victims saved in this round of questions. */
  saved: number;
  sex: Sex | null;
  age: AgeRange | null;
}

export interface VictimQuestion {
  ask(draft: VictimDraft): string;
  /** Sent before `ask` when an answer doesn't fit. */
  retry: string;
  choices: string[];
  /**
   * The draft for the next question, null when there's no one else to ask
   * about, or undefined when the answer doesn't fit.
   */
  answer(
    text: string,
    draft: VictimDraft,
    deps: QuestionDeps,
  ): Promise<VictimDraft | null | undefined>;
}

/**
 * Conditions offered as taps; anything else can be typed. Each fits a
 * Messenger quick reply (20 characters).
 */
export const COMMON_CONDITIONS = [
  'Bleeding',
  "Can't breathe",
  'Unconscious',
  'Broken bone',
  'Burns',
  "Can't walk",
];

/** The parsed answer, null for "Don't know", or undefined if it doesn't fit. */
function orDontKnow<T>(
  text: string,
  parse: (text: string) => T | null,
): T | null | undefined {
  if (isDontKnow(text)) return null;
  return parse(text) ?? undefined;
}

/**
 * Questions about each person hurt, in order. Every one takes "Don't know".
 * Names are never asked for, and victims have no field for them (FR9).
 */
export const VICTIM_STEPS: Record<VictimStep, VictimQuestion> = {
  sex: {
    ask: ({ saved }) =>
      saved
        ? 'Is the next person male or female?'
        : "We'll ask a few quick questions about each person who's hurt. No names needed. Is the person male or female?",
    retry: 'Please tap one.',
    choices: [...Object.values(SEX_LABELS), DONT_KNOW],
    answer(text, draft) {
      const sex = orDontKnow(text, parseSex);
      return Promise.resolve(
        sex === undefined ? undefined : { ...draft, sex, step: 'age' },
      );
    },
  },

  age: {
    ask: () => 'About how old are they? Tap a group, or type an age like 45.',
    retry: "We couldn't read that age.",
    choices: [...Object.keys(AGE_GROUPS), DONT_KNOW],
    answer(text, draft) {
      const age = orDontKnow(text, parseAgeRange);
      return Promise.resolve(
        age === undefined ? undefined : { ...draft, age, step: 'condition' },
      );
    },
  },

  condition: {
    ask: () => 'How are they hurt? Tap one, or describe it.',
    retry: 'Please tell us in a few words.',
    choices: [...COMMON_CONDITIONS, DONT_KNOW],
    async answer(text, draft, { intake }) {
      if (!text) return undefined;
      const { reportId, sex, age, saved } = draft;
      await intake.addVictims(reportId, [
        {
          sex,
          ageMin: age?.min ?? null,
          ageMax: age?.max ?? null,
          medicalCondition: isDontKnow(text) ? null : text,
        },
      ]);
      return {
        reportId,
        step: 'another',
        saved: saved + 1,
        sex: null,
        age: null,
      };
    },
  },

  another: {
    ask: () => 'Thank you. Is anyone else hurt?',
    retry: 'Please tap Yes or No.',
    choices: [ANYONE_HURT_LABELS.yes, ANYONE_HURT_LABELS.no],
    answer(text, draft) {
      const answer = parseAnyoneHurt(text);
      if (!answer) return Promise.resolve(undefined);
      return Promise.resolve(
        answer === 'yes' ? { ...draft, step: 'sex' } : null,
      );
    },
  },
};

/** The first question about the people hurt in a report. */
export function firstVictimDraft(reportId: string): VictimDraft {
  return { reportId, step: 'sex', saved: 0, sex: null, age: null };
}
