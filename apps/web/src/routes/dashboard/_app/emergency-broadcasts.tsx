import { createFileRoute } from '@tanstack/react-router';
import { EmergencyBroadcasts } from '@/features/broadcasts';

export const Route = createFileRoute('/dashboard/_app/emergency-broadcasts')({
  component: EmergencyBroadcasts,
});
