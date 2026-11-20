import { createFileRoute } from '@tanstack/react-router';
import { HealthPage } from '@/components/health-status';

export const Route = createFileRoute('/dashboard/_app/health')({
  component: HealthPage,
});
