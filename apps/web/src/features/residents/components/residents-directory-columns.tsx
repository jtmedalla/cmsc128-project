import type { ResidentListItem } from '@repo/shared';
import { createColumnHelper } from '@tanstack/react-table';
import { DataTableColumnHeader } from '@/components/ui/data-table-column-header';
import { Badge } from '@/components/ui/badge';
import type { DataTableFeatures } from '@/lib/data-table-features';
import { LANGUAGE_LABELS } from '@/lib/format';
import { Link } from '@tanstack/react-router';

export const COLUMN_LABELS: Record<string, string> = {
  name: 'Name',
  contactNumber: 'Contact Number',
  barangay: 'Barangay',
  reportCount: 'Reports',
  languagePreference: 'Language',
  broadcastsOptIn: 'Advisories',
  lastMessaged: 'Last Messaged',
};

const columnHelper = createColumnHelper<DataTableFeatures, ResidentListItem>();

export const columns = columnHelper.columns([
  columnHelper.accessor((row) => row.name ?? '', {
    id: 'name',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Name" />
    ),
    cell: ({ row }) => (
      <Link
        to="/dashboard/residents/$residentId"
        params={{ residentId: row.original.id }}
        className="text-primary font-bold underline-offset-4 hover:underline"
      >
        {row.original.name ?? 'Unnamed resident'}
      </Link>
    ),
  }),
  columnHelper.accessor((row) => row.contactNumber ?? '', {
    id: 'contactNumber',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Contact Number" />
    ),
    cell: ({ row }) => row.original.contactNumber ?? '—',
  }),
  columnHelper.accessor((row) => row.barangay ?? '', {
    id: 'barangay',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Barangay" />
    ),
    cell: ({ row }) => row.original.barangay ?? '—',
  }),
  columnHelper.accessor('reportCount', {
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Reports" />
    ),
  }),
  columnHelper.accessor('languagePreference', {
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Language" />
    ),
    cell: ({ row }) => LANGUAGE_LABELS[row.original.languagePreference],
  }),
  columnHelper.accessor('broadcastsOptIn', {
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Advisories" />
    ),
    cell: ({ row }) =>
      row.original.broadcastsOptIn ? (
        <Badge className="bg-emerald-500 text-white hover:bg-emerald-500">
          Opted in
        </Badge>
      ) : (
        <Badge variant="outline">Opted out</Badge>
      ),
  }),
  columnHelper.accessor((row) => row.lastMessaged?.getTime() ?? 0, {
    id: 'lastMessaged',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Last Messaged" />
    ),
    cell: ({ row }) => {
      const lastMessaged = row.original.lastMessaged;
      if (!lastMessaged) return 'Never';
      const minutes = Math.floor((Date.now() - lastMessaged.getTime()) / 60000);
      return `${Math.floor(minutes / 60)}h ${minutes % 60}m ago`;
    },
  }),
]);
