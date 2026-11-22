import { fireEvent, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { renderWithProviders } from '@/testing/render';
import { ReportId } from './report-id';

const id = '0b9a3f4e-8c1d-4e2a-9f6b-1c2d3e4f5a6b';

describe('ReportId', () => {
  it('copies the full ID when clicked', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal('navigator', { clipboard: { writeText } });
    renderWithProviders(<ReportId id={id} />);

    fireEvent.click(
      await screen.findByRole('button', { name: 'Copy report ID #0b9a3f4e' }),
    );
    await waitFor(() => expect(writeText).toHaveBeenCalledWith(id));
  });
});
