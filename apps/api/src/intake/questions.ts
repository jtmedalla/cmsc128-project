import {
  ANYONE_HURT_LABELS,
  contactNumberSchema,
  type IntakeField,
  matchChoice,
  parseAnyoneHurt,
  parseSeverity,
  SEVERITY_LABELS,
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

/** What chat asks for each intake field, and how it reads the answer. */
export const QUESTIONS: Record<IntakeField, Question> = {
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
