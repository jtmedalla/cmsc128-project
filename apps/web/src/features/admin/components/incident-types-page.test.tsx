import type { IncidentType } from '@repo/shared';
import { fireEvent, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { renderWithProviders, respondWith } from '@/testing/render';
import { IncidentTypesPage } from './incident-types-page';

const fire: IncidentType = {
  id: '3b241101-e2bb-4255-8caf-4136c566a962',
  code: 'fire',
  name: 'Fire',
  isActive: true,
};
const flood: IncidentType = {
  id: '9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d',
  code: 'flood',
  name: 'Flood',
  isActive: false,
};

const json = (body: unknown, status = 200) =>
  Promise.resolve(new Response(JSON.stringify(body), { status }));

/** Answers the list with `rows()` and each write with `write`. */
function stubApi(rows: () => IncidentType[], write: () => Promise<Response>) {
  const fetch = vi.fn((_url: string, init?: RequestInit) =>
    init?.method && init.method !== 'GET' ? write() : json(rows()),
  );
  vi.stubGlobal('fetch', fetch);
  return fetch;
}

const writes = (fetch: ReturnType<typeof stubApi>) =>
  fetch.mock.calls
    .filter(([, init]) => init?.method && init.method !== 'GET')
    .map(([url, init]) => ({
      url,
      method: init!.method,
      body: JSON.parse(init!.body as string),
    }));

describe('IncidentTypesPage', () => {
  it('lists active and retired types', async () => {
    respondWith(200, [fire, flood]);
    renderWithProviders(<IncidentTypesPage />);
    const active = await screen.findByLabelText('Fire is active');
    expect(active.getAttribute('aria-checked')).toBe('true');
    expect(
      screen.getByLabelText('Flood is active').getAttribute('aria-checked'),
    ).toBe('false');
  });

  it('retires a type', async () => {
    let rows = [fire];
    const fetch = stubApi(
      () => rows,
      () => {
        rows = [{ ...fire, isActive: false }];
        return json(rows[0]);
      },
    );
    renderWithProviders(<IncidentTypesPage />);

    fireEvent.click(await screen.findByLabelText('Fire is active'));

    await waitFor(() =>
      expect(
        screen.getByLabelText('Fire is active').getAttribute('aria-checked'),
      ).toBe('false'),
    );
    expect(writes(fetch)).toEqual([
      {
        url: expect.stringMatching(/\/admin\/incident-types\/3b24.+$/),
        method: 'PATCH',
        body: { isActive: false },
      },
    ]);
  });

  it('adds a type and shows it', async () => {
    const medical = {
      ...fire,
      id: crypto.randomUUID(),
      code: 'medical',
      name: 'Medical',
    };
    let rows = [fire];
    const fetch = stubApi(
      () => rows,
      () => {
        rows = [fire, medical];
        return json(medical, 201);
      },
    );
    renderWithProviders(<IncidentTypesPage />);

    fireEvent.click(await screen.findByRole('button', { name: 'Add type' }));
    fireEvent.change(screen.getByLabelText('Name'), {
      target: { value: 'Medical' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Add' }));

    expect(await screen.findByLabelText('Medical is active')).toBeDefined();
    expect(writes(fetch)).toEqual([
      {
        url: expect.stringMatching(/\/admin\/incident-types$/),
        method: 'POST',
        body: { name: 'Medical' },
      },
    ]);
  });

  it('says when a new name is taken', async () => {
    stubApi(
      () => [fire],
      () => json({ statusCode: 409 }, 409),
    );
    renderWithProviders(<IncidentTypesPage />);

    fireEvent.click(await screen.findByRole('button', { name: 'Add type' }));
    fireEvent.change(screen.getByLabelText('Name'), {
      target: { value: 'fire' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Add' }));

    expect(
      await screen.findByText(
        'An incident type with this name already exists.',
      ),
    ).toBeDefined();
  });

  it('renames a type', async () => {
    let rows = [fire];
    const fetch = stubApi(
      () => rows,
      () => {
        rows = [{ ...fire, name: 'Structural fire' }];
        return json(rows[0]);
      },
    );
    renderWithProviders(<IncidentTypesPage />);

    fireEvent.click(await screen.findByRole('button', { name: 'Rename Fire' }));
    fireEvent.change(screen.getByLabelText('Name'), {
      target: { value: 'Structural fire' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Rename' }));

    await waitFor(() =>
      expect(screen.getByLabelText('Structural fire is active')).toBeDefined(),
    );
    expect(writes(fetch)[0]!.body).toEqual({ name: 'Structural fire' });
  });

  it('offers a retry when loading fails', async () => {
    respondWith(500);
    renderWithProviders(<IncidentTypesPage />);
    expect(
      await screen.findByRole('button', { name: 'Try again' }),
    ).toBeDefined();
  });
});
