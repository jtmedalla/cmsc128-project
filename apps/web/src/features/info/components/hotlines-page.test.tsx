import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { renderWithProviders, respondWith } from '@/testing/render';
import { HotlinesPage } from './hotlines-page';

describe('HotlinesPage', () => {
  it('lists 911, then each public agency to call', async () => {
    respondWith(200, [{ name: 'BFP', contactNumber: '(033) 000-0101' }]);
    renderWithProviders(<HotlinesPage />);
    const bfp = await screen.findByLabelText('Call BFP: (033) 000-0101');
    expect(bfp.getAttribute('href')).toBe('tel:0330000101');
    expect(screen.getByLabelText('Call National emergency: 911')).toBeDefined();
  });

  it('keeps 911 and offers a retry when agencies fail to load', async () => {
    respondWith(500);
    renderWithProviders(<HotlinesPage />);
    expect(
      await screen.findByRole('button', { name: 'Try again' }),
    ).toBeDefined();
    expect(screen.getByLabelText('Call National emergency: 911')).toBeDefined();
  });
});
