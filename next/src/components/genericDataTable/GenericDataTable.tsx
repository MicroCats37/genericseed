'use client'

import type { ColumnDef } from '@tanstack/react-table'
import {
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table'
import { useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import type { DataTableProps, SortingParam } from './GenericDataTable.types'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Skeleton } from '@/components/ui/skeleton'
import { Pagination } from '@/components/genericPagination/Pagination'

// ─── Shared render logic ──────────────────────────────────────────────────────

interface TableCoreProps<T> {
  columns: ColumnDef<T, unknown>[]
  data: T[]
  isLoading: boolean
  skeletonRows: number
  emptyState?: React.ReactNode
  rowActions?: (row: T) => React.ReactNode
  className?: string
  sorting: SortingParam | null
  onSortingChange: (s: SortingParam | null) => void
  pagination?: DataTableProps<T>['pagination']
  onPageChange: (page: number) => void
  onPageSizeChange: (size: number) => void
}

function TableCore<T>({
  columns,
  data,
  isLoading,
  skeletonRows,
  emptyState,
  rowActions,
  className,
  sorting,
  onSortingChange,
  pagination,
  onPageChange,
  onPageSizeChange,
}: TableCoreProps<T>) {
  const finalColumns: ColumnDef<T, unknown>[] = rowActions
    ? [...columns, {
        id: 'actions',
        header: 'Acciones',
        cell: ({ row }: { row: { original: T } }) => rowActions(row.original),
      }]
    : columns

  const table = useReactTable({
    data,
    columns: finalColumns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    state: {
      sorting: sorting
        ? [{ id: sorting.field, desc: sorting.direction === 'desc' }]
        : [],
    },
    onSortingChange: (updater) => {
      const next = typeof updater === 'function' ? updater([]) : updater
      if (next.length === 0) {
        onSortingChange(null)
      } else {
        const { id, desc } = next[0]
        onSortingChange({ field: id, direction: desc ? 'desc' : 'asc' })
      }
    },
  })

  if (isLoading) {
    return (
      <div className={className}>
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map(headerGroup => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map(header => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder ? null : header.column.columnDef.header?.toString()}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {Array.from({ length: skeletonRows }, (_, i) => i).map((i) => (
              <TableRow key={`skeleton-row-${i}`}>
                {finalColumns.map((col) => (
                  <TableCell key={`skeleton-cell-${i}-${String(col.id ?? (col as { accessorKey?: string }).accessorKey ?? 'col')}`}>
                    <Skeleton className="h-6 w-full" />
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    )
  }

  if (data.length === 0) {
    return (
      <div className={className}>
        {emptyState ?? (
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <p>No hay datos para mostrar</p>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className={className}>
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map(headerGroup => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map(header => (
                <TableHead
                  key={header.id}
                  className={header.column.getCanSort() ? 'cursor-pointer select-none' : ''}
                  onClick={header.column.getToggleSortingHandler()}
                >
                  <div className="flex items-center gap-1">
                    {header.isPlaceholder
                      ? null
                      : typeof header.column.columnDef.header === 'string'
                        ? header.column.columnDef.header
                        : null}
                    {header.column.getIsSorted() === 'asc' && ' ↑'}
                    {header.column.getIsSorted() === 'desc' && ' ↓'}
                  </div>
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows.map(row => (
            <TableRow key={row.id}>
              {row.getVisibleCells().map(cell => (
                <TableCell key={cell.id}>
                  {cell.renderValue() as React.ReactNode}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {pagination && (
        <Pagination
          currentPage={pagination.page}
          totalPages={pagination.totalPages}
          totalItems={pagination.totalItems}
          pageSize={pagination.pageSize}
          onPageChange={onPageChange}
          onPageSizeChange={onPageSizeChange}
        />
      )}
    </div>
  )
}

// ─── Local mode (useState) ────────────────────────────────────────────────────

function LocalDataTable<T>(props: DataTableProps<T>) {
  const [localPage, setLocalPage] = useState(1)
  const [localPageSize, setLocalPageSize] = useState(10)
  const [localSorting, setLocalSorting] = useState<SortingParam | null>(null)

  return (
    <TableCore
      {...props}
      isLoading={props.isLoading ?? false}
      skeletonRows={props.skeletonRows ?? 5}
      sorting={props.sorting ?? localSorting}
      onSortingChange={(s) => { setLocalSorting(s); props.onSortingChange?.(s) }}
      onPageChange={(p) => { setLocalPage(p); props.onPaginationChange?.(p, localPageSize) }}
      onPageSizeChange={(s) => { setLocalPageSize(s); props.onPaginationChange?.(1, s) }}
    />
  )
}

// ─── URL mode (useSearchParams) — must be wrapped in Suspense by consumer ─────

function UrlDataTable<T>(props: DataTableProps<T>) {
  const searchParams = useSearchParams()
  const router = useRouter()

  const ordering = searchParams.get('ordering')
  const sorting: SortingParam | null = ordering
    ? {
        field: ordering.startsWith('-') ? ordering.slice(1) : ordering,
        direction: ordering.startsWith('-') ? 'desc' : 'asc',
      }
    : null

  const handleSortingChange = (s: SortingParam | null) => {
    const params = new URLSearchParams(searchParams.toString())
    if (s) {
      params.set('ordering', s.direction === 'desc' ? `-${s.field}` : s.field)
    } else {
      params.delete('ordering')
    }
    router.push(`?${params.toString()}`, { scroll: false })
    props.onSortingChange?.(s)
  }

  const handlePageChange = (page: number) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set('page', String(page))
    router.push(`?${params.toString()}`, { scroll: false })
    props.onPaginationChange?.(page, props.pagination?.pageSize ?? 10)
  }

  const handlePageSizeChange = (size: number) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set('pageSize', String(size))
    params.set('page', '1')
    router.push(`?${params.toString()}`, { scroll: false })
    props.onPaginationChange?.(1, size)
  }

  return (
    <TableCore
      {...props}
      isLoading={props.isLoading ?? false}
      skeletonRows={props.skeletonRows ?? 5}
      sorting={sorting}
      onSortingChange={handleSortingChange}
      onPageChange={handlePageChange}
      onPageSizeChange={handlePageSizeChange}
    />
  )
}

// ─── Public export ────────────────────────────────────────────────────────────

export function GenericDataTable<T>(props: DataTableProps<T>) {
  const {
    isLoading = false,
    skeletonRows = 5,
    mode = 'local',
  } = props

  if (mode === 'url') {
    return <UrlDataTable {...props} isLoading={isLoading} skeletonRows={skeletonRows} />
  }

  return <LocalDataTable {...props} isLoading={isLoading} skeletonRows={skeletonRows} />
}
