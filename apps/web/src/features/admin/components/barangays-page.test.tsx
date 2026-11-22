import type { Barangay } from '@repo/shared';
import { fireEvent, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { renderWithProviders, respondWith } from '@/testing/render';
import { BarangaysPage } from './barangays-page';

type Feature = { properties: { name: string } };

// MapLibre needs WebGL; draw each barangay as a button instead.
vi.mock('@/components/map', () => ({
  Map: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));
vi.mock('@/components/ui/map', () => ({
  MapControls: () => null,
  MapGeoJSON: ({
    data,
    onClick,
  }: {
    data: { features: Feature[] };
    onClick: (event: { feature: Feature }) => void;
  }) =>
    data.features.map((feature) => (
      <button
        key={feature.properties.name}
        onClick={() => onClick({ feature })}
      >
        Map: {feature.properties.name}
      </button>
    )),
}));

const tacas: Barangay = {
  id: '3b241101-e2bb-4255-8caf-4136c566a962',
  name: 'Tacas',
  centroid: { lng: 122.23, lat: 10.64 },
  boundary: {
    type: 'MultiPolygon',
    coordinates: [
      [
        [
          [122.2, 10.6],
          [122.3, 10.6],
          [122.3, 10.7],
          [122.2, 10.6],
        ],
      ],
    ],
  },
  isCoastal: true,
  isUpland: false,
  hazards: ['flood'],
};

describe('BarangaysPage', () => {
  it('shows each barangay with its flags and hazards', async () => {
    respondWith(200, [tacas]);
    renderWithProviders(<BarangaysPage />);
    const coastal = await screen.findByLabelText('Tacas is coastal');
    expect(coastal.getAttribute('aria-checked')).toBe('true');
    expect(
      screen.getByLabelText('Tacas is upland').getAttribute('aria-checked'),
    ).toBe('false');
    expect(
      screen
        .getByRole('button', { name: 'Flood' })
        .getAttribute('aria-pressed'),
    ).toBe('true');
  });

  it('saves a toggled hazard and shows the result', async () => {
    const updated = { ...tacas, hazards: ['flood', 'storm_surge'] };
    const fetch = vi
      .fn()
      .mockResolvedValueOnce(new Response(JSON.stringify([tacas])))
      .mockResolvedValueOnce(new Response(JSON.stringify(updated)));
    vi.stubGlobal('fetch', fetch);
    renderWithProviders(<BarangaysPage />);

    fireEvent.click(await screen.findByRole('button', { name: 'Storm surge' }));

    await waitFor(() =>
      expect(
        screen
          .getByRole('button', { name: 'Storm surge' })
          .getAttribute('aria-pressed'),
      ).toBe('true'),
    );
    const [, init] = fetch.mock.calls[1]!;
    expect(JSON.parse(init.body)).toEqual({
      isCoastal: true,
      isUpland: false,
      hazards: ['flood', 'storm_surge'],
    });
  });

  it('filters the table to a barangay clicked on the map', async () => {
    const banga = {
      ...tacas,
      id: '9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d',
      name: 'Banga',
    };
    respondWith(200, [banga, tacas]);
    renderWithProviders(<BarangaysPage />);

    fireEvent.click(await screen.findByRole('button', { name: 'Map: Tacas' }));

    expect(screen.getByPlaceholderText('Filter barangays...')).toHaveProperty(
      'value',
      'Tacas',
    );
    expect(screen.queryByLabelText('Banga is coastal')).toBeNull();
    expect(screen.getByLabelText('Tacas is coastal')).toBeDefined();
  });

  it('offers a retry when loading fails', async () => {
    respondWith(500);
    renderWithProviders(<BarangaysPage />);
    expect(
      await screen.findByRole('button', { name: 'Try again' }),
    ).toBeDefined();
  });
});
