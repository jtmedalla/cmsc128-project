import { createFileRoute } from '@tanstack/react-router';
import { ReportPage } from '@/features/intake';

export const Route = createFileRoute('/_resident/report')({
  component: ReportPage,
});
