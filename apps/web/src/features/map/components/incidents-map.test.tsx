import { fireEvent, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { renderWithProviders, respondWith } from '@/testing/render';
import { IncidentsMap } from './incidents-map';

/* A fake map: each marker renders its longitude, and the camera records flights. */
const { flyTo } = vi.hoisted(() => ({ flyTo: vi.fn() }));
vi.mock('@/components/map', () => ({
  Map: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));
vi.mock('@/components/ui/map', () => ({
  MapMarker: ({ longitude }: { longitude: number }) => (
    <span data-testid="pin" data-lng={longitude} />
  ),
  MarkerContent: () => null,
  MarkerPopup: () => null,
  MapControls: () => null,
  useMap: () => ({ map: { flyTo }, isLoaded: true }),
}));

const DAY = 24 * 60 * 60 * 1000;
let nextId = 0;

/* One API report; open, recent and located by default. */
function item(overrides: {
  lng?: number;
  located?: boolean;
  status?: string;
  severity?: string | null;
  daysAgo?: number;
}) {
  const id = `0b9a3f4e-8c1d-4e2a-9f6b-${String(nextId++).padStart(12, '0')}`;
  const at = new Date(
    Date.now() - (overrides.daysAgo ?? 0) * DAY,
  ).toISOString();
  return {
    id,
    status: overrides.status ?? 'pending',
    isProxy: false,
    incidentType: null,
    severity: overrides.severity ?? null,
    barangay: null,
    locationText: null,
    location:
      overrides.located === false
        ? null
        : { lng: overrides.lng ?? 122.2, lat: 10.6 },
    incidentAt: null,
    sourceChannel: 'messenger',
    parsedAutomatically: false,
    parseConfidence: null,
    resident: { id, name: 'Andrian' },
    victimCount: 0,
    firstMessage: null,
    createdAt: at,
    updatedAt: at,
  };
}

/* Waits until the map holds `expected` pins, then returns their sorted longitudes. */
async function pinsAfter(expected: number) {
  await waitFor(() =>
    expect(screen.queryAllByTestId('pin')).toHaveLength(expected),
  );
  return screen
    .getAllByTestId('pin')
    .map((pin) => Number(pin.dataset.lng))
    .sort();
}

afterEach(() => {
  flyTo.mockClear();
});

describe('IncidentsMap', () => {
  /* Only the report with a location gets a pin. */
  it('pins each report that has a location', async () => {
    respondWith(200, [item({ lng: 122.1 }), item({ located: false })]);
    renderWithProviders(<IncidentsMap />);

    expect(await pinsAfter(1)).toEqual([122.1]);
  });

  /* Defaults: open reports from the last 7 days. */
  it('starts with open reports from the last 7 days', async () => {
    respondWith(200, [
      item({ lng: 122.1, status: 'dispatched' }),
      item({ lng: 122.2, status: 'resolved' }),
      item({ lng: 122.3, daysAgo: 8 }),
    ]);
    renderWithProviders(<IncidentsMap />);

    expect(await pinsAfter(1)).toEqual([122.1]);
  });

  /* Picking a severity shows only its reports. */
  it('filters by severity', async () => {
    respondWith(200, [
      item({ lng: 122.1, severity: 'high' }),
      item({ lng: 122.2, severity: 'low' }),
    ]);
    renderWithProviders(<IncidentsMap />);
    await pinsAfter(2);

    /* Base UI needs pointerdown before click to select an option. */
    fireEvent.click(screen.getByRole('combobox', { name: 'Severity' }));
    const low = await screen.findByRole('option', { name: 'Low' });
    fireEvent.pointerDown(low);
    fireEvent.click(low);
    expect(await pinsAfter(1)).toEqual([122.2]);
  });

  /* A location link opens the map on its report, even one the default filters hide. */
  it('centers on the linked report and keeps its pin', async () => {
    const old = item({ lng: 122.3, status: 'resolved', daysAgo: 30 });
    respondWith(200, [item({ lng: 122.1 }), old]);
    renderWithProviders(<IncidentsMap focusId={old.id} />);

    expect(await pinsAfter(2)).toEqual([122.1, 122.3]);
    expect(flyTo).toHaveBeenCalledWith(
      expect.objectContaining({ center: [122.3, 10.6] }),
    );
  });

  /* A failed load shows the error and no pins. */
  it('offers a retry when the reports fail to load', async () => {
    respondWith(500);
    renderWithProviders(<IncidentsMap />);

    expect((await screen.findByRole('alert')).textContent).toContain(
      "Couldn't load reports",
    );
    expect(screen.queryAllByTestId('pin')).toHaveLength(0);
  });
});
