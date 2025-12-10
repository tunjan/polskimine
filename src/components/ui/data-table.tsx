"use client";

import * as React from "react";
import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  RowSelectionState,
} from "@tanstack/react-table";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Settings2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  onRowSelectionChange?: (selection: RowSelectionState) => void;
  rowSelection?: RowSelectionState;
  enableRowSelection?: boolean;
  getRowId?: (row: TData) => string;
  searchValue?: string;
  searchColumn?: string;
  pageSize?: number;
  onRowClick?: (row: TData) => void;
  pageCount?: number;
  pageIndex?: number;
  onPageChange?: (page: number) => void;
  manualPagination?: boolean;
  totalItems?: number;
}

export function DataTable<TData, TValue>({
  columns,
  data,
  onRowSelectionChange,
  rowSelection: externalRowSelection,
  enableRowSelection = true,
  getRowId,
  searchValue = "",
  searchColumn,
  pageSize = 50,
  onRowClick,
  pageCount = -1,
  pageIndex = 0,
  onPageChange,
  manualPagination = false,
  totalItems,
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    [],
  );
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({});
  const [internalRowSelection, setInternalRowSelection] =
    React.useState<RowSelectionState>({});
  const [internalPagination, setInternalPagination] = React.useState({
    pageIndex: 0,
    pageSize: pageSize,
  });

  const rowSelection = externalRowSelection ?? internalRowSelection;

  const paginationState = manualPagination
    ? { pageIndex, pageSize }
    : internalPagination;

  React.useEffect(() => {
    if (searchColumn && searchValue) {
      setColumnFilters([{ id: searchColumn, value: searchValue }]);
    } else {
      setColumnFilters([]);
    }
  }, [searchValue, searchColumn]);

  const table = useReactTable({
    data,
    columns,
    pageCount: manualPagination ? pageCount : undefined,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: (updater) => {
      const newState =
        typeof updater === "function" ? updater(rowSelection) : updater;
      if (onRowSelectionChange) {
        onRowSelectionChange(newState);
      } else {
        setInternalRowSelection(newState);
      }
    },
    onPaginationChange: (updater) => {
      if (manualPagination && onPageChange) {
        const newState =
          typeof updater === "function" ? updater(paginationState) : updater;
        onPageChange(newState.pageIndex);
      } else {
        setInternalPagination(updater as any);
      }
    },
    getRowId,
    manualPagination: manualPagination,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
      pagination: paginationState,
    },
    enableRowSelection,
  });

  return (
    <div className="flex flex-col h-full space-y-4">
      <div className="relative flex-1 min-h-0 overflow-auto border rounded-md">
        <Table>
          <TableHeader className="sticky top-0 bg-background z-10">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    className="relative h-11 text-muted-foreground font-medium"
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                  onClick={() => onRowClick?.(row.original)}
                  className={cn(
                    "cursor-pointer transition-colors group",
                    "hover:bg-muted/50",
                    row.getIsSelected() && "bg-muted",
                  )}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className="py-3">
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
                      )}
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
                  <div className="flex flex-col items-center justify-center gap-2 text-muted-foreground py-12">
                    <span className="text-lg font-medium text-foreground">
                      No results found
                    </span>
                    <p className="text-sm text-muted-foreground">
                      Try adjusting your search or filters
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between px-2">
        <div className="flex items-center gap-3">
          <div className="text-sm text-muted-foreground">
            {table.getFilteredSelectedRowModel().rows.length} row(s) selected
          </div>
        </div>

        <div className="flex items-center gap-6">
          < >
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-8 gap-2">
                <Settings2 className="h-4 w-4" />
                <span className="hidden sm:inline">Columns</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40">
              {table
                .getAllColumns()
                .filter(
                  (column) =>
                    typeof column.accessorFn !== "undefined" &&
                    column.getCanHide(),
                )
                .map((column) => {
                  const columnLabels: Record<string, string> = {
                    isBookmarked: "Bookmark",
                    status: "Status",
                    targetWord: "Word",
                    targetSentence: "Sentence",
                    nativeTranslation: "Translation",
                    dueDate: "Due",
                    created_at: "Created",
                  };
                  return (
                    <DropdownMenuCheckboxItem
                      key={column.id}
                      className="capitalize"
                      checked={column.getIsVisible()}
                      onCheckedChange={(value) =>
                        column.toggleVisibility(!!value)
                      }
                    >
                      {columnLabels[column.id] || column.id}
                    </DropdownMenuCheckboxItem>
                  );
                })}
            </DropdownMenuContent>
          </DropdownMenu>

          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>Page</span>
            <span className="text-foreground font-medium tabular-nums">
              {table.getState().pagination.pageIndex + 1}
            </span>
            <span>of</span>
            <span className="text-foreground font-medium tabular-nums">
              {table.getPageCount()}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
              className={cn(
                "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50",
                "border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground",
                "h-8 px-4",
              )}
            >
              Previous
            </button>
            <button
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
              className={cn(
                "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50",
                "border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground",
                "h-8 px-4",
              )}
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
