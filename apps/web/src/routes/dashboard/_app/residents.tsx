import { createFileRoute } from '@tanstack/react-router';
import { ResidentsPage } from '@/components/residents-page';

export const Route = createFileRoute('/dashboard/_app/residents')({
  component: ResidentsPage,
});
