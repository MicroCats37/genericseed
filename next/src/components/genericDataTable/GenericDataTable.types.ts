import type { ColumnDef } from '@tanstack/react-table'
import type { ReactNode } from 'react'

export type TableMode = 'url' | 'local'

export interface PaginationState {
  page: number
  pageSize: number
  totalPages: number
  totalItems: number
}

export interface SortingParam {
  field: string
  direction: 'asc' | 'desc'
  // maps to API: direction=asc → ordering=field, desc → ordering=-field
}

export interface DataTableProps<T> {
  columns: ColumnDef<T, unknown>[]
  data: T[]
  isLoading?: boolean
  skeletonRows?: number        // default: 5
  pagination?: PaginationState
  onPaginationChange?: (page: number, pageSize: number) => void
  sorting?: SortingParam | null
  onSortingChange?: (sorting: SortingParam | null) => void
  mode?: TableMode             // default: 'local'
  emptyState?: ReactNode       // custom empty state slot
  rowActions?: (row: T) => ReactNode  // actions column slot
  className?: string
}
