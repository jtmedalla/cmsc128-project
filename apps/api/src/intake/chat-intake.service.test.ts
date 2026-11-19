import type { IntakeField } from '@repo/shared';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { ChannelsService } from '../channels/channels.service.js';
import type { BarangayService } from '../geo/barangay.service.js';
import {
  ChatIntakeService,
  DONE_REPLY,
  FOLLOW_UP_REPLY,
  NEW_REPORT_CHOICE,
  RECEIVED_REPLY,
} from './chat-intake.service.js';
import type { IntakeService } from './intake.service.js';
import { QUESTIONS } from './questions.js';

vi.mock('../config/env.js', () => ({ env: {} }));

const ALL: IntakeField[] = [
  'incidentType',
  'barangay',
  'severity',
  'contactNumber',
];

describe('ChatIntakeService', () => {
  const channels = { onMessage: vi.fn(), send: vi.fn() };
  const intake = {
    receiveMessage: vi.fn(),
    missingFields: vi.fn(),
    answer: vi.fn(),
    saveContactNumber: vi.fn(),
    incidentTypes: vi.fn(),
  };
  const barangays = { findByName: vi.fn() };
  const service = new ChatIntakeService(
    channels as unknown as ChannelsService,
    intake as unknown as IntakeService,
    barangays as unknown as BarangayService,
  );
  const recorded = { residentId: 'resident-1', messageId: 'msg-1' };
  const options = { reportId: 'report-1' };

  /** The texts the bot sent, in order. */
  const sent = () => channels.send.mock.calls.map((call) => call[2] as string);

  const followUp = (missing: IntakeField[]) => {
    intake.receiveMessage.mockResolvedValue({
      reportId: 'report-1',
      created: false,
    });
    intake.missingFields.mockResolvedValue(missing);
  };

  beforeEach(() => {
    intake.incidentTypes.mockResolvedValue([
      { id: 'type-fire', code: 'fire', name: 'Fire' },
      { id: 'type-flood', code: 'flood', name: 'Flood' },
    ]);
  });

  afterEach(() => vi.clearAllMocks());

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

    await service.handle('messenger', recorded, 'may sunog');

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
    await service.handle('messenger', recorded, 'fire');
    expect(intake.answer).toHaveBeenCalledWith('report-1', {
      incidentTypeId: 'type-fire',
    });
    expect(sent()).toEqual([QUESTIONS.barangay.ask]);
  });

  it('matches the barangay by name', async () => {
    followUp(['barangay', 'severity']);
    barangays.findByName.mockResolvedValue({ id: 'brgy-1' });
    await service.handle('messenger', recorded, 'Tacas');
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

  it('asks again when the answer does not fit', async () => {
    followUp(['severity', 'contactNumber']);
    await service.handle('messenger', recorded, 'very bad');
    expect(intake.answer).not.toHaveBeenCalled();
    expect(sent()).toEqual([
      `${QUESTIONS.severity.retry} ${QUESTIONS.severity.ask}`,
    ]);
  });

  it('saves the contact number on the resident and thanks them', async () => {
    followUp(['contactNumber']);
    await service.handle('messenger', recorded, '+63 917 123 4567');
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

    await service.handle('messenger', recorded, 'new REPORT');

    expect(intake.receiveMessage).toHaveBeenCalledWith(
      expect.objectContaining({ newReport: true }),
    );
    expect(sent()).toEqual([RECEIVED_REPLY, QUESTIONS.incidentType.ask]);
  });

  it('acknowledges messages added to a complete report', async () => {
    followUp([]);
    await service.handle('messenger', recorded, 'may naipit pa');
    expect(intake.answer).not.toHaveBeenCalled();
    expect(channels.send).toHaveBeenCalledExactlyOnceWith(
      'resident-1',
      'messenger',
      FOLLOW_UP_REPLY,
      { ...options, choices: [NEW_REPORT_CHOICE] },
    );
  });
});
