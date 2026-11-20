import { createFileRoute } from '@tanstack/react-router';
import { ReportDetails } from '@/components/report-details';

// The selected report's panes, beside the list from incidents/route.tsx.
export const Route = createFileRoute('/dashboard/_app/incidents/$reportId')({
  // Named (rules-of-hooks) but not a separate declaration (fast refresh export rule).
  component: function IncidentPage() {
    return <ReportDetails reportId={Route.useParams().reportId} />;
  },
});
