import { createFileRoute } from '@tanstack/react-router';
import { IncidentsWorkspace } from '@/components/incidents-workspace';

// Layout for /dashboard/incidents: the report list, with the child route beside it.
export const Route = createFileRoute('/dashboard/_app/incidents')({
  component: IncidentsWorkspace,
});
