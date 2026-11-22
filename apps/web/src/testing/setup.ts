import { cleanup } from '@testing-library/react';
import { afterEach, vi } from 'vitest';

// Unmount each test's page so queries don't match earlier renders, and drop
// fetch stubs so one test's responses never leak into the next.
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

// jsdom has no media queries; every query reads as not matching (a wide screen).
window.matchMedia ??= (query: string) =>
  ({
    matches: false,
    media: query,
    onchange: null,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
    dispatchEvent: () => false,
  }) as MediaQueryList;

// Nor layout: resizable panels observe sizes that never change here.
globalThis.ResizeObserver ??= class {
  observe() {}
  unobserve() {}
  disconnect() {}
};
