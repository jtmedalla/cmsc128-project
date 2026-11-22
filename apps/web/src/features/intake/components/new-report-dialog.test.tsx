import { QueryClient } from '@tanstack/react-query';
import { fireEvent, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { renderWithProviders, respondWith } from '@/testing/render';
import { geoQueries } from '@/features/geo';
import { intakeQueries } from '../queries';

// MapLibre can't draw in jsdom.
vi.mock('@/components/map', () => ({
  Map: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));
vi.mock('@/components/ui/map', () => ({
  MapMarker: () => null,
  MarkerContent: () => null,
  MapControls: () => null,
  useMap: () => ({ map: null }),
}));
import { NewReportDialog } from './new-report-dialog';

const id = '0b9a3f4e-8c1d-4e2a-9f6b-1c2d3e4f5a6b';

const post = () =>
  vi.mocked(fetch).mock.calls.find(([, init]) => init?.method === 'POST');

describe('NewReportDialog', () => {
  it('sends the filled-in fields and leaves the rest unknown', async () => {
    const queryClient = new QueryClient();
    queryClient.setQueryData(intakeQueries.incidentTypes().queryKey, [
      { id, code: 'fire', name: 'Fire' },
    ]);
    queryClient.setQueryData(geoQueries.barangays().queryKey, []);
    respondWith(201, { id });
    renderWithProviders(<NewReportDialog />, { queryClient });

    fireEvent.click(await screen.findByRole('button', { name: 'New report' }));
    /* Base UI needs pointerdown before click to select an option. */
    fireEvent.click(await screen.findByLabelText('Incident type'));
    const fire = await screen.findByRole('option', { name: 'Fire' });
    fireEvent.pointerDown(fire);
    fireEvent.click(fire);
    // The slider's steps run low, moderate, high, critical.
    fireEvent.change(await screen.findByRole('slider', { hidden: true }), {
      target: { value: 2 },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Create report' }));

    await waitFor(() => expect(post()).toBeDefined());
    const [url, init] = post()!;
    expect(String(url)).toMatch(/\/intake\/reports$/);
    expect(JSON.parse(init!.body as string)).toEqual({
      incidentTypeId: id,
      severity: 'high',
      barangayId: null,
      locationText: null,
      location: null,
      incidentAt: null,
      anyoneHurt: null,
      victims: [],
    });
  });

  it('sends the people hurt after Yes', async () => {
    respondWith(201, { id });
    renderWithProviders(<NewReportDialog />);

    fireEvent.click(await screen.findByRole('button', { name: 'New report' }));
    fireEvent.click(await screen.findByRole('button', { name: 'Yes' }));
    fireEvent.click(screen.getByRole('button', { name: 'Add person hurt' }));
    fireEvent.click(screen.getByRole('button', { name: 'Female' }));
    fireEvent.change(screen.getByLabelText('Age'), {
      target: { value: '60s' },
    });
    fireEvent.change(screen.getByLabelText('Condition'), {
      target: { value: 'Bleeding' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Create report' }));

    await waitFor(() => expect(post()).toBeDefined());
    expect(JSON.parse(post()![1]!.body as string)).toMatchObject({
      anyoneHurt: 'yes',
      victims: [
        { sex: 'female', ageMin: 60, ageMax: 69, medicalCondition: 'Bleeding' },
      ],
    });
  });

  it('sets the incident time to now', async () => {
    respondWith(201, { id });
    renderWithProviders(<NewReportDialog />);

    fireEvent.click(await screen.findByRole('button', { name: 'New report' }));
    fireEvent.click(await screen.findByRole('button', { name: 'Now' }));
    fireEvent.click(screen.getByRole('button', { name: 'Create report' }));

    await waitFor(() => expect(post()).toBeDefined());
    const { incidentAt } = JSON.parse(post()![1]!.body as string);
    // Minute precision, so within two minutes of the click.
    expect(Math.abs(Date.parse(incidentAt) - Date.now())).toBeLessThan(120_000);
  });

  it("won't send an age it can't read", async () => {
    renderWithProviders(<NewReportDialog />);

    fireEvent.click(await screen.findByRole('button', { name: 'New report' }));
    fireEvent.click(await screen.findByRole('button', { name: 'Yes' }));
    fireEvent.click(screen.getByRole('button', { name: 'Add person hurt' }));
    fireEvent.change(screen.getByLabelText('Age'), {
      target: { value: 'banana' },
    });

    expect(
      screen.getByRole('button', { name: 'Create report' }),
    ).toHaveProperty('disabled', true);
  });
});
