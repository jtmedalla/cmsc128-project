import { createFileRoute } from '@tanstack/react-router';
import { ResidentProfilePage } from '@/components/resident-profile-page';

export const Route = createFileRoute('/dashboard/_app/residents/$residentId')({
  component: ResidentProfilePage,
});
