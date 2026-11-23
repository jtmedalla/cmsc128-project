import type { Agency } from '@repo/shared';
import { createColumnHelper } from '@tanstack/react-table';
import { ContactNumber } from '@/components/contact-number';
import { DataTableColumnHeader } from '@/components/ui/data-table-column-header';
import type { DataTableFeatures } from '@/lib/data-table-features';
import { ActiveSwitch, EditAgencyButton, PublicSwitch } from './agency-editors';
import { DeleteAgencyButton } from './delete-agency-button';

export const COLUMN_LABELS: Record<string, string> = {
  name: 'Name',
  contactNumber: 'Contact Number',
  isPublic: 'Public',
  isActive: 'Active',
};

const columnHelper = createColumnHelper<DataTableFeatures, Agency>();

export const columns = columnHelper.columns([
  columnHelper.accessor('name', {
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Name" />
    ),
    cell: ({ row }) => <span className="font-medium">{row.original.name}</span>,
  }),
  columnHelper.accessor((row) => row.contactNumber ?? '', {
    id: 'contactNumber',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Contact Number" />
    ),
    cell: ({ row }) =>
      row.original.contactNumber ? (
        <ContactNumber number={row.original.contactNumber} />
      ) : (
        '—'
      ),
  }),
  columnHelper.accessor('isPublic', {
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Public" />
    ),
    cell: ({ row }) => <PublicSwitch agency={row.original} />,
  }),
  columnHelper.accessor('isActive', {
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Active" />
    ),
    cell: ({ row }) => <ActiveSwitch agency={row.original} />,
  }),
  columnHelper.display({
    id: 'actions',
    header: () => <span className="sr-only">Actions</span>,
    cell: ({ row }) => (
      <div className="text-right">
        {!row.original.isPublic && !row.original.inUse && (
          <DeleteAgencyButton agency={row.original} />
        )}
        <EditAgencyButton agency={row.original} />
      </div>
    ),
  }),
]);
