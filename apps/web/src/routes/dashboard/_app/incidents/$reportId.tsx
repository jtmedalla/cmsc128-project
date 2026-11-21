import { createFileRoute } from '@tanstack/react-router';
import { IncidentDetail } from '@/features/triage';
import { requireRole } from '@/features/auth';

// /dashboard/incidents/:reportId: the full report page.
export const Route = createFileRoute('/dashboard/_app/incidents/$reportId')({
  beforeLoad: ({ context }) => {
    requireRole(context.session, ['responder', 'admin']);
  },
  // Named (rules-of-hooks) but not a separate declaration (fast refresh export rule).
  component: function IncidentPage() {
    return <IncidentDetail reportId={Route.useParams().reportId} />;
  },
});
