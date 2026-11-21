import { ResidentsDirectory } from '@/features/residents';
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/dashboard/_app/residents/')({
  component: ResidentsDirectory,
});
