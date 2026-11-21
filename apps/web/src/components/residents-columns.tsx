import type { ResidentListItem } from '@repo/shared';
import { createColumnHelper } from '@tanstack/react-table';
import { ArrowUpDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { DataTableFeatures } from '@/lib/table-features';

const LANGUAGE_LABELS: Record<ResidentListItem['languagePreference'], string> =
  {
    hil: 'Hiligaynon',
    krj: 'Kinaray-a',
    tgl: 'Tagalog',
    eng: 'English',
  };

const columnHelper = createColumnHelper<DataTableFeatures, ResidentListItem>();

export const columns = columnHelper.columns([
  columnHelper.accessor((row) => row.name ?? '', {
    id: 'name',
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
      >
        Name
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => row.original.name ?? 'Unknown',
  }),
  columnHelper.accessor((row) => row.contactNumber ?? '', {
    id: 'contactNumber',
    header: 'Contact Number',
    cell: ({ row }) => row.original.contactNumber ?? '—',
  }),
  columnHelper.accessor((row) => row.barangay ?? '', {
    id: 'barangay',
    header: 'Barangay',
    cell: ({ row }) => row.original.barangay ?? '—',
  }),
  columnHelper.accessor('reportCount', {
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
      >
        Reports
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
  }),
  columnHelper.accessor('languagePreference', {
    header: 'Language',
    cell: ({ row }) => LANGUAGE_LABELS[row.original.languagePreference],
  }),
  columnHelper.accessor('broadcastsOptIn', {
    header: 'Advisories',
    cell: ({ row }) =>
      row.original.broadcastsOptIn ? 'Opted in' : 'Opted out',
  }),
  columnHelper.accessor((row) => row.lastMessaged?.getTime() ?? 0, {
    id: 'lastMessaged',
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
      >
        Last Messaged
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => {
      const lastMessaged = row.original.lastMessaged;
      if (!lastMessaged) return 'Never';
      const minutes = Math.floor((Date.now() - lastMessaged.getTime()) / 60000);
      return `${Math.floor(minutes / 60)}h ${minutes % 60}m ago`;
    },
  }),
]);
