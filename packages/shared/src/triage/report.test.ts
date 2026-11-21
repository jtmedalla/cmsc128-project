import { describe, expect, it } from 'vitest';
import { reportDetailSchema, reportFeedItemSchema } from './report.js';

const residentId = '0b9a3f4e-8c1d-4e2a-9f6b-1c2d3e4f5a6b';

describe('reportFeedItemSchema', () => {
  it('round-trips dates through the wire', () => {
    const item = reportFeedItemSchema.decode({
      id: residentId,
      status: 'pending',
      isProxy: false,
      incidentType: null,
      severity: null,
      barangay: null,
      locationText: null,
      location: null,
      incidentAt: null,
      sourceChannel: 'web',
      parsedAutomatically: false,
      parseConfidence: null,
      resident: { id: residentId, name: null },
      victimCount: 0,
      firstMessage: null,
      createdAt: '2026-10-29T08:30:00.000Z',
      updatedAt: '2026-10-29T08:30:00.000Z',
    });
    expect(item.createdAt).toBeInstanceOf(Date);
    expect(reportFeedItemSchema.encode(item).createdAt).toBe(
      '2026-10-29T08:30:00.000Z',
    );
  });

  it('allows a report with no resident', () => {
    const item = reportFeedItemSchema.decode({
      id: residentId,
      status: 'pending',
      isProxy: false,
      incidentType: null,
      severity: null,
      barangay: null,
      locationText: null,
      location: null,
      incidentAt: null,
      sourceChannel: 'dashboard',
      parsedAutomatically: false,
      parseConfidence: null,
      resident: null,
      victimCount: 0,
      firstMessage: null,
      createdAt: '2026-10-29T08:30:00.000Z',
      updatedAt: '2026-10-29T08:30:00.000Z',
    });
    expect(item.resident).toBeNull();
  });
});

describe('reportDetailSchema', () => {
  it('decodes message dates and keeps the contact number', () => {
    const detail = reportDetailSchema.decode({
      id: residentId,
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
      resident: { id: residentId, name: null, contactNumber: '09171234567' },
      victims: [
        {
          id: residentId,
          sex: 'female',
          ageMin: 60,
          ageMax: null,
          medicalCondition: null,
        },
      ],
      messages: [
        {
          id: residentId,
          direction: 'inbound',
          senderId: null,
          body: 'tulong',
          attachments: null,
          createdAt: '2026-10-29T08:30:00.000Z',
        },
      ],
      createdAt: '2026-10-29T08:30:00.000Z',
      updatedAt: '2026-10-29T08:30:00.000Z',
    });
    expect(detail.resident?.contactNumber).toBe('09171234567');
    expect(detail.messages[0]!.createdAt).toBeInstanceOf(Date);
  });
});
