import { createFileRoute } from '@tanstack/react-router';
import { ResidentProfilePage } from '@/features/residents';

export const Route = createFileRoute('/dashboard/_app/residents/$residentId')({
  component: ResidentProfilePage,
});
