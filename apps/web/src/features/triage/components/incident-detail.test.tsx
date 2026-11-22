import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { renderWithProviders, respondWith } from '@/testing/render';
import { IncidentDetail } from './incident-detail';

const id = '0b9a3f4e-8c1d-4e2a-9f6b-1c2d3e4f5a6b';
const at = '2026-10-29T08:30:00.000Z';

// One report as GET /triage/reports/:id sends it.
const wire = {
  id,
  status: 'validated',
  isProxy: true,
  incidentType: { id, code: 'flood', name: 'Flood' },
  severity: 'high',
  barangay: { id, name: 'Mat-y' },
  locationText: 'Santillan Street, near the bridge',
  location: null,
  incidentAt: at,
  sourceChannel: 'messenger',
  parsedAutomatically: true,
  parseConfidence: null,
  resident: { id, name: 'Juan Dela Cruz', contactNumber: '09171234567' },
  victims: [
    {
      id,
      sex: 'female',
      ageMin: 72,
      ageMax: 72,
      medicalCondition: 'Cannot walk, needs evacuation',
    },
  ],
  messages: [
    {
      id,
      direction: 'inbound',
      senderId: null,
      body: 'Gataas na baha diri',
      attachments: null,
      createdAt: at,
    },
  ],
  createdAt: at,
  updatedAt: at,
};

describe('IncidentDetail', () => {
  it('shows the title, details, victims and messages', async () => {
    respondWith(200, wire);
    renderWithProviders(<IncidentDetail reportId={id} />);
    expect(
      await screen.findByRole('heading', { name: 'Flood · Mat-y' }),
    ).toBeDefined();
    expect(screen.getByText('#0b9a3f4e')).toBeDefined();
    expect(
      screen
        .getByRole('link', { name: 'Santillan Street, near the bridge, Mat-y' })
        .getAttribute('href'),
    ).toBe(`/dashboard/map?report=${id}`);
    expect(screen.getByRole('link', { name: 'Juan Dela Cruz' })).toBeDefined();
    expect(screen.getByText('(for someone else)')).toBeDefined();
    expect(
      screen.getByRole('link', { name: '09171234567' }).getAttribute('href'),
    ).toBe('tel:09171234567');
    expect(
      screen.getByRole('cell', { name: 'Cannot walk, needs evacuation' }),
    ).toBeDefined();
    expect(screen.getByRole('cell', { name: '72 years old' })).toBeDefined();
    expect(screen.getByText('Gataas na baha diri')).toBeDefined();
  });

  it('says so when the report does not exist', async () => {
    respondWith(404, { message: 'Report not found' });
    renderWithProviders(<IncidentDetail reportId={id} />);
    expect(await screen.findByText("This report doesn't exist.")).toBeDefined();
  });

  it('offers a retry when the API fails', async () => {
    respondWith(500, {});
    renderWithProviders(<IncidentDetail reportId={id} />);
    expect(
      await screen.findByRole('button', { name: 'Try again' }),
    ).toBeDefined();
  });
});
