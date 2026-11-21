import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, render, screen } from '@testing-library/react';
import {
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  RouterProvider,
} from '@tanstack/react-router';
import { afterEach, describe, expect, it, vi } from 'vitest';
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
  victimCount: 0,
  firstMessage: 'Gataas na baha diri',
  createdAt: at,
  updatedAt: at,
};

function respondWith(status: number, body?: unknown) {
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue(new Response(JSON.stringify(body), { status })),
  );
}

// The workspace at /dashboard/incidents with nothing selected.
function renderWorkspace() {
  const root = createRootRoute();
  const incidents = createRoute({
    getParentRoute: () => root,
    path: '/dashboard/incidents',
    component: () => <IncidentsWorkspace />,
  });
  const router = createRouter({
    routeTree: root.addChildren([incidents]),
    history: createMemoryHistory({ initialEntries: ['/dashboard/incidents'] }),
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

describe('IncidentsWorkspace', () => {
  it('lists reports as cards that open the quick view on the same route', async () => {
    respondWith(200, [item]);
    renderWorkspace();
    expect(await screen.findByText('Gataas na baha diri')).toBeDefined();
    expect(screen.getByText('Reported by: Andrian')).toBeDefined();
    expect(screen.getByText('Location: Tacas')).toBeDefined();
    expect(
      screen.getByRole('link', { name: /Flood/ }).getAttribute('href'),
    ).toBe(`/dashboard/incidents?report=${id}`);
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/triage/reports'),
      expect.objectContaining({ credentials: 'include' }),
    );
  });

  it('prompts to select a report before one is chosen', async () => {
    respondWith(200, [item]);
    renderWorkspace();
    expect(
      await screen.findByText('Select a report to see its details'),
    ).toBeDefined();
    // Wireframe's empty chat text before a report is clicked.
    expect(screen.getByText('No messages yet')).toBeDefined();
    expect(
      screen.getByText('Start a conversation by typing below'),
    ).toBeDefined();
  });

  // Agreed: shown so the layout matches the wireframe, but not usable yet.
  it('shows Table, Kanban and Sort disabled', async () => {
    respondWith(200, [item]);
    renderWorkspace();
    await screen.findByText('Gataas na baha diri');
    const disabled = /data-disabled|aria-disabled="true"|disabled=""/;
    expect(screen.getByRole('tab', { name: 'Reports' }).outerHTML).not.toMatch(
      disabled,
    );
    for (const name of ['Table', 'Kanban']) {
      expect(screen.getByRole('tab', { name }).outerHTML).toMatch(disabled);
    }
    expect(
      screen.getByRole('button', { name: 'Sort' }).hasAttribute('disabled'),
    ).toBe(true);
  });

  it('offers a retry when the list fails', async () => {
    respondWith(500, {});
    renderWorkspace();
    expect(
      await screen.findByRole('button', { name: 'Try again' }),
    ).toBeDefined();
  });
});
