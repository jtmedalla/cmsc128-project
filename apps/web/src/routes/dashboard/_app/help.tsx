import { createFileRoute } from '@tanstack/react-router';
import { HelpPage } from '@/features/admin';

export const Route = createFileRoute('/dashboard/_app/help')({
  component: HelpPage,
});
