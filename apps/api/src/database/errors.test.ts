import { describe, expect, it } from 'vitest';
import { isUniqueViolation } from './errors.js';

describe('isUniqueViolation', () => {
  it.each([
    [{ code: '23505' }, true],
    [{ message: 'query failed', cause: { code: '23505' } }, true],
    [{ cause: { code: '23503' } }, false],
    [new Error('boom'), false],
    [null, false],
  ])('reads %j as %s', (error, expected) => {
    expect(isUniqueViolation(error)).toBe(expected);
  });
});
