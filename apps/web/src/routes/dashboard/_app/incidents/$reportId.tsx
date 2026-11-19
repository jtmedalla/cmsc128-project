import { createFileRoute } from '@tanstack/react-router';
import { ReportDetails } from '@/components/report-details';

// TODO(#38): link here from a feed list at /dashboard/incidents. Blocked on
// confirming the sitemap route and #103's "from the feed" criterion; for now
// the page is reached by typing its URL.
export const Route = createFileRoute('/dashboard/_app/incidents/$reportId')({
  // Named (rules-of-hooks) but not a separate declaration (fast refresh export rule).
  component: function IncidentPage() {
    return <ReportDetails reportId={Route.useParams().reportId} />;
  },
});
