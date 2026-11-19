import { describe, expect, it, vi } from 'vitest';
import type { Database } from '../database/client.js';
import { ReportsService } from './reports.service.js';

// The DB module reads env at import; the test never connects.
vi.mock('../config/env.js', () => ({ env: {} }));

const id = '0b9a3f4e-8c1d-4e2a-9f6b-1c2d3e4f5a6b';
const at = new Date('2026-10-29T08:30:00.000Z');

// A report row as Drizzle returns it, before the service checks the jsonb columns.
function row(parseConfidence: unknown, attachments: unknown) {
  return {
    id,
    status: 'pending',
    parseConfidence,
    victims: [],
    messages: [
      {
        id,
        direction: 'inbound',
        senderId: null,
        body: null,
        attachments,
        createdAt: at,
      },
    ],
  };
}

// Stand-in for the Drizzle client: findFirst resolves to the given row.
function serviceWith(found: unknown) {
  const db = {
    query: { report: { findFirst: vi.fn().mockResolvedValue(found) } },
  } as unknown as Database;
  return new ReportsService(db);
}

describe('ReportsService.findDetail', () => {
  it('keeps well-formed jsonb columns', async () => {
    const detail = await serviceWith(
      row({ incidentType: 0.9 }, [{ type: 'location', lat: 10.6, lng: 122.2 }]),
    ).findDetail(id);
    expect(detail?.parseConfidence).toEqual({ incidentType: 0.9 });
    expect(detail?.messages[0]!.attachments).toEqual([{ type: 'location' }]);
  });

  it('falls back to null when jsonb has an unexpected shape', async () => {
    const detail = await serviceWith(
      row({ incidentType: 'high' }, 'not-an-array'),
    ).findDetail(id);
    expect(detail?.parseConfidence).toBeNull();
    expect(detail?.messages[0]!.attachments).toBeNull();
  });

  it('returns null when the report does not exist', async () => {
    expect(await serviceWith(undefined).findDetail(id)).toBeNull();
  });
});
