import { createFileRoute } from '@tanstack/react-router';
import { Home } from '@/features/info';

export const Route = createFileRoute('/_resident/')({
  component: Home,
});
