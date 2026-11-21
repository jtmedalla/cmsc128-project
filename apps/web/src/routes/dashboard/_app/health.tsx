import { createFileRoute } from '@tanstack/react-router';
import { HealthPage } from '@/features/health';

export const Route = createFileRoute('/dashboard/_app/health')({
  component: HealthPage,
});
