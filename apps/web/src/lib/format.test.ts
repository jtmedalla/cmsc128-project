import { describe, expect, it } from 'vitest';
import { formatLocation } from './format';

describe('formatLocation', () => {
  it.each([
    ['Santillan Street', 'Mat-y', 'Santillan Street, Mat-y'],
    ['Baybay Sur', 'Baybay Sur', 'Baybay Sur'],
    ['Near the Tacas chapel', 'Tacas', 'Near the Tacas chapel'],
    [null, 'Tacas', 'Tacas'],
    ['Santillan Street', null, 'Santillan Street'],
    [null, undefined, null],
  ])('formats %s in %s as %s', (text, barangay, expected) => {
    expect(formatLocation(text, barangay)).toBe(expected);
  });
});
