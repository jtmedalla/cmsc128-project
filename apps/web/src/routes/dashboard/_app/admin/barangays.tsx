import { createFileRoute } from '@tanstack/react-router';
import { BarangaysPage } from '@/features/admin';

export const Route = createFileRoute('/dashboard/_app/admin/barangays')({
  component: BarangaysPage,
});
