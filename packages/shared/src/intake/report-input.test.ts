import { describe, expect, it } from 'vitest';
import {
  confidenceOf,
  type ParsedReport,
  parsedReportSchema,
} from './parsed.js';
import { reportInputSchema } from './report-input.js';

const residentId = '0b9a3f4e-8c1d-4e2a-9f6b-1c2d3e4f5a6b';

describe('confidenceOf', () => {
  it('keeps each field confidence', () => {
    const parsed: ParsedReport = {
      incidentType: { value: 'fire', confidence: 0.9 },
      severity: { value: null, confidence: 0.2 },
      barangay: { value: 'Tacas', confidence: 0.8 },
      locationText: { value: null, confidence: 0 },
      incidentAt: { value: null, confidence: 0 },
      isProxy: { value: true, confidence: 0.7 },
      victims: {
        value: [{ sex: 'female', ageMin: 80, ageMax: 80 }],
        confidence: 0.6,
      },
    };
    expect(confidenceOf(parsed)).toEqual({
      incidentType: 0.9,
      severity: 0.2,
      barangay: 0.8,
      locationText: 0,
      incidentAt: 0,
      isProxy: 0.7,
      victims: 0.6,
    });
  });
});

describe('parsedReportSchema', () => {
  it('drops victim names the classifier returns', () => {
    const none = { value: null, confidence: 0 };
    const { victims } = parsedReportSchema.parse({
      incidentType: none,
      severity: none,
      barangay: none,
      locationText: none,
      incidentAt: none,
      isProxy: none,
      victims: {
        value: [{ name: 'Juan dela Cruz', ageMin: 40, ageMax: 40 }],
        confidence: 1,
      },
    });
    expect(victims.value).toEqual([{ ageMin: 40, ageMax: 40 }]);
  });
});

describe('reportInputSchema', () => {
  it('defaults a bare report to an unparsed one', () => {
    expect(
      reportInputSchema.parse({ residentId, sourceChannel: 'messenger' }),
    ).toEqual({
      residentId,
      sourceChannel: 'messenger',
      isProxy: false,
      victims: [],
      messageIds: [],
      parsedAutomatically: false,
    });
  });

  it('has no place for victim names', () => {
    const { victims } = reportInputSchema.parse({
      residentId,
      sourceChannel: 'web',
      victims: [{ name: 'Juan dela Cruz', ageMin: 40, ageMax: 40 }],
    });
    expect(victims).toEqual([{ ageMin: 40, ageMax: 40 }]);
  });

  it('rejects a victim age range that ends before it starts', () => {
    expect(
      reportInputSchema.safeParse({
        residentId,
        sourceChannel: 'web',
        victims: [{ ageMin: 60, ageMax: 40 }],
      }).success,
    ).toBe(false);
  });
});
