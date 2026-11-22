import { createFileRoute, redirect } from '@tanstack/react-router';
import { DashboardLayout } from '@/components/dashboard-layout';
import { NotFound } from '@/components/not-found';
import { RouteError } from '@/components/route-error';
import { authQueries } from '@/features/auth';

export const Route = createFileRoute('/dashboard/_app')({
  beforeLoad: async ({ context, location }) => {
    const session = await context.queryClient.ensureQueryData({
      ...authQueries.session(),
      revalidateIfStale: true,
    });
    if (!session) {
      throw redirect({ to: '/login', search: { redirect: location.href } });
    }
    return { session };
  },
  component: DashboardLayout,
  errorComponent: RouteError,
  notFoundComponent: () => <NotFound home="/dashboard" />,
});
