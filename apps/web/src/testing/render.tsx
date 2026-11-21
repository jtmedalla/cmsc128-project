import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  RouterProvider,
} from '@tanstack/react-router';
import { render } from '@testing-library/react';
import type { ReactNode } from 'react';
import { vi } from 'vitest';

/** Answers every `fetch` with `body` as JSON and the given status. */
export function respondWith(status: number, body?: unknown) {
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue(new Response(JSON.stringify(body), { status })),
  );
}

/**
 * Renders `ui` at `path` inside a router and a fresh query client without
 * retries, so failed requests show their error state at once. Pass a
 * `queryClient` to seed its cache first.
 */
export function renderWithProviders(
  ui: ReactNode,
  {
    path = '/',
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    }),
  }: { path?: string; queryClient?: QueryClient } = {},
) {
  const root = createRootRoute();
  const page = createRoute({
    getParentRoute: () => root,
    path,
    component: () => ui,
  });
  const router = createRouter({
    routeTree: root.addChildren([page]),
    history: createMemoryHistory({ initialEntries: [path] }),
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  );
}
