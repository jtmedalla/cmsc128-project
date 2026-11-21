import { createFileRoute } from '@tanstack/react-router';
import { IncidentsWorkspace } from '@/components/incidents-workspace';

// /dashboard/incidents: the feed, with the selected report's quick view beside it.
export const Route = createFileRoute('/dashboard/_app/incidents/')({
  // ?report=<id> picks the quick view's report without leaving this route.
  validateSearch: (search): { report?: string } => ({
    report: typeof search.report === 'string' ? search.report : undefined,
  }),
  component: function IncidentsPage() {
    return <IncidentsWorkspace selectedId={Route.useSearch().report} />;
  },
});
