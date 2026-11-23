import { describe, expect, it } from 'vitest';
import { agencyDetailsSchema, agencyUpdateSchema } from './agency.js';

const bfp = {
  name: 'BFP',
  contactNumber: '(033) 315-8000',
  isPublic: true,
  isActive: true,
};

describe('agencyDetailsSchema', () => {
  it.each(['(033) 315-8000', '09171234567', '+63 917 123 4567', '911'])(
    'accepts the number %j',
    (contactNumber) => {
      expect(
        agencyDetailsSchema.safeParse({ ...bfp, contactNumber }).success,
      ).toBe(true);
    },
  );

  it.each(['call us', '', '()-'])('rejects the number %j', (contactNumber) => {
    expect(
      agencyDetailsSchema.safeParse({ ...bfp, contactNumber }).success,
    ).toBe(false);
  });
});

describe('agencyUpdateSchema', () => {
  it('requires a number for a public agency only', () => {
    const noNumber = { ...bfp, contactNumber: null };
    expect(agencyUpdateSchema.safeParse(noNumber).success).toBe(false);
    expect(
      agencyUpdateSchema.safeParse({ ...noNumber, isPublic: false }).success,
    ).toBe(true);
  });
});
