import type { Health } from '@repo/shared';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { HealthStatusCard } from './health-status';

function renderCard() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  render(
    <QueryClientProvider client={client}>
      <HealthStatusCard />
    </QueryClientProvider>,
  );
}

function mockHealth(body: Health, status = 200) {
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue(new Response(JSON.stringify(body), { status })),
  );
}

const health: Health = {
  status: 'ok',
  checks: { database: 'ok' },
  uptime: 3_720,
  checkedAt: '2026-11-20T00:00:00.000Z',
};

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe('HealthStatusCard', () => {
  it('shows each check when healthy', async () => {
    mockHealth(health);
    renderCard();
    expect(await screen.findByText('1h 2m')).toBeDefined();
    expect(screen.getAllByText('Operational')).toHaveLength(2);
  });

  it('shows the failed check on a 503', async () => {
    mockHealth(
      { ...health, status: 'error', checks: { database: 'error' } },
      503,
    );
    renderCard();
    expect(await screen.findByText('Down')).toBeDefined();
  });

  it('shows the API as unreachable when the request fails', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('fetch')));
    renderCard();
    expect(await screen.findByText('Unreachable')).toBeDefined();
  });
});
