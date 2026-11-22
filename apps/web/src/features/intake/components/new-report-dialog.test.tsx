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
    fireEvent.change(await screen.findByLabelText('Incident type'), {
      target: { value: id },
    });
    fireEvent.change(screen.getByLabelText('Severity'), {
      target: { value: 'high' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Create report' }));

    const post = () =>
      vi.mocked(fetch).mock.calls.find(([, init]) => init?.method === 'POST');
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
    });
  });
});
