import type { ResidentListItem } from '@repo/shared';
import { createColumnHelper } from '@tanstack/react-table';
import { DataTableColumnHeader } from '@/components/ui/data-table-column-header';
import { Badge } from '@/components/ui/badge';
import type { DataTableFeatures } from '@/lib/data-table-features';
import { formatTime, formatTimeAgo, LANGUAGE_LABELS } from '@/lib/format';
import { ContactNumber } from '@/components/contact-number';
import { ResidentLabel } from '@/components/resident-label';

export const COLUMN_LABELS: Record<string, string> = {
  name: 'Name',
  contactNumber: 'Contact Number',
  barangay: 'Barangay',
  reportCount: 'Reports',
  languagePreference: 'Language',
  broadcastsOptIn: 'Broadcasts',
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
      <ResidentLabel resident={row.original} className="font-medium" />
    ),
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
      <DataTableColumnHeader column={column} title="Broadcasts" />
    ),
    cell: ({ row }) =>
      row.original.broadcastsOptIn ? (
        <Badge className="bg-success/12 text-success">Opted in</Badge>
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
      return lastMessaged ? (
        <time
          dateTime={lastMessaged.toISOString()}
          title={formatTime(lastMessaged)}
        >
          {formatTimeAgo(lastMessaged)}
        </time>
      ) : (
        'Never'
      );
    },
  }),
]);
