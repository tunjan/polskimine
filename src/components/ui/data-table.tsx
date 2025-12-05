"use client"

import * as React from "react"
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
} from "@tanstack/react-table"

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { cn } from "@/lib/utils"

interface DataTableProps<TData, TValue> {
    columns: ColumnDef<TData, TValue>[]
    data: TData[]
    onRowSelectionChange?: (selection: RowSelectionState) => void
    rowSelection?: RowSelectionState
    enableRowSelection?: boolean
    getRowId?: (row: TData) => string
    searchValue?: string
    searchColumn?: string
    pageSize?: number
    onRowClick?: (row: TData) => void
    // Manual pagination props
    pageCount?: number
    pageIndex?: number
    onPageChange?: (page: number) => void
    manualPagination?: boolean
    totalItems?: number
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
    const [sorting, setSorting] = React.useState<SortingState>([])
    const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
    const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({})
    const [internalRowSelection, setInternalRowSelection] = React.useState<RowSelectionState>({})
    const [internalPagination, setInternalPagination] = React.useState({
        pageIndex: 0,
        pageSize: pageSize,
    })

    const rowSelection = externalRowSelection ?? internalRowSelection

    // Use external or internal pagination state
    const paginationState = manualPagination
        ? { pageIndex, pageSize }
        : internalPagination

    // Apply search filter
    React.useEffect(() => {
        if (searchColumn && searchValue) {
            setColumnFilters([{ id: searchColumn, value: searchValue }])
        } else {
            setColumnFilters([])
        }
    }, [searchValue, searchColumn])

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
            const newState = typeof updater === 'function' ? updater(rowSelection) : updater
            if (onRowSelectionChange) {
                onRowSelectionChange(newState)
            } else {
                setInternalRowSelection(newState)
            }
        },
        onPaginationChange: (updater) => {
            if (manualPagination && onPageChange) {
                const newState = typeof updater === 'function' ? updater(paginationState) : updater
                onPageChange(newState.pageIndex)
            } else {
                setInternalPagination(updater as any)
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
    })

    return (
        <div className="flex flex-col h-full space-y-4">
            {/* Genshin-styled Table Container */}
            <div className="relative flex-1 min-h-0 overflow-auto genshin-panel !p-0 bg-card/50">
                <Table>
                    <TableHeader className="sticky top-0 bg-card/95 backdrop-blur-sm z-10 shadow-sm shadow-black/5">
                        {table.getHeaderGroups().map((headerGroup) => (
                            <TableRow key={headerGroup.id} className="border-b border-primary/20 hover:bg-transparent">
                                {headerGroup.headers.map((header) => (
                                    <TableHead key={header.id} className="relative h-11 text-muted-foreground font-medium tracking-wide">
                                        {header.isPlaceholder
                                            ? null
                                            : flexRender(
                                                header.column.columnDef.header,
                                                header.getContext()
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
                                        "cursor-pointer transition-all duration-200 group border-b border-border/40 last:border-0",
                                        "hover:bg-primary/5",
                                        row.getIsSelected() && "bg-primary/10 hover:bg-primary/15"
                                    )}
                                >
                                    {row.getVisibleCells().map((cell) => (
                                        <TableCell key={cell.id} className="py-3">
                                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                        </TableCell>
                                    ))}
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={columns.length} className="h-24 text-center">
                                    <div className="flex flex-col items-center justify-center gap-2 text-muted-foreground py-12">
                                        <div className="w-12 h-12 border border-border/50 rotate-45 flex items-center justify-center mb-4">
                                            <span className="w-6 h-6 border border-border/50 rotate-45" />
                                        </div>
                                        <span className="text-lg font-editorial text-foreground">No results found</span>
                                        <p className="text-sm text-muted-foreground">Try adjusting your search or filters</p>
                                    </div>
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Pagination Controls - Genshin Styled */}
            <div className="flex items-center justify-between px-2">
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-primary/5 border border-primary/20 rounded-sm">
                        <span className="w-1.5 h-1.5 rotate-45 bg-primary" />
                        <span className="text-xs text-primary font-bold tracking-wide uppercase">
                            {table.getFilteredSelectedRowModel().rows.length} Selected
                        </span>
                    </div>
                </div>

                <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground font-ui">
                        <span>Page</span>
                        <span className="text-foreground font-bold tabular-nums font-editorial text-lg">
                            {table.getState().pagination.pageIndex + 1}
                        </span>
                        <span className="text-xs uppercase tracking-wider">of</span>
                        <span className="text-foreground font-bold tabular-nums font-editorial text-lg">
                            {table.getPageCount()}
                        </span>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => table.previousPage()}
                            disabled={!table.getCanPreviousPage()}
                            className={cn(
                                "genshin-button !py-1.5 !px-4 !text-xs flex items-center gap-2",
                                "!bg-card hover:!bg-primary/10 !text-foreground !border-border hover:!border-primary",
                                "disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-card disabled:hover:border-border"
                            )}
                        >
                            Previous
                        </button>
                        <button
                            onClick={() => table.nextPage()}
                            disabled={!table.getCanNextPage()}
                            className={cn(
                                "genshin-button !py-1.5 !px-4 !text-xs flex items-center gap-2",
                                "!bg-card hover:!bg-primary/10 !text-foreground !border-border hover:!border-primary",
                                "disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-card disabled:hover:border-border"
                            )}
                        >
                            Next
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}
