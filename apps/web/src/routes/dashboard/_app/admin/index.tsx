import { createFileRoute, redirect } from '@tanstack/react-router';

// No admin landing page in the design; Users is the first admin page.
export const Route = createFileRoute('/dashboard/_app/admin/')({
  beforeLoad: () => {
    throw redirect({ to: '/dashboard/admin/users' });
  },
});
