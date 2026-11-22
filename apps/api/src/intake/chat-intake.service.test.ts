import type { IntakeField } from '@repo/shared';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { ChannelsService } from '../channels/channels.service.js';
import type { BarangayService } from '../geo/barangay.service.js';
import type { GeocodingService } from '../geo/geocoding.service.js';
import {
  ChatIntakeService,
  DONE_REPLY,
  FOLLOW_UP_REPLY,
  NEW_REPORT_CHOICE,
  type IntakeState,
  RECEIVED_REPLY,
} from './chat-intake.service.js';
import type { IntakeService } from './intake.service.js';
import {
  COMMON_CONDITIONS,
  firstVictimDraft,
  QUESTIONS,
  VICTIM_STEPS,
  type VictimDraft,
} from './questions.js';

vi.mock('../config/env.js', () => ({ env: {} }));

const ALL: IntakeField[] = [
  'incidentType',
  'barangay',
  'severity',
  'anyoneHurt',
  'victims',
  'contactNumber',
];

describe('ChatIntakeService', () => {
  const channels = { onMessage: vi.fn(), send: vi.fn() };
  const intake = {
    receiveMessage: vi.fn(),
    missingFields: vi.fn(),
    answer: vi.fn(),
    addVictims: vi.fn(),
    withVictimLock: vi.fn(),
    saveContactNumber: vi.fn(),
    incidentTypes: vi.fn(),
  };
  const barangays = { findByName: vi.fn() };
  const geocoding = { geocode: vi.fn() };
  const service = new ChatIntakeService(
    channels as unknown as ChannelsService,
    intake as unknown as IntakeService,
    barangays as unknown as BarangayService,
    geocoding as unknown as GeocodingService,
  );
  const recorded = { residentId: 'resident-1', messageId: 'msg-1' };
  const options = { reportId: 'report-1' };

  /** A Chat SDK thread holding `state`, which `setState` merges into. */
  const threadWith = (initial: IntakeState | null = null) => {
    let state = initial;
    return {
      get state() {
        return Promise.resolve(state);
      },
      setState: vi.fn((next: IntakeState) => {
        state = { ...state, ...next };
        return Promise.resolve();
      }),
    };
  };
  let thread = threadWith();

  /** Mid-questions about a person, at `draft.step`. */
  const asking = (draft: Partial<VictimDraft>) => {
    thread = threadWith({
      victim: { ...firstVictimDraft('report-1'), ...draft },
    });
    intake.receiveMessage.mockResolvedValue({
      reportId: 'report-1',
      created: false,
    });
  };

  /** The texts the bot sent, in order. */
  const sent = () => channels.send.mock.calls.map((call) => call[2] as string);

  /** Fields missing before the message, then after its answer is saved. */
  const followUp = (
    missing: IntakeField[],
    after: IntakeField[] = missing.slice(1),
  ) => {
    intake.receiveMessage.mockResolvedValue({
      reportId: 'report-1',
      created: false,
    });
    intake.missingFields
      .mockResolvedValueOnce(missing)
      .mockResolvedValueOnce(after);
  };

  beforeEach(() => {
    thread = threadWith();
    // Runs one locked call at a time, like the advisory lock.
    let held = Promise.resolve();
    intake.withVictimLock.mockImplementation(
      (_reportId: string, fn: () => Promise<unknown>) => {
        const run = held.then(fn);
        held = run.then(
          () => undefined,
          () => undefined,
        );
        return run;
      },
    );
    intake.incidentTypes.mockResolvedValue([
      { id: 'type-fire', code: 'fire', name: 'Fire' },
      { id: 'type-flood', code: 'flood', name: 'Flood' },
    ]);
  });

  afterEach(() => vi.resetAllMocks());

  it('handles every resident message', async () => {
    followUp([]);
    service.onModuleInit();
    const [handler] = channels.onMessage.mock.calls[0]!;
    await handler(
      { adapter: { name: 'messenger' } },
      { text: ' hi ' },
      recorded,
    );
    expect(intake.receiveMessage).toHaveBeenCalledWith({
      ...recorded,
      channel: 'messenger',
      newReport: false,
    });
  });

  it('acknowledges a new report and asks the first question', async () => {
    intake.receiveMessage.mockResolvedValue({
      reportId: 'report-1',
      created: true,
    });
    intake.missingFields.mockResolvedValue(ALL);

    await service.handle('messenger', recorded, 'may sunog', thread);

    expect(sent()).toEqual([RECEIVED_REPLY, QUESTIONS.incidentType.ask]);
    expect(channels.send).toHaveBeenLastCalledWith(
      'resident-1',
      'messenger',
      QUESTIONS.incidentType.ask,
      { ...options, choices: ['Fire', 'Flood'] },
    );
    expect(intake.answer).not.toHaveBeenCalled();
  });

  it('saves a valid answer and asks the next question', async () => {
    followUp(ALL);
    await service.handle('messenger', recorded, 'fire', thread);
    expect(intake.answer).toHaveBeenCalledWith('report-1', {
      incidentTypeId: 'type-fire',
    });
    expect(sent()).toEqual([QUESTIONS.barangay.ask]);
  });

  it('matches the barangay by name', async () => {
    followUp(['barangay', 'severity']);
    barangays.findByName.mockResolvedValue({ id: 'brgy-1' });
    await service.handle('messenger', recorded, 'Tacas', thread);
    expect(barangays.findByName).toHaveBeenCalledWith('Tacas');
    expect(intake.answer).toHaveBeenCalledWith('report-1', {
      barangayId: 'brgy-1',
    });
    expect(channels.send).toHaveBeenLastCalledWith(
      'resident-1',
      'messenger',
      QUESTIONS.severity.ask,
      { ...options, choices: ['Low', 'Moderate', 'High', 'Critical'] },
    );
  });

  it('geocodes a place that is not a barangay name', async () => {
    followUp(['barangay', 'severity']);
    barangays.findByName.mockResolvedValue(null);
    const point = { lng: 122.23, lat: 10.64 };
    geocoding.geocode.mockResolvedValue({ point, barangay: { id: 'brgy-1' } });
    await service.handle('messenger', recorded, 'Miagao Church', thread);
    expect(geocoding.geocode).toHaveBeenCalledWith('Miagao Church');
    expect(intake.answer).toHaveBeenCalledWith('report-1', {
      barangayId: 'brgy-1',
      locationText: 'Miagao Church',
      location: point,
    });
    expect(sent()).toEqual([QUESTIONS.severity.ask]);
  });

  it('asks again when the place is not found in Miagao', async () => {
    followUp(['barangay', 'severity']);
    barangays.findByName.mockResolvedValue(null);
    geocoding.geocode.mockResolvedValue(null);
    await service.handle('messenger', recorded, 'somewhere', thread);
    expect(intake.answer).not.toHaveBeenCalled();
    expect(sent()).toEqual([
      `${QUESTIONS.barangay.retry} ${QUESTIONS.barangay.ask}`,
    ]);
  });

  it('asks again when the answer does not fit', async () => {
    followUp(['severity', 'contactNumber']);
    await service.handle('messenger', recorded, 'very bad', thread);
    expect(intake.answer).not.toHaveBeenCalled();
    expect(sent()).toEqual([
      `${QUESTIONS.severity.retry} ${QUESTIONS.severity.ask}`,
    ]);
  });

  it('records whether anyone is hurt', async () => {
    followUp(['anyoneHurt', 'victims', 'contactNumber'], ['contactNumber']);
    await service.handle('messenger', recorded, 'wala', thread);
    expect(intake.answer).toHaveBeenCalledWith('report-1', {
      anyoneHurt: 'no',
    });
    expect(sent()).toEqual([QUESTIONS.contactNumber.ask]);
  });

  it('asks about each person when someone is hurt', async () => {
    followUp(['anyoneHurt', 'contactNumber'], ['victims', 'contactNumber']);
    await service.handle('messenger', recorded, 'Yes', thread);
    expect(intake.answer).toHaveBeenCalledWith('report-1', {
      anyoneHurt: 'yes',
    });
    const draft = firstVictimDraft('report-1');
    expect(thread.setState).toHaveBeenCalledWith({ victim: draft });
    expect(channels.send).toHaveBeenLastCalledWith(
      'resident-1',
      'messenger',
      VICTIM_STEPS.sex.ask(draft),
      { ...options, choices: ['Male', 'Female', "Don't know"] },
    );
  });

  it('keeps sex and age in the draft, and asks never for a name', async () => {
    asking({ step: 'sex' });
    await service.handle('messenger', recorded, 'Female', thread);
    asking({ step: 'age', sex: 'female' });
    await service.handle('messenger', recorded, '60s', thread);
    expect(thread.setState).toHaveBeenLastCalledWith({
      victim: {
        ...firstVictimDraft('report-1'),
        step: 'condition',
        sex: 'female',
        age: { min: 60, max: 69 },
      },
    });
    expect(intake.addVictims).not.toHaveBeenCalled();
    expect(sent()).toEqual([
      VICTIM_STEPS.age.ask(firstVictimDraft('report-1')),
      VICTIM_STEPS.condition.ask(firstVictimDraft('report-1')),
    ]);
    expect(sent().join(' ')).not.toMatch(/name\?/i);
  });

  it('saves the person after their condition and asks about others', async () => {
    asking({ step: 'condition', sex: 'female', age: { min: 60, max: null } });
    await service.handle('messenger', recorded, "can't breathe", thread);
    expect(intake.addVictims).toHaveBeenCalledWith('report-1', [
      {
        sex: 'female',
        ageMin: 60,
        ageMax: null,
        medicalCondition: "can't breathe",
      },
    ]);
    const next = { ...firstVictimDraft('report-1'), step: 'another', saved: 1 };
    expect(thread.setState).toHaveBeenCalledWith({ victim: next });
    expect(sent()).toEqual([VICTIM_STEPS.another.ask(next as VictimDraft)]);
  });

  it('offers common conditions as taps', async () => {
    asking({ step: 'age' });
    await service.handle('messenger', recorded, 'Adult', thread);
    expect(channels.send).toHaveBeenLastCalledWith(
      'resident-1',
      'messenger',
      VICTIM_STEPS.condition.ask(firstVictimDraft('report-1')),
      { ...options, choices: [...COMMON_CONDITIONS, "Don't know"] },
    );
  });

  it('takes "Don\'t know" for any detail', async () => {
    asking({ step: 'condition' });
    await service.handle('messenger', recorded, "Don't know", thread);
    expect(intake.addVictims).toHaveBeenCalledWith('report-1', [
      { sex: null, ageMin: null, ageMax: null, medicalCondition: null },
    ]);
  });

  it('saves a person once when their condition comes in two quick messages', async () => {
    asking({ step: 'condition', sex: 'male' });
    // The first save is slow, so the second message arrives during it.
    intake.addVictims.mockImplementation(
      () => new Promise((resolve) => setTimeout(resolve, 10)),
    );
    await Promise.all([
      service.handle('messenger', recorded, 'Bleeding', thread),
      service.handle('messenger', recorded, 'from his head', thread),
    ]);
    expect(intake.addVictims).toHaveBeenCalledExactlyOnceWith('report-1', [
      { sex: 'male', ageMin: null, ageMax: null, medicalCondition: 'Bleeding' },
    ]);
    expect(sent()).toEqual([
      VICTIM_STEPS.another.ask({ ...firstVictimDraft('report-1'), saved: 1 }),
    ]);
  });

  it('asks about the next person', async () => {
    asking({ step: 'another', saved: 1 });
    await service.handle('messenger', recorded, 'Yes', thread);
    expect(sent()).toEqual(['Is the next person male or female?']);
  });

  it('moves on when no one else is hurt', async () => {
    asking({ step: 'another', saved: 1 });
    intake.missingFields.mockResolvedValue(['contactNumber']);
    await service.handle('messenger', recorded, 'No', thread);
    expect(thread.setState).toHaveBeenCalledWith({ victim: null });
    expect(sent()).toEqual([QUESTIONS.contactNumber.ask]);
  });

  it('asks a person question again when the answer does not fit', async () => {
    asking({ step: 'age' });
    await service.handle('messenger', recorded, 'young', thread);
    expect(thread.setState).not.toHaveBeenCalled();
    expect(sent()).toEqual([
      `${VICTIM_STEPS.age.retry} ${VICTIM_STEPS.age.ask(firstVictimDraft('report-1'))}`,
    ]);
  });

  it('ignores a draft from another report', async () => {
    thread = threadWith({
      victim: { ...firstVictimDraft('report-0'), step: 'age' },
    });
    followUp(['severity', 'contactNumber']);
    await service.handle('messenger', recorded, 'High', thread);
    expect(intake.answer).toHaveBeenCalledWith('report-1', {
      severity: 'high',
    });
  });

  it('saves the contact number on the resident and thanks them', async () => {
    followUp(['contactNumber']);
    await service.handle('messenger', recorded, '+63 917 123 4567', thread);
    expect(intake.saveContactNumber).toHaveBeenCalledWith(
      'resident-1',
      '09171234567',
    );
    expect(sent()).toEqual([DONE_REPLY]);
    expect(channels.send).toHaveBeenLastCalledWith(
      'resident-1',
      'messenger',
      DONE_REPLY,
      { ...options, choices: [NEW_REPORT_CHOICE] },
    );
  });

  it('starts another report on request', async () => {
    intake.receiveMessage.mockResolvedValue({
      reportId: 'report-2',
      created: true,
    });
    intake.missingFields.mockResolvedValue(['incidentType']);

    await service.handle('messenger', recorded, 'new REPORT', thread);

    expect(intake.receiveMessage).toHaveBeenCalledWith(
      expect.objectContaining({ newReport: true }),
    );
    expect(sent()).toEqual([RECEIVED_REPLY, QUESTIONS.incidentType.ask]);
  });

  it('acknowledges messages added to a complete report', async () => {
    followUp([]);
    await service.handle('messenger', recorded, 'may naipit pa', thread);
    expect(intake.answer).not.toHaveBeenCalled();
    expect(channels.send).toHaveBeenCalledExactlyOnceWith(
      'resident-1',
      'messenger',
      FOLLOW_UP_REPLY,
      { ...options, choices: [NEW_REPORT_CHOICE] },
    );
  });
});
