import { createFileRoute } from '@tanstack/react-router';
import { BroadcastDetailPage } from '@/features/broadcasts';

export const Route = createFileRoute('/dashboard/_app/broadcasts/$broadcastId')(
  { component: BroadcastDetailPage },
);
