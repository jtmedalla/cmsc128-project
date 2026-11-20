import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { EmergencyBroadcasts } from './emergency-broadcasts';

afterEach(cleanup);

describe('EmergencyBroadcasts', () => {
  it('renders the broadcast workspace and recent advisories', () => {
    render(<EmergencyBroadcasts />);

    expect(screen.getByText('Target Area')).toBeDefined();
    expect(screen.getByText('Compose Advisory')).toBeDefined();
    expect(screen.getByText('Recent Advisories')).toBeDefined();
    expect(
      screen.getByRole('heading', { name: 'Pre-Evacuation Advisory' }),
    ).toBeDefined();
    expect(
      screen.getByRole('heading', { name: 'Community Advisory #01' }),
    ).toBeDefined();
  });

  it('filters recent advisories', () => {
    render(<EmergencyBroadcasts />);

    fireEvent.change(screen.getByLabelText('Filter recent advisories'), {
      target: { value: 'Road monitoring' },
    });

    expect(
      screen.getByRole('heading', { name: 'Community Advisory #01' }),
    ).toBeDefined();
    expect(
      screen.queryByRole('heading', { name: 'Pre-Evacuation Advisory' }),
    ).toBeNull();
  });

  it('applies a quick template to the title', () => {
    render(<EmergencyBroadcasts />);

    fireEvent.click(
      screen.getByRole('button', {
        name: 'Immediate Evacuation Order',
      }),
    );

    const titleInput = screen.getByLabelText('Title') as HTMLInputElement;
    expect(titleInput.value).toBe('Immediate Evacuation Order');
  });

  it('starts with all residents selected', () => {
    render(<EmergencyBroadcasts />);

    const checkbox = screen.getByRole('checkbox', {
      name: 'All residents (no selection)',
    });

    expect(checkbox.getAttribute('aria-checked')).toBe('true');
  });
});
