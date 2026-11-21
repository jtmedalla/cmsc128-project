import { ResidentsDirectory } from '@/components/residents-directory';
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/dashboard/_app/residents/')({
  component: ResidentsDirectory,
});
