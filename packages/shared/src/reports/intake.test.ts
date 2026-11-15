import { describe, expect, it } from 'vitest';
import { contactNumberSchema, parseSeverity } from './intake.js';

describe('parseSeverity', () => {
  it('matches values and labels in any case', () => {
    expect(parseSeverity('high')).toBe('high');
    expect(parseSeverity(' Moderate ')).toBe('moderate');
    expect(parseSeverity('CRITICAL')).toBe('critical');
  });

  it('rejects anything else', () => {
    expect(parseSeverity('very bad')).toBeNull();
  });
});

describe('contactNumberSchema', () => {
  it.each(['09171234567', '0917 123 4567', '+63 917-123-4567', '639171234567'])(
    'normalizes %s',
    (input) => {
      expect(contactNumberSchema.parse(input)).toBe('09171234567');
    },
  );

  it.each(['12345', '0817123456', 'call me'])('rejects %s', (input) => {
    expect(contactNumberSchema.safeParse(input).success).toBe(false);
  });
});
