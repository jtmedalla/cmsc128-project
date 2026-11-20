import { createFileRoute } from '@tanstack/react-router';
import { SelectReportPrompt } from '@/components/report-details';

// /dashboard/incidents with no report selected.
export const Route = createFileRoute('/dashboard/_app/incidents/')({
  component: SelectReportPrompt,
});
