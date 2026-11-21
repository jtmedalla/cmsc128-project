import { cleanup } from '@testing-library/react';
import { afterEach, vi } from 'vitest';

// Unmount each test's page so queries don't match earlier renders, and drop
// fetch stubs so one test's responses never leak into the next.
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});
