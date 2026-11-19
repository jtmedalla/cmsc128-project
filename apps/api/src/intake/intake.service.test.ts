import type { ReportFeedItem } from '@repo/shared';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { Database } from '../database/client.js';
import type { RealtimeService } from '../realtime/realtime.service.js';
import { IntakeService } from './intake.service.js';
import { findFeedItem } from '../triage/feed.js';
import { findOpenReport, insertReport, linkMessage } from './reports.js';

vi.mock('../config/env.js', () => ({ env: {} }));
vi.mock('./reports.js', () => ({
  insertReport: vi.fn(),
  findOpenReport: vi.fn(),
  linkMessage: vi.fn(),
}));
vi.mock('../triage/feed.js', () => ({ findFeedItem: vi.fn() }));

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
  victimCount: 0,
  firstMessage: null,
  createdAt,
  updatedAt: createdAt,
};

describe('IntakeService.createReport', () => {
  it('saves the report and pushes it to the feed', async () => {
    vi.mocked(insertReport).mockResolvedValue({ id, trackingToken: 'tok' });
    vi.mocked(findFeedItem).mockResolvedValue(item);
    const realtime = { toDashboard: vi.fn() };
    const intake = new IntakeService(
      {} as Database,
      realtime as unknown as RealtimeService,
    );

    const input = { residentId: id, sourceChannel: 'messenger' } as const;
    await expect(intake.createReport(input)).resolves.toEqual({
      id,
      trackingToken: 'tok',
    });
    expect(insertReport).toHaveBeenCalledWith({}, input);
    expect(realtime.toDashboard).toHaveBeenCalledWith('report:created', {
      ...item,
      createdAt: createdAt.toISOString(),
      updatedAt: createdAt.toISOString(),
    });
  });
});

describe('IntakeService.receiveMessage', () => {
  const tx = { execute: vi.fn() };
  const db = {
    transaction: (run: (t: typeof tx) => unknown) => run(tx),
  } as unknown as Database;
  const realtime = { toDashboard: vi.fn() };
  const intake = new IntakeService(db, realtime as unknown as RealtimeService);
  const input = {
    residentId: id,
    messageId: 'a1b2c3d4-0000-4000-8000-000000000001',
    channel: 'messenger',
  } as const;

  afterEach(() => vi.clearAllMocks());

  it('starts a pending report from the first message', async () => {
    vi.mocked(findOpenReport).mockResolvedValue(null);
    vi.mocked(insertReport).mockResolvedValue({ id, trackingToken: 'tok' });
    vi.mocked(findFeedItem).mockResolvedValue(item);

    await expect(intake.receiveMessage(input)).resolves.toEqual({
      reportId: id,
      created: true,
    });
    expect(tx.execute).toHaveBeenCalledOnce();
    expect(insertReport).toHaveBeenCalledWith(tx, {
      residentId: id,
      sourceChannel: 'messenger',
      messageIds: [input.messageId],
    });
    expect(realtime.toDashboard).toHaveBeenCalledWith(
      'report:created',
      expect.objectContaining({ id }),
    );
  });

  it('files later messages under the open report', async () => {
    vi.mocked(findOpenReport).mockResolvedValue(id);

    await expect(intake.receiveMessage(input)).resolves.toEqual({
      reportId: id,
      created: false,
    });
    expect(findOpenReport).toHaveBeenCalledWith(tx, id, 'messenger');
    expect(linkMessage).toHaveBeenCalledWith(tx, input.messageId, id);
    expect(insertReport).not.toHaveBeenCalled();
    expect(realtime.toDashboard).not.toHaveBeenCalled();
  });

  it('starts a new report on request despite an open one', async () => {
    vi.mocked(findOpenReport).mockResolvedValue(id);
    vi.mocked(insertReport).mockResolvedValue({ id, trackingToken: 'tok' });
    vi.mocked(findFeedItem).mockResolvedValue(item);

    await expect(
      intake.receiveMessage({ ...input, newReport: true }),
    ).resolves.toEqual({ reportId: id, created: true });
    expect(findOpenReport).not.toHaveBeenCalled();
    expect(linkMessage).not.toHaveBeenCalled();
    expect(insertReport).toHaveBeenCalledOnce();
  });
});
