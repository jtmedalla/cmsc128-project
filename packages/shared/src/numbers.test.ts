import { describe, expect, it } from 'vitest';
import { spellOutNumbers } from './numbers.js';

describe('spellOutNumbers', () => {
  it.each([
    ['eighteen', '18'],
    ['twenty-one', '21'],
    ['sixty five pataas', '65 pataas'],
    ['one hundred and five', '105'],
    ['a hundred', 'a 100'],
    ['disiotso', '18'],
    ['disi-otso', '18'],
    ['bentiuno', '21'],
    ["kwarenta'y singko", '45'],
    ['labinlima', '15'],
    ['labing isa', '11'],
    ["dalawampu't isa", '21'],
    ['isang taon', '1 taon'],
    ['duha ka pulo kag lima', '25'],
    ['sixties', '60s'],
    ['twenty-thirty', '20-30'],
    ['between twenty and thirty', 'between 20 and 30'],
    ['eighteen y/o', '18 y/o'],
    ['no numbers here', 'no numbers here'],
  ])('reads %s as %s', (input, expected) => {
    expect(spellOutNumbers(input)).toBe(expected);
  });
});
