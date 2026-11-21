import { createFileRoute } from '@tanstack/react-router';
import { OfficeInfoPage } from '@/features/info';

export const Route = createFileRoute('/_resident/info/')({
  component: OfficeInfoPage,
});
