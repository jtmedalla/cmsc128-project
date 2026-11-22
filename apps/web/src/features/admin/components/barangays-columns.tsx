import type { Barangay } from '@repo/shared';
import { createColumnHelper } from '@tanstack/react-table';
import { DataTableColumnHeader } from '@/components/ui/data-table-column-header';
import type { DataTableFeatures } from '@/lib/data-table-features';
import { FlagSwitch, HazardToggles } from './barangay-editors';

export const COLUMN_LABELS: Record<string, string> = {
  name: 'Barangay',
  isCoastal: 'Coastal',
  isUpland: 'Upland',
  hazards: 'Hazards',
};

const columnHelper = createColumnHelper<DataTableFeatures, Barangay>();

export const columns = columnHelper.columns([
  columnHelper.accessor('name', {
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Barangay" />
    ),
    cell: ({ row }) => <span className="font-medium">{row.original.name}</span>,
  }),
  columnHelper.accessor('isCoastal', {
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Coastal" />
    ),
    cell: ({ row }) => <FlagSwitch barangay={row.original} flag="isCoastal" />,
  }),
  columnHelper.accessor('isUpland', {
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Upland" />
    ),
    cell: ({ row }) => <FlagSwitch barangay={row.original} flag="isUpland" />,
  }),
  columnHelper.accessor((row) => row.hazards.join(', '), {
    id: 'hazards',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Hazards" />
    ),
    cell: ({ row }) => <HazardToggles barangay={row.original} />,
  }),
]);
