import { createFileRoute } from '@tanstack/react-router';
import { ResidentsDirectory } from '@/components/residents-directory';

export const Route = createFileRoute('/dashboard/_app/residents')({
  component: ResidentsDirectory,
});
