import type { Barangay } from '@repo/shared';
import { QueryClient } from '@tanstack/react-query';
import { fireEvent, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { renderWithProviders, respondWith } from '@/testing/render';
import { emptyLocation } from '../location';
import { geoQueries } from '../queries';
import { LocationPicker } from './location-picker';

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

const id = '0b9a3f4e-8c1d-4e2a-9f6b-1c2d3e4f5a6b';
const point = { lng: 122.2353, lat: 10.6415 };

describe('LocationPicker', () => {
  it('pins the searched place and selects its barangay', async () => {
    respondWith(200, { point, barangay: { id, name: 'Tacas' } });
    const onChange = vi.fn();
    renderWithProviders(
      <LocationPicker
        value={{ ...emptyLocation, text: 'Miagao Church' }}
        onChange={onChange}
      />,
    );

    fireEvent.click(await screen.findByRole('button', { name: 'Find on map' }));

    await waitFor(() =>
      expect(onChange).toHaveBeenCalledWith({
        text: 'Miagao Church',
        point,
        barangayId: id,
      }),
    );
  });

  it('leaves the pin alone when no place matches', async () => {
    respondWith(404, { statusCode: 404 });
    const onChange = vi.fn();
    renderWithProviders(
      <LocationPicker
        value={{ ...emptyLocation, text: 'nowhere' }}
        onChange={onChange}
      />,
    );

    fireEvent.click(await screen.findByRole('button', { name: 'Find on map' }));

    await waitFor(() => expect(fetch).toHaveBeenCalled());
    expect(onChange).not.toHaveBeenCalled();
  });

  it('pins and names a chosen barangay', async () => {
    const queryClient = new QueryClient();
    queryClient.setQueryData(geoQueries.barangays().queryKey, [
      { id, name: 'Tacas', centroid: point } as Barangay,
    ]);
    const onChange = vi.fn();
    renderWithProviders(
      <LocationPicker withBarangay value={emptyLocation} onChange={onChange} />,
      { queryClient },
    );

    /* Base UI needs pointerdown before click to select an option. */
    const [toggle] = await screen.findAllByRole('button', { expanded: false });
    fireEvent.click(toggle!);
    const tacas = await screen.findByRole('option', { name: 'Tacas' });
    fireEvent.pointerDown(tacas);
    fireEvent.click(tacas);

    expect(onChange).toHaveBeenLastCalledWith({
      text: 'Tacas',
      point,
      barangayId: id,
    });
  });

  it('drops a search answer once a barangay is chosen', async () => {
    let answer!: (response: Response) => void;
    vi.stubGlobal(
      'fetch',
      vi.fn(() => new Promise<Response>((resolve) => (answer = resolve))),
    );
    const queryClient = new QueryClient();
    queryClient.setQueryData(geoQueries.barangays().queryKey, [
      { id, name: 'Tacas', centroid: point } as Barangay,
    ]);
    const onChange = vi.fn();
    renderWithProviders(
      <LocationPicker
        withBarangay
        value={{ ...emptyLocation, text: 'Miagao Church' }}
        onChange={onChange}
      />,
      { queryClient },
    );

    fireEvent.click(await screen.findByRole('button', { name: 'Find on map' }));
    const [toggle] = await screen.findAllByRole('button', { expanded: false });
    fireEvent.click(toggle!);
    const tacas = await screen.findByRole('option', { name: 'Tacas' });
    fireEvent.pointerDown(tacas);
    fireEvent.click(tacas);
    await waitFor(() => expect(fetch).toHaveBeenCalled());
    answer(
      new Response(
        JSON.stringify({ point: { lng: 122.2, lat: 10.6 }, barangay: null }),
        { status: 200 },
      ),
    );

    await waitFor(() =>
      expect(
        screen.getByRole('button', { name: 'Find on map' }),
      ).toHaveProperty('disabled', false),
    );
    expect(onChange).toHaveBeenLastCalledWith({
      text: 'Tacas',
      point,
      barangayId: id,
    });
  });
});
