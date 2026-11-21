import { createFileRoute } from '@tanstack/react-router';
import { ExportPage } from '@/features/compliance';

export const Route = createFileRoute('/dashboard/_app/export')({
  component: ExportPage,
});
