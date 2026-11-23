import type { Agency } from '@repo/shared';
import { fireEvent, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { Toaster } from 'sonner';
import { renderWithProviders, respondWith } from '@/testing/render';
import { AgenciesPage } from './agencies-page';

const bfp: Agency = {
  id: '3b241101-e2bb-4255-8caf-4136c566a962',
  name: 'BFP',
  contactNumber: '(033) 000-0101',
  isPublic: true,
  isActive: true,
};
const afp: Agency = {
  id: '9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d',
  name: 'AFP',
  contactNumber: null,
  isPublic: false,
  isActive: false,
};

const json = (body: unknown, status = 200) =>
  Promise.resolve(new Response(JSON.stringify(body), { status }));

/** Answers the list with `rows()` and each write with `write`. */
function stubApi(rows: () => Agency[], write: () => Promise<Response>) {
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

const checked = (label: string) =>
  screen.getByLabelText(label).getAttribute('aria-checked');

describe('AgenciesPage', () => {
  it('lists agencies with their number and flags', async () => {
    respondWith(200, [afp, bfp]);
    renderWithProviders(<AgenciesPage />);
    expect(await screen.findByText('(033) 000-0101')).toBeDefined();
    expect(checked('BFP is public')).toBe('true');
    expect(checked('AFP is active')).toBe('false');
  });

  it('asks for a number before listing an agency on hotlines', async () => {
    const fetch = stubApi(
      () => [afp],
      () => json({}),
    );
    renderWithProviders(
      <>
        <AgenciesPage />
        <Toaster />
      </>,
    );

    fireEvent.click(
      await screen.findByRole('switch', { name: 'AFP is public' }),
    );

    expect(
      await screen.findByText('Add a contact number to AFP before listing it.'),
    ).toBeDefined();
    expect(checked('AFP is public')).toBe('false');
    expect(writes(fetch)).toEqual([]);
  });

  it('lists an agency on hotlines', async () => {
    const mho = { ...bfp, name: 'MHO', isPublic: false };
    let rows = [mho];
    const fetch = stubApi(
      () => rows,
      () => {
        rows = [{ ...mho, isPublic: true }];
        return json(rows[0]);
      },
    );
    renderWithProviders(<AgenciesPage />);

    fireEvent.click(
      await screen.findByRole('switch', { name: 'MHO is public' }),
    );

    await waitFor(() => expect(checked('MHO is public')).toBe('true'));
    expect(writes(fetch)[0]!.body).toEqual({
      name: 'MHO',
      contactNumber: '(033) 000-0101',
      isPublic: true,
      isActive: true,
    });
  });

  it('retires an agency, sending its other fields unchanged', async () => {
    let rows = [bfp];
    const fetch = stubApi(
      () => rows,
      () => {
        rows = [{ ...bfp, isActive: false }];
        return json(rows[0]);
      },
    );
    renderWithProviders(<AgenciesPage />);

    fireEvent.click(await screen.findByLabelText('BFP is active'));

    await waitFor(() => expect(checked('BFP is active')).toBe('false'));
    expect(writes(fetch)).toEqual([
      {
        url: expect.stringMatching(/\/admin\/agencies\/3b24.+$/),
        method: 'PUT',
        body: {
          name: 'BFP',
          contactNumber: '(033) 000-0101',
          isPublic: true,
          isActive: false,
        },
      },
    ]);
  });

  it('adds an agency', async () => {
    const mdrrmo = { ...bfp, id: crypto.randomUUID(), name: 'MDRRMO' };
    let rows = [bfp];
    const fetch = stubApi(
      () => rows,
      () => {
        rows = [bfp, mdrrmo];
        return json(mdrrmo, 201);
      },
    );
    renderWithProviders(<AgenciesPage />);

    fireEvent.click(await screen.findByRole('button', { name: 'Add agency' }));
    fireEvent.change(screen.getByLabelText('Name'), {
      target: { value: 'MDRRMO' },
    });
    fireEvent.change(screen.getByLabelText('Contact number'), {
      target: { value: '(033) 000-0101' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Add' }));

    expect(await screen.findByLabelText('MDRRMO is active')).toBeDefined();
    expect(writes(fetch)[0]!.body).toEqual({
      name: 'MDRRMO',
      contactNumber: '(033) 000-0101',
    });
  });

  it("won't remove a listed agency's number", async () => {
    const fetch = stubApi(
      () => [bfp],
      () => json({}),
    );
    renderWithProviders(<AgenciesPage />);

    fireEvent.click(await screen.findByRole('button', { name: 'Edit BFP' }));
    fireEvent.change(screen.getByLabelText('Contact number'), {
      target: { value: '' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));

    expect(
      await screen.findByText(
        'Unlist this agency from hotlines before removing its number.',
      ),
    ).toBeDefined();
    expect(writes(fetch)).toEqual([]);
  });

  it('edits an agency and says when the name is taken', async () => {
    stubApi(
      () => [bfp],
      () => json({ statusCode: 409 }, 409),
    );
    renderWithProviders(<AgenciesPage />);

    fireEvent.click(await screen.findByRole('button', { name: 'Edit BFP' }));
    fireEvent.change(screen.getByLabelText('Name'), {
      target: { value: 'PNP' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));

    expect(
      await screen.findByText('An agency with this name already exists.'),
    ).toBeDefined();
  });

  it('saves an edited number with the agency still active', async () => {
    let rows = [bfp];
    const fetch = stubApi(
      () => rows,
      () => {
        rows = [{ ...bfp, contactNumber: '(033) 315-8000' }];
        return json(rows[0]);
      },
    );
    renderWithProviders(<AgenciesPage />);

    fireEvent.click(await screen.findByRole('button', { name: 'Edit BFP' }));
    fireEvent.change(screen.getByLabelText('Contact number'), {
      target: { value: '(033) 315-8000' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() =>
      expect(screen.getByText('(033) 315-8000')).toBeDefined(),
    );
    expect(writes(fetch)[0]!.body).toEqual({
      name: 'BFP',
      contactNumber: '(033) 315-8000',
      isPublic: true,
      isActive: true,
    });
  });

  it('offers a retry when loading fails', async () => {
    respondWith(500);
    renderWithProviders(<AgenciesPage />);
    expect(
      await screen.findByRole('button', { name: 'Try again' }),
    ).toBeDefined();
  });
});
