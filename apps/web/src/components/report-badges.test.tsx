import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { SeverityBadge, StatusBadge } from './report-badges';

afterEach(() => {
  cleanup();
});

// Colors come from the wireframe's report card badges (Figma "Incident Feed/Report Card").
describe('report badges', () => {
  // Moderate is the wireframe's exact badge.
  it('draws moderate severity amber with a green dot', () => {
    render(<SeverityBadge severity="moderate" />);
    const badge = screen.getByText('Moderate');
    expect(badge.className).toContain('bg-[#fef3c7]');
    expect(badge.className).toContain('text-[#78350f]');
    expect(badge.querySelector('span')?.className).toContain('bg-[#16a34a]');
  });

  it('draws status grey with a grey dot', () => {
    render(<StatusBadge status="pending" />);
    const badge = screen.getByText('Pending');
    expect(badge.className).toContain('bg-[#f4f4f5]');
    expect(badge.className).toContain('text-[#27272a]');
    expect(badge.querySelector('span')?.className).toContain('bg-[#71717a]');
  });

  // Each status has its own color; pending keeps the wireframe's grey (above).
  it('colors other statuses by state', () => {
    render(
      <>
        <StatusBadge status="resolved" />
        <StatusBadge status="invalid" />
        <StatusBadge status="closed" />
      </>,
    );
    expect(screen.getByText('Resolved').className).toContain('bg-[#dcfce7]');
    expect(screen.getByText('Invalid').className).toContain('bg-[#fee2e2]');
    expect(screen.getByText('Closed').className).toContain('bg-[#e2e8f0]');
  });

  it('colors each severity by level', () => {
    render(
      <>
        <SeverityBadge severity="low" />
        <SeverityBadge severity="high" />
        <SeverityBadge severity="critical" />
      </>,
    );
    expect(screen.getByText('Low').className).toContain('bg-[#dcfce7]');
    expect(screen.getByText('High').className).toContain('bg-[#ffedd5]');
    expect(screen.getByText('Critical').className).toContain('bg-[#fee2e2]');
  });
});
