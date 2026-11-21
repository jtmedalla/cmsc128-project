import { QueryClient } from '@tanstack/react-query';
import { fireEvent, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { renderWithProviders } from '@/testing/render';
import { broadcastQueries } from '../queries';
import { EmergencyBroadcasts } from './emergency-broadcasts';

function renderWorkspace() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  queryClient.setQueryData(broadcastQueries.recentAdvisories().queryKey, [
    {
      id: '0b9a3f4e-8c1d-4e2a-9f6b-1c2d3e4f5a6b',
      kind: 'advisory',
      messageBody:
        'Residents in high-risk zones are advised to prepare for possible evacuation.',
      sentAt: new Date('2026-09-03T06:09:00.000Z'),
      createdBy: { id: 'responder-1', name: 'Another Lloyd Magana' },
    },
    {
      id: '1b9a3f4e-8c1d-4e2a-9f6b-1c2d3e4f5a6b',
      kind: 'advisory',
      messageBody:
        'Road monitoring in progress. Expect rerouting along main thoroughfares.',
      sentAt: new Date('2026-04-04T04:58:00.000Z'),
      createdBy: { id: 'responder-2', name: 'Response team assigned' },
    },
  ]);

  return renderWithProviders(<EmergencyBroadcasts />, { queryClient });
}

describe('EmergencyBroadcasts', () => {
  it('lists recent advisories', async () => {
    renderWorkspace();

    expect(
      await screen.findAllByRole('heading', { name: 'Emergency Advisory' }),
    ).toHaveLength(2);
    expect(screen.getByText(/Residents in high-risk zones/)).toBeDefined();
  });

  it('filters recent advisories', async () => {
    renderWorkspace();
    await screen.findByText(/Residents in high-risk zones/);

    fireEvent.change(screen.getByLabelText('Filter recent advisories'), {
      target: { value: 'Road monitoring' },
    });

    expect(screen.getByText(/Road monitoring in progress/)).toBeDefined();
    expect(screen.queryByText(/Residents in high-risk zones/)).toBeNull();
  });

  it('applies a quick template to the title', async () => {
    renderWorkspace();
    await screen.findByText(/Residents in high-risk zones/);

    fireEvent.click(
      screen.getByRole('button', {
        name: 'Immediate Evacuation Order',
      }),
    );

    const titleInput = screen.getByLabelText('Title') as HTMLInputElement;
    expect(titleInput.value).toBe('Immediate Evacuation Order');
  });
});
