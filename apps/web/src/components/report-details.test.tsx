import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, render, screen } from '@testing-library/react';
import {
  createMemoryHistory,
  createRootRoute,
  createRouter,
  RouterProvider,
} from '@tanstack/react-router';
import { afterEach, describe, expect, it, vi } from 'vitest';
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
  victims: [{ id, sex: 'female', age: 78, medicalCondition: 'Asthma' }],
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

function respondWith(status: number, body?: unknown) {
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue(new Response(JSON.stringify(body), { status })),
  );
}

function renderDetails() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  const router = createRouter({
    routeTree: createRootRoute({
      component: () => <ReportDetails reportId={id} />,
    }),
    history: createMemoryHistory(),
  });
  render(
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  );
}

afterEach(() => {
  // Unmount each test's page so queries don't match earlier renders.
  cleanup();
  vi.unstubAllGlobals();
});

describe('ReportDetails', () => {
  it('shows the report, contact number and messages', async () => {
    respondWith(200, wire);
    renderDetails();
    expect(await screen.findByText('Flood')).toBeDefined();
    expect(
      screen.getByRole('link', { name: '09171234567' }).getAttribute('href'),
    ).toBe('tel:09171234567');
    expect(screen.getByText('Baha diri')).toBeDefined();
    expect(screen.getByText('Female · 78 years old · Asthma')).toBeDefined();
  });

  it('sends the session cookie', async () => {
    respondWith(200, wire);
    renderDetails();
    await screen.findByText('Flood');
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining(`/triage/reports/${id}`),
      { credentials: 'include' },
    );
  });

  it('says so when the report does not exist', async () => {
    respondWith(404, { message: 'Report not found' });
    renderDetails();
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
    renderDetails();
    expect(await screen.findByText('Shared a location')).toBeDefined();
    expect(screen.getByText(/^MIGO ·/)).toBeDefined();
    expect(screen.getByText(/^Responder ·/)).toBeDefined();
  });

  it('shows "Not given" for an empty field', async () => {
    respondWith(200, {
      ...wire,
      resident: { id, name: '', contactNumber: '09171234567' },
    });
    renderDetails();
    await screen.findByText('Flood');
    expect(screen.getByText('Reported By').nextSibling?.textContent).toBe(
      'Not given',
    );
  });

  // Read-only for now: the box is there so the layout matches the wireframe.
  it('shows the message box disabled', async () => {
    respondWith(200, wire);
    renderDetails();
    await screen.findByText('Flood');
    expect(
      screen.getByRole('textbox', { name: 'Message' }).hasAttribute('disabled'),
    ).toBe(true);
  });

  // Wireframe "map-section" slot, crossed out until the real map exists.
  it('shows the crossed-out map slot', async () => {
    respondWith(200, wire);
    renderDetails();
    await screen.findByText('Flood');
    expect(
      screen.getByRole('img', { name: 'Map not available yet' }),
    ).toBeDefined();
  });

  it('offers a retry when the API fails', async () => {
    respondWith(500, {});
    renderDetails();
    expect(
      await screen.findByRole('button', { name: 'Try again' }),
    ).toBeDefined();
  });
});
