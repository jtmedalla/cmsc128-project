import type { QueryClient } from '@tanstack/react-query';
import { createRootRouteWithContext, Outlet } from '@tanstack/react-router';
import { NotFound } from '@/components/not-found';
import { ResidentLayout } from '@/components/resident-layout';
import { Toaster } from '@/components/ui/sonner';

export const Route = createRootRouteWithContext<{
  queryClient: QueryClient;
}>()({
  component: () => (
    <>
      <Outlet />
      <Toaster />
    </>
  ),
  // The root has no layout of its own, so public misses get the resident one.
  notFoundComponent: () => (
    <ResidentLayout>
      <NotFound home="/" />
    </ResidentLayout>
  ),
});
