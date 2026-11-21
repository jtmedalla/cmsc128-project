import { createFileRoute } from '@tanstack/react-router';
import { requireRole } from '@/features/auth';

// Every /dashboard/admin page is admin-only.
export const Route = createFileRoute('/dashboard/_app/admin')({
  beforeLoad: ({ context }) => {
    requireRole(context.session, ['admin']);
  },
});
