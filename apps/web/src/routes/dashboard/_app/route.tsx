import { createFileRoute, redirect } from '@tanstack/react-router';
import { DashboardLayout } from '@/components/dashboard-layout';
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
});
