import { describe, expect, it } from 'vitest';
import {
  contactNumberSchema,
  matchChoice,
  isDontKnow,
  parseSeverity,
  parseSex,
} from './intake.js';

describe('matchChoice', () => {
  const types = [
    { code: 'fire', name: 'Fire' },
    { code: 'flood', name: 'Flood' },
  ];
  const namesOf = ({ code, name }: (typeof types)[number]) => [code, name];

  it('matches any name, ignoring case and spaces', () => {
    expect(matchChoice(' FLOOD ', types, namesOf)).toBe(types[1]);
  });

  it('returns null without a match', () => {
    expect(matchChoice('quake', types, namesOf)).toBeNull();
  });
});

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

describe('isDontKnow', () => {
  it.each(["Don't know", 'dont know', 'Ambot.'])('accepts %s', (input) => {
    expect(isDontKnow(input)).toBe(true);
  });

  it('rejects other answers', () => {
    expect(isDontKnow('no')).toBe(false);
  });
});

describe('parseSex', () => {
  it.each([
    ['Female', 'female'],
    ['babayi', 'female'],
    ['M', 'male'],
    ['lalaki', 'male'],
  ] as const)('reads %s as %s', (input, expected) => {
    expect(parseSex(input)).toBe(expected);
  });

  it('rejects anything else', () => {
    expect(parseSex('two of them')).toBeNull();
  });
});
