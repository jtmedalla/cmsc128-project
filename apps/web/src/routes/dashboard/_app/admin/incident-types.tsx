import { createFileRoute } from '@tanstack/react-router';
import { IncidentTypesPage } from '@/features/admin';

export const Route = createFileRoute('/dashboard/_app/admin/incident-types')({
  component: IncidentTypesPage,
});
