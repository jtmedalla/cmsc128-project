import { describe, expect, it } from 'vitest';
import { agencyCreateSchema } from './agency.js';

const valid = { name: 'BFP', contactNumber: '(033) 315-8000', isPublic: true };

describe('agencyCreateSchema', () => {
  it.each(['(033) 315-8000', '09171234567', '+63 917 123 4567', '911'])(
    'accepts the number %j',
    (contactNumber) => {
      expect(
        agencyCreateSchema.safeParse({ ...valid, contactNumber }).success,
      ).toBe(true);
    },
  );

  it.each(['call us', '', '()-'])('rejects the number %j', (contactNumber) => {
    expect(
      agencyCreateSchema.safeParse({ ...valid, contactNumber }).success,
    ).toBe(false);
  });

  it('requires a number for a public agency only', () => {
    const noNumber = { ...valid, contactNumber: null };
    expect(agencyCreateSchema.safeParse(noNumber).success).toBe(false);
    expect(
      agencyCreateSchema.safeParse({ ...noNumber, isPublic: false }).success,
    ).toBe(true);
  });
});
