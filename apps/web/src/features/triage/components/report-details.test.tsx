import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { renderWithProviders, respondWith } from '@/testing/render';
import { ReportDetails } from './report-details';

const id = '0b9a3f4e-8c1d-4e2a-9f6b-1c2d3e4f5a6b';
const at = '2026-10-29T08:30:00.000Z';

const wire = {
  id,
  status: 'validated',
  isProxy: false,
  incidentType: { id, code: 'flood', name: 'Flood' },
  severity: 'high',
  barangay: { id, name: 'Tacas' },
  locationText: 'Near the chapel',
  location: null,
  incidentAt: at,
  sourceChannel: 'messenger',
  parsedAutomatically: true,
  parseConfidence: { incidentType: 0.9 },
  resident: { id, name: 'Pedro Cruz', contactNumber: '09171234567' },
  victims: [
    { id, sex: 'female', ageMin: 60, ageMax: null, medicalCondition: 'Asthma' },
  ],
  messages: [
    {
      id,
      direction: 'inbound',
      senderId: null,
      body: 'Baha diri',
      attachments: null,
      createdAt: at,
    },
  ],
  createdAt: at,
  updatedAt: at,
};

describe('ReportDetails', () => {
  it('shows the report, contact number and messages', async () => {
    respondWith(200, wire);
    renderWithProviders(<ReportDetails reportId={id} />);
    expect(await screen.findByText('Flood')).toBeDefined();
    expect(
      screen.getByRole('link', { name: '09171234567' }).getAttribute('href'),
    ).toBe('tel:09171234567');
    expect(screen.getByText('Baha diri')).toBeDefined();
    expect(screen.getByText('Female · 60+ years old · Asthma')).toBeDefined();
  });

  it('says so when the report does not exist', async () => {
    respondWith(404, { message: 'Report not found' });
    renderWithProviders(<ReportDetails reportId={id} />);
    expect(await screen.findByText("This report doesn't exist.")).toBeDefined();
  });

  // Labels follow message.sender_id and message.attachments (docs/database.md).
  it('labels senders and location shares', async () => {
    const outbound = {
      direction: 'outbound',
      attachments: null,
      createdAt: at,
    };
    respondWith(200, {
      ...wire,
      messages: [
        { ...outbound, id, senderId: null, body: 'Salamat' },
        {
          ...outbound,
          id: crypto.randomUUID(),
          senderId: 'u1',
          body: 'Padulong na kami',
        },
        {
          id: crypto.randomUUID(),
          direction: 'inbound',
          senderId: null,
          body: null,
          attachments: [{ type: 'location', lat: 10.6, lng: 122.2 }],
          createdAt: at,
        },
      ],
    });
    renderWithProviders(<ReportDetails reportId={id} />);
    expect(await screen.findByText('Shared a location')).toBeDefined();
    expect(screen.getByText(/^MIGO ·/)).toBeDefined();
    expect(screen.getByText(/^Responder ·/)).toBeDefined();
  });

  it('shows "Not given" for an empty field', async () => {
    respondWith(200, {
      ...wire,
      resident: { id, name: '', contactNumber: '09171234567' },
    });
    renderWithProviders(<ReportDetails reportId={id} />);
    await screen.findByText('Flood');
    expect(screen.getByText('Reported By').nextSibling?.textContent).toBe(
      'Not given',
    );
  });

  it('offers a retry when the API fails', async () => {
    respondWith(500, {});
    renderWithProviders(<ReportDetails reportId={id} />);
    expect(
      await screen.findByRole('button', { name: 'Try again' }),
    ).toBeDefined();
  });
});
