import { describe, expect, it } from 'vitest';
import { formatLocation, toTelHref } from './format';

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

describe('toTelHref', () => {
  it.each([
    ['(033) 000-0101', 'tel:0330000101'],
    ['911', 'tel:911'],
    ['+63 917 123 4567', 'tel:+639171234567'],
    [' 0917-123-4567 ', 'tel:09171234567'],
  ])('dials %s as %s', (number, expected) => {
    expect(toTelHref(number)).toBe(expected);
  });
});
