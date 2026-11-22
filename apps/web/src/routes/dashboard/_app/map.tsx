import { createFileRoute } from '@tanstack/react-router';
import { IncidentsMap } from '@/features/map';

/* The sitemap's /map, under the dashboard's sign-in guard. */
export const Route = createFileRoute('/dashboard/_app/map')({
  // ?report=<id> centers the map on that report, e.g. from a location link.
  validateSearch: (search): { report?: string } => ({
    report: typeof search.report === 'string' ? search.report : undefined,
  }),
  component: function MapPage() {
    return <IncidentsMap focusId={Route.useSearch().report} />;
  },
});
