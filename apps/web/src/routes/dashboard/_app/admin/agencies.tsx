import { createFileRoute } from '@tanstack/react-router';
import { AgenciesPage } from '@/features/admin';

export const Route = createFileRoute('/dashboard/_app/admin/agencies')({
  component: AgenciesPage,
});
