import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { SeveritySlider } from './severity-slider';

describe('SeveritySlider', () => {
  it('picks the level at the slider step', () => {
    const onValueChange = vi.fn();
    render(<SeveritySlider value={null} onValueChange={onValueChange} />);

    screen.getByText('Unknown');
    fireEvent.change(screen.getByRole('slider', { hidden: true }), {
      target: { value: 3 },
    });

    expect(onValueChange).toHaveBeenCalledWith('critical');
  });

  it('picks a level from its label', () => {
    const onValueChange = vi.fn();
    render(<SeveritySlider value={null} onValueChange={onValueChange} />);

    fireEvent.click(screen.getByRole('button', { name: 'Moderate' }));

    expect(onValueChange).toHaveBeenCalledWith('moderate');
  });

  it('clears back to unknown', () => {
    const onValueChange = vi.fn();
    render(<SeveritySlider value="high" onValueChange={onValueChange} />);

    fireEvent.click(screen.getByRole('button', { name: 'Clear' }));

    expect(onValueChange).toHaveBeenCalledWith(null);
  });
});
