import { createFileRoute } from '@tanstack/react-router';
import { StatusPage } from '@/features/feedback';

export const Route = createFileRoute('/_resident/status/$token')({
  component: StatusPage,
});
