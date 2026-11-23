import type { IncidentType } from '@repo/shared';
import { createColumnHelper } from '@tanstack/react-table';
import { IncidentTypeLabel } from '@/components/incident-type-label';
import { DataTableColumnHeader } from '@/components/ui/data-table-column-header';
import type { DataTableFeatures } from '@/lib/data-table-features';
import { DeleteIncidentTypeButton } from './delete-incident-type-button';
import {
  ActiveSwitch,
  RenameIncidentTypeButton,
} from './incident-type-editors';

export const COLUMN_LABELS: Record<string, string> = {
  name: 'Name',
  code: 'Code',
  isActive: 'Active',
};

const columnHelper = createColumnHelper<DataTableFeatures, IncidentType>();

export const columns = columnHelper.columns([
  columnHelper.accessor('name', {
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Name" />
    ),
    cell: ({ row }) => (
      <IncidentTypeLabel type={row.original} className="font-medium" />
    ),
  }),
  columnHelper.accessor('code', {
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Code" />
    ),
    cell: ({ row }) => (
      <span className="font-mono text-muted-foreground">
        {row.original.code}
      </span>
    ),
  }),
  columnHelper.accessor('isActive', {
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Active" />
    ),
    cell: ({ row }) => <ActiveSwitch type={row.original} />,
  }),
  columnHelper.display({
    id: 'actions',
    header: () => <span className="sr-only">Actions</span>,
    cell: ({ row }) => (
      <div className="text-right">
        {!row.original.inUse && (
          <DeleteIncidentTypeButton type={row.original} />
        )}
        <RenameIncidentTypeButton type={row.original} />
      </div>
    ),
  }),
]);
