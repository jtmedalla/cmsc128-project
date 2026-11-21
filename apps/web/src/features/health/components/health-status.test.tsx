import type { Health } from '@repo/shared';
import { screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { renderWithProviders, respondWith } from '@/testing/render';
import { HealthStatusCard } from './health-status';

const health: Health = {
  status: 'ok',
  checks: { database: 'ok' },
  uptime: 3_720,
  checkedAt: '2026-11-20T00:00:00.000Z',
};

describe('HealthStatusCard', () => {
  it('shows each check when healthy', async () => {
    respondWith(200, health);
    renderWithProviders(<HealthStatusCard />);
    expect(await screen.findByText('1h 2m')).toBeDefined();
    expect(screen.getAllByText('Operational')).toHaveLength(2);
  });

  it('shows the failed check on a 503', async () => {
    respondWith(503, {
      ...health,
      status: 'error',
      checks: { database: 'error' },
    });
    renderWithProviders(<HealthStatusCard />);
    expect(await screen.findByText('Down')).toBeDefined();
  });

  it('shows the API as unreachable when the request fails', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('fetch')));
    renderWithProviders(<HealthStatusCard />);
    expect(await screen.findByText('Unreachable')).toBeDefined();
  });
});
