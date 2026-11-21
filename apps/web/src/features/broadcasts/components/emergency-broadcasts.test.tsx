import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { EmergencyBroadcasts } from './emergency-broadcasts';

afterEach(cleanup);

function renderWorkspace() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  queryClient.setQueryData(
    ['broadcasts', 'advisories', 'recent'],
    [
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
    ],
  );

  return render(
    <QueryClientProvider client={queryClient}>
      <EmergencyBroadcasts />
    </QueryClientProvider>,
  );
}

describe('EmergencyBroadcasts', () => {
  it('renders the broadcast workspace and recent advisories', () => {
    renderWorkspace();

    expect(screen.getByText('Target Area')).toBeDefined();
    expect(screen.getByText('Compose Advisory')).toBeDefined();
    expect(screen.getByText('Recent Advisories')).toBeDefined();
    expect(
      screen.getAllByRole('heading', { name: 'Emergency Advisory' }),
    ).toHaveLength(2);
    expect(screen.getByText(/Residents in high-risk zones/)).toBeDefined();
  });

  it('filters recent advisories', () => {
    renderWorkspace();

    fireEvent.change(screen.getByLabelText('Filter recent advisories'), {
      target: { value: 'Road monitoring' },
    });

    expect(screen.getByText(/Road monitoring in progress/)).toBeDefined();
    expect(screen.queryByText(/Residents in high-risk zones/)).toBeNull();
  });

  it('applies a quick template to the title', () => {
    renderWorkspace();

    fireEvent.click(
      screen.getByRole('button', {
        name: 'Immediate Evacuation Order',
      }),
    );

    const titleInput = screen.getByLabelText('Title') as HTMLInputElement;
    expect(titleInput.value).toBe('Immediate Evacuation Order');
  });

  it('starts with all residents selected', () => {
    renderWorkspace();

    const checkbox = screen.getByRole('checkbox', {
      name: 'All residents (no selection)',
    });

    expect(checkbox.getAttribute('aria-checked')).toBe('true');
  });
});
