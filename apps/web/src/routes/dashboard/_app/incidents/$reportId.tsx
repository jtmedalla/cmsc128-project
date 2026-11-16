import { createFileRoute } from '@tanstack/react-router';
import { IncidentPage } from '@/components/report-details';

export const Route = createFileRoute('/dashboard/_app/incidents/$reportId')({
  component: IncidentPage,
});
