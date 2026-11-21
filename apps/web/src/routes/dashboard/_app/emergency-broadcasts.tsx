import { createFileRoute } from '@tanstack/react-router';
import { EmergencyBroadcasts } from '@/components/emergency-broadcasts';

export const Route = createFileRoute('/dashboard/_app/emergency-broadcasts')({
  component: EmergencyBroadcasts,
});
