import { describe, expect, it, vi } from 'vitest';
import type { Database } from '../database/client.js';
import { BroadcastsRepository } from './broadcasts.repository.js';

vi.mock('../config/env.js', () => ({ env: {} }));

const id = '0b9a3f4e-8c1d-4e2a-9f6b-1c2d3e4f5a6b';
const at = new Date('2026-10-29T08:30:00.000Z');

function serviceWith(rows: unknown[]) {
  const findMany = vi.fn().mockResolvedValue(rows);
  const db = {
    query: { broadcast: { findMany } },
  } as unknown as Database;
  return { service: new BroadcastsRepository(db), findMany };
}

describe('BroadcastsRepository.findRecentAdvisories', () => {
  it('returns sent advisory rows with their creator', async () => {
    const { service, findMany } = serviceWith([
      {
        id,
        kind: 'advisory',
        messageBody: 'Prepare for possible evacuation.',
        sentAt: at,
        creator: { id: 'responder-1', name: 'Maria Santos' },
      },
    ]);

    await expect(service.findRecentAdvisories()).resolves.toEqual([
      {
        id,
        kind: 'advisory',
        messageBody: 'Prepare for possible evacuation.',
        sentAt: at,
        createdBy: { id: 'responder-1', name: 'Maria Santos' },
      },
    ]);
    expect(findMany).toHaveBeenCalledOnce();
  });

  it('limits the query to five advisories and selects the public fields', async () => {
    const { service, findMany } = serviceWith([]);

    await service.findRecentAdvisories();

    const options = findMany.mock.calls[0]![0];
    expect(options.limit).toBe(5);
    expect(options.columns).toEqual({
      id: true,
      kind: true,
      messageBody: true,
      sentAt: true,
    });
    expect(options.with).toEqual({
      creator: { columns: { id: true, name: true } },
    });
    expect(options.where).toBeDefined();
    expect(options.orderBy).toBeTypeOf('function');
  });

  it('drops rows without a sent timestamp', async () => {
    const { service } = serviceWith([
      {
        id,
        kind: 'advisory',
        messageBody: 'Draft advisory.',
        sentAt: null,
        creator: { id: 'responder-1', name: 'Maria Santos' },
      },
    ]);

    await expect(service.findRecentAdvisories()).resolves.toEqual([]);
  });

  it('returns an empty list when no advisories exist', async () => {
    const { service } = serviceWith([]);

    await expect(service.findRecentAdvisories()).resolves.toEqual([]);
  });
});
