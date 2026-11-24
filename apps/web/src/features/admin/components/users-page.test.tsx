import type { Account } from '@repo/shared';
import { QueryClient } from '@tanstack/react-query';
import { fireEvent, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { authQueries } from '@/features/auth';
import { renderWithProviders, respondWith } from '@/testing/render';
import { UsersPage } from './users-page';

type Encoded = Omit<Account, 'createdAt'> & { createdAt: string };

const me: Encoded = {
  id: 'admin-1',
  name: 'Ada Admin',
  email: 'ada@example.com',
  role: 'admin',
  active: true,
  createdAt: '2026-11-01T08:00:00.000Z',
};
const ana: Encoded = {
  id: 'u1',
  name: 'Ana Responder',
  email: 'ana@example.com',
  role: 'responder',
  active: true,
  createdAt: '2026-11-02T08:00:00.000Z',
};

/** Renders the page signed in as `me`. */
function render() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  queryClient.setQueryData(authQueries.session().queryKey, {
    user: { id: me.id },
  } as never);
  return renderWithProviders(<UsersPage />, { queryClient });
}

describe('UsersPage', () => {
  it('lists accounts with their roles and locks your own', async () => {
    respondWith(200, [me, ana]);
    render();
    expect(await screen.findByText('ana@example.com')).toBeTruthy();
    expect(screen.getByLabelText("Ana Responder's role").textContent).toContain(
      'Responder',
    );
    expect(screen.getByText('You')).toBeTruthy();
    expect(
      screen
        .getByLabelText('Ada Admin is active')
        .hasAttribute('data-disabled'),
    ).toBe(true);
    expect(
      screen
        .getByLabelText('Ana Responder is active')
        .hasAttribute('data-disabled'),
    ).toBe(false);
  });

  it('deactivates a user after confirming', async () => {
    respondWith(200, [me, ana]);
    render();
    fireEvent.click(await screen.findByLabelText('Ana Responder is active'));

    const fetch = vi
      .fn()
      .mockResolvedValue(
        new Response(JSON.stringify({ ...ana, active: false }), {
          status: 200,
        }),
      );
    vi.stubGlobal('fetch', fetch);
    fireEvent.click(await screen.findByRole('button', { name: 'Deactivate' }));

    await waitFor(() => expect(screen.getByText('Deactivated')).toBeTruthy());
    const [url, init] = fetch.mock.calls[0]!;
    expect(url).toMatch(/\/admin\/users\/u1$/);
    expect(JSON.parse(init.body)).toEqual({ active: false });
  });

  it('offers a retry when users fail to load', async () => {
    respondWith(500);
    render();
    expect(await screen.findByRole('alert')).toBeTruthy();
  });
});
