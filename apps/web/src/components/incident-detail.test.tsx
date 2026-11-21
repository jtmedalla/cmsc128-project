import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, render, screen } from '@testing-library/react';
import {
  createMemoryHistory,
  createRootRoute,
  createRouter,
  RouterProvider,
} from '@tanstack/react-router';
import { afterEach, describe, expect, it, vi } from 'vitest';
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
      age: 72,
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

function respondWith(status: number, body?: unknown) {
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue(new Response(JSON.stringify(body), { status })),
  );
}

function renderPage() {
  const router = createRouter({
    routeTree: createRootRoute({
      component: () => <IncidentDetail reportId={id} />,
    }),
    history: createMemoryHistory(),
  });
  render(
    <QueryClientProvider
      client={
        new QueryClient({ defaultOptions: { queries: { retry: false } } })
      }
    >
      <RouterProvider router={router} />
    </QueryClientProvider>,
  );
}

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe('IncidentDetail', () => {
  it('shows the title, details, victims and messages', async () => {
    respondWith(200, wire);
    renderPage();
    expect(
      await screen.findByRole('heading', { name: 'Flood · Mat-y' }),
    ).toBeDefined();
    expect(screen.getByText('Report 0b9a3f4e')).toBeDefined();
    expect(screen.getByText('Santillan Street, near the bridge')).toBeDefined();
    expect(screen.getByText('Juan Dela Cruz (for someone else)')).toBeDefined();
    expect(
      screen.getByRole('link', { name: '09171234567' }).getAttribute('href'),
    ).toBe('tel:09171234567');
    expect(
      screen.getByRole('cell', { name: 'Cannot walk, needs evacuation' }),
    ).toBeDefined();
    expect(screen.getByText('Gataas na baha diri')).toBeDefined();
  });

  it('links the breadcrumb back to the incidents feed', async () => {
    respondWith(200, wire);
    renderPage();
    await screen.findByRole('heading', { name: 'Flood · Mat-y' });
    expect(
      screen.getByRole('link', { name: 'Incidents' }).getAttribute('href'),
    ).toBe('/dashboard/incidents');
  });

  // Owned by #39, #12 and #63; shown so the layout is in place.
  it('shows the actions that other issues own disabled', async () => {
    respondWith(200, wire);
    renderPage();
    await screen.findByRole('heading', { name: 'Flood · Mat-y' });
    for (const name of [
      'Mark invalid',
      'Mark dispatched',
      'Edit details',
      'Send',
      'Log referral',
    ]) {
      expect(
        screen.getByRole('button', { name }).hasAttribute('disabled'),
      ).toBe(true);
    }
    expect(
      screen.getByRole('textbox', { name: 'Reply' }).hasAttribute('disabled'),
    ).toBe(true);
  });

  it('says so when the report does not exist', async () => {
    respondWith(404, { message: 'Report not found' });
    renderPage();
    expect(await screen.findByText("This report doesn't exist.")).toBeDefined();
  });

  it('offers a retry when the API fails', async () => {
    respondWith(500, {});
    renderPage();
    expect(
      await screen.findByRole('button', { name: 'Try again' }),
    ).toBeDefined();
  });
});
