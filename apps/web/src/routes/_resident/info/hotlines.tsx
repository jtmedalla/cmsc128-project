import { createFileRoute } from '@tanstack/react-router';
import { HotlinesPage } from '@/features/info';

export const Route = createFileRoute('/_resident/info/hotlines')({
  component: HotlinesPage,
});
