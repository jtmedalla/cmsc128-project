import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
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
  victimCount: 1,
  victims: [{ id, sex: 'female', age: 78, medicalCondition: 'Asthma' }],
  messages: [{ id, direction: 'inbound', body: 'Baha diri', createdAt: at }],
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
  vi.unstubAllGlobals();
});

describe('ReportDetails', () => {
  it('shows the report, contact number and messages', async () => {
    respondWith(200, wire);
    renderDetails();
    expect(await screen.findByRole('heading', { name: 'Flood' })).toBeDefined();
    expect(
      screen.getByRole('link', { name: '09171234567' }).getAttribute('href'),
    ).toBe('tel:09171234567');
    expect(screen.getByText('Baha diri')).toBeDefined();
    expect(screen.getByText('Female · 78 years old · Asthma')).toBeDefined();
  });

  it('sends the session cookie', async () => {
    respondWith(200, wire);
    renderDetails();
    await screen.findByRole('heading', { name: 'Flood' });
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

  it('offers a retry when the API fails', async () => {
    respondWith(500, {});
    renderDetails();
    expect(
      await screen.findByRole('button', { name: 'Try again' }),
    ).toBeDefined();
  });
});
