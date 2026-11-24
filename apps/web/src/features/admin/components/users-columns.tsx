import type { Account } from '@repo/shared';
import { createColumnHelper } from '@tanstack/react-table';
import { Badge } from '@/components/ui/badge';
import { DataTableColumnHeader } from '@/components/ui/data-table-column-header';
import type { DataTableFeatures } from '@/lib/data-table-features';
import { ActiveSwitch, RoleSelect } from './user-editors';

export const COLUMN_LABELS: Record<string, string> = {
  name: 'Name',
  email: 'Email',
  role: 'Role',
  active: 'Active',
};

const columnHelper = createColumnHelper<DataTableFeatures, Account>();

/** Columns for the users table; `selfId` locks the signed-in admin's row. */
export function userColumns(selfId: string | undefined) {
  return columnHelper.columns([
    columnHelper.accessor('name', {
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Name" />
      ),
      cell: ({ row }) => (
        <span className="font-medium">
          {row.original.name}
          {row.original.id === selfId && (
            <Badge variant="secondary" className="ml-2">
              You
            </Badge>
          )}
          {!row.original.active && (
            <Badge variant="outline" className="ml-2">
              Deactivated
            </Badge>
          )}
        </span>
      ),
    }),
    columnHelper.accessor('email', {
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Email" />
      ),
    }),
    columnHelper.accessor('role', {
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Role" />
      ),
      cell: ({ row }) => (
        <RoleSelect user={row.original} self={row.original.id === selfId} />
      ),
    }),
    columnHelper.accessor('active', {
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Active" />
      ),
      cell: ({ row }) => (
        <ActiveSwitch user={row.original} self={row.original.id === selfId} />
      ),
    }),
  ]);
}
