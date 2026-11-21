import { createFileRoute } from '@tanstack/react-router';
import { UsersPage } from '@/features/admin';

export const Route = createFileRoute('/dashboard/_app/admin/users')({
  component: UsersPage,
});
