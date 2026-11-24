import { describe, expect, it } from 'vitest';
import { incidentTypeCode } from './incident-type.js';

describe('incidentTypeCode', () => {
  it.each([
    ['Fire', 'fire'],
    ['Storm surge', 'storm_surge'],
    ['  Vehicular Accident! ', 'vehicular_accident'],
    ['Tsunami/Seiche', 'tsunami_seiche'],
    ['Pagbaha ñ', 'pagbaha_n'],
    ['!!!', ''],
  ])('turns %j into %j', (name, code) => {
    expect(incidentTypeCode(name)).toBe(code);
  });
});
