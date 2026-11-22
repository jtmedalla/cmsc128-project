import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { renderWithProviders, respondWith } from '@/testing/render';
import { IncidentsWorkspace } from './incidents-workspace';

const id = '0b9a3f4e-8c1d-4e2a-9f6b-1c2d3e4f5a6b';
const at = '2026-10-29T08:30:00.000Z';

// One feed item as the API sends it.
const item = {
  id,
  status: 'pending',
  isProxy: false,
  incidentType: { id, code: 'flood', name: 'Flood' },
  severity: 'moderate',
  barangay: { id, name: 'Tacas' },
  locationText: null,
  location: null,
  incidentAt: null,
  sourceChannel: 'messenger',
  parsedAutomatically: false,
  parseConfidence: null,
  resident: { id, name: 'Andrian' },
  creator: null,
  victimCount: 0,
  firstMessage: 'Gataas na baha diri',
  createdAt: at,
  updatedAt: at,
};

describe('IncidentsWorkspace', () => {
  it('lists reports as cards that open the quick view on the same route', async () => {
    respondWith(200, [item]);
    renderWithProviders(<IncidentsWorkspace />, {
      path: '/dashboard/incidents',
    });
    expect(await screen.findByText('Gataas na baha diri')).toBeDefined();
    expect(screen.getByText('Andrian')).toBeDefined();
    expect(screen.getByText('Tacas')).toBeDefined();
    expect(
      screen.getByRole('link', { name: /Flood/ }).getAttribute('href'),
    ).toBe(`/dashboard/incidents?report=${id}`);
  });

  it('prompts to select a report before one is chosen', async () => {
    respondWith(200, [item]);
    renderWithProviders(<IncidentsWorkspace />, {
      path: '/dashboard/incidents',
    });
    expect(
      await screen.findByText('Select a report to see its details'),
    ).toBeDefined();
  });

  it('offers a retry when the list fails', async () => {
    respondWith(500, {});
    renderWithProviders(<IncidentsWorkspace />, {
      path: '/dashboard/incidents',
    });
    expect(
      await screen.findByRole('button', { name: 'Try again' }),
    ).toBeDefined();
  });
});
