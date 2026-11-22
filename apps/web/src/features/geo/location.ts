import type { GeoPoint } from '@repo/shared';

/** A place as typed, pinned and placed in a barangay; any part may be unknown. */
export interface LocationValue {
  text: string;
  point: GeoPoint | null;
  barangayId: string | null;
}

export const emptyLocation: LocationValue = {
  text: '',
  point: null,
  barangayId: null,
};
