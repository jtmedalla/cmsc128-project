import type { ReportFeedItem } from '@repo/shared';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { RealtimeService } from '../realtime/realtime.service.js';
import type { ReportsService } from '../triage/reports.service.js';
import { IntakeService } from './intake.service.js';
import type { IntakeRepository } from './intake.repository.js';

vi.mock('../config/env.js', () => ({ env: {} }));

/** Intake's data access; transactions run the callback on `tx`. */
const tx = {};
const repository = {
  transaction: vi.fn((run: (t: typeof tx) => unknown) => run(tx)),
  lock: vi.fn(),
  insertReport: vi.fn(),
  findOpenReport: vi.fn(),
  linkMessage: vi.fn(),
};
const asRepository = repository as unknown as IntakeRepository;

/** Triage's feed lookup, which intake calls to push new reports. */
const reports = { findFeedItem: vi.fn() };
const asReports = reports as unknown as ReportsService;

const id = '0b9a3f4e-8c1d-4e2a-9f6b-1c2d3e4f5a6b';
const createdAt = new Date('2026-10-29T08:30:00.000Z');
const item: ReportFeedItem = {
  id,
  status: 'pending',
  isProxy: false,
  incidentType: null,
  severity: null,
  barangay: null,
  locationText: null,
  location: null,
  incidentAt: null,
  sourceChannel: 'messenger',
  parsedAutomatically: false,
  parseConfidence: null,
  resident: { id, name: null },
  creator: null,
  victimCount: 0,
  firstMessage: null,
  createdAt,
  updatedAt: createdAt,
};

describe('IntakeService.createReport', () => {
  it('saves the report and pushes it to the feed', async () => {
    repository.insertReport.mockResolvedValue({ id, trackingToken: 'tok' });
    reports.findFeedItem.mockResolvedValue(item);
    const realtime = { toDashboard: vi.fn() };
    const intake = new IntakeService(
      asRepository,
      realtime as unknown as RealtimeService,
      asReports,
    );

    const input = { residentId: id, sourceChannel: 'messenger' } as const;
    await expect(intake.createReport(input)).resolves.toEqual({
      id,
      trackingToken: 'tok',
    });
    expect(repository.insertReport).toHaveBeenCalledWith(input);
    expect(realtime.toDashboard).toHaveBeenCalledWith('report:created', {
      ...item,
      createdAt: createdAt.toISOString(),
      updatedAt: createdAt.toISOString(),
    });
  });
});

describe('IntakeService.receiveMessage', () => {
  const realtime = { toDashboard: vi.fn() };
  const intake = new IntakeService(
    asRepository,
    realtime as unknown as RealtimeService,
    asReports,
  );
  const input = {
    residentId: id,
    messageId: 'a1b2c3d4-0000-4000-8000-000000000001',
    channel: 'messenger',
  } as const;

  afterEach(() => vi.clearAllMocks());

  it('starts a pending report from the first message', async () => {
    repository.findOpenReport.mockResolvedValue(null);
    repository.insertReport.mockResolvedValue({ id, trackingToken: 'tok' });
    reports.findFeedItem.mockResolvedValue(item);

    await expect(intake.receiveMessage(input)).resolves.toEqual({
      reportId: id,
      created: true,
    });
    expect(repository.lock).toHaveBeenCalledWith(`intake:${id}`, tx);
    expect(repository.insertReport).toHaveBeenCalledWith(
      {
        residentId: id,
        sourceChannel: 'messenger',
        messageIds: [input.messageId],
      },
      tx,
    );
    expect(realtime.toDashboard).toHaveBeenCalledWith(
      'report:created',
      expect.objectContaining({ id }),
    );
  });

  it('files later messages under the open report', async () => {
    repository.findOpenReport.mockResolvedValue(id);

    await expect(intake.receiveMessage(input)).resolves.toEqual({
      reportId: id,
      created: false,
    });
    expect(repository.findOpenReport).toHaveBeenCalledWith(id, 'messenger', tx);
    expect(repository.linkMessage).toHaveBeenCalledWith(
      input.messageId,
      id,
      tx,
    );
    expect(repository.insertReport).not.toHaveBeenCalled();
    expect(realtime.toDashboard).not.toHaveBeenCalled();
  });

  it('starts a new report on request despite an open one', async () => {
    repository.findOpenReport.mockResolvedValue(id);
    repository.insertReport.mockResolvedValue({ id, trackingToken: 'tok' });
    reports.findFeedItem.mockResolvedValue(item);

    await expect(
      intake.receiveMessage({ ...input, newReport: true }),
    ).resolves.toEqual({ reportId: id, created: true });
    expect(repository.findOpenReport).not.toHaveBeenCalled();
    expect(repository.linkMessage).not.toHaveBeenCalled();
    expect(repository.insertReport).toHaveBeenCalledOnce();
  });
});
