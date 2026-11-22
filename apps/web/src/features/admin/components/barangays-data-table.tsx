import * as React from 'react';
import {
  useTable,
  type ColumnFiltersState,
  type Updater,
  type ColumnVisibilityState,
  type SortingState,
} from '@tanstack/react-table';
import type { Barangay } from '@repo/shared';
import { DataTablePagination } from '@/components/ui/data-table-pagination';
import { DataTableViewOptions } from '@/components/ui/data-table-view-options';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useDebouncedCallback } from 'use-debounce';
import { features, type DataTableFeatures } from '@/lib/data-table-features';
import { COLUMN_LABELS, columns } from './barangays-columns';

/** The barangays table; the page owns the name filter so the map can set it. */
export function BarangaysTable({
  data,
  nameFilter,
  onNameFilterChange,
}: {
  data: Barangay[];
  nameFilter: string;
  onNameFilterChange: (name: string) => void;
}) {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  // The box shows each keystroke; the filter, URL and map follow once typing stops.
  const [search, setSearch] = React.useState(nameFilter);
  const [synced, setSynced] = React.useState(nameFilter);
  const commitSearch = useDebouncedCallback(onNameFilterChange, 300);
  if (nameFilter !== synced) {
    // Set from outside, e.g. a map click: show it and drop pending typing.
    setSynced(nameFilter);
    setSearch(nameFilter);
    commitSearch.cancel();
  }
  const columnFilters: ColumnFiltersState = nameFilter
    ? [{ id: 'name', value: nameFilter }]
    : [];
  const setColumnFilters = (updater: Updater<ColumnFiltersState>) => {
    const next =
      typeof updater === 'function' ? updater(columnFilters) : updater;
    const name = next.find((filter) => filter.id === 'name')?.value;
    onNameFilterChange(typeof name === 'string' ? name : '');
  };
  const [columnVisibility, setColumnVisibility] =
    React.useState<ColumnVisibilityState>({});

  const table = useTable<DataTableFeatures, Barangay>({
    columns,
    data,
    features,
    getRowId: (row) => row.id,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    state: { sorting, columnFilters, columnVisibility },
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <Input
          className="max-w-md"
          placeholder="Filter barangays..."
          value={search}
          onChange={(event) => {
            setSearch(event.target.value);
            commitSearch(event.target.value);
          }}
        />
        <DataTableViewOptions table={table} columnLabels={COLUMN_LABELS} />
      </div>
      <div className="overflow-hidden rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder ? null : (
                      <table.FlexRender header={header} />
                    )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      <table.FlexRender cell={cell} />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <DataTablePagination table={table} />
    </div>
  );
}
