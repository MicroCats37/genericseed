import type { ColumnDef } from '@tanstack/react-table'
import type { ReactNode } from 'react'
import { formatDate, formatDateTime, formatShort } from '@/utils/date-formatter'

// Text column — plain string display
export function textColumn<T>(
  accessorKey: keyof T,
  header: string,
  options?: { sortable?: boolean; className?: string }
): ColumnDef<T, unknown> {
  return {
    accessorKey,
    header,
    cell: ({ getValue }) => (
      <span className={options?.className}>{String(getValue() ?? '')}</span>
    ),
  }
}

// Badge column — colored status badges with variant mapping
export function badgeColumn<T>(
  accessorKey: keyof T,
  header: string,
  variantMap: Record<string, string>
): ColumnDef<T, unknown> {
  return {
    accessorKey,
    header,
    cell: ({ getValue }) => {
      const value = String(getValue() ?? '')
      const variant = variantMap[value] ?? 'bg-muted text-muted-foreground'
      return (
        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${variant}`}>
          {value}
        </span>
      )
    },
  }
}

// Date column — formatted date display
export function dateColumn<T>(
  accessorKey: keyof T,
  header: string,
  options?: { sortable?: boolean; format?: 'full' | 'short' | 'datetime' }
): ColumnDef<T, unknown> {
  return {
    accessorKey,
    header,
    cell: ({ getValue }) => {
      const value = getValue() as string | Date | null | undefined
      const formatted =
        options?.format === 'short'
          ? formatShort(value)
          : options?.format === 'datetime'
            ? formatDateTime(value)
            : formatDate(value)
      return <span>{formatted}</span>
    },
  }
}

// Image column — thumbnail with fallback
export function imageColumn<T>(
  accessorKey: keyof T,
  header: string,
  options?: { sortable?: boolean; alt?: (row: T) => string; className?: string }
): ColumnDef<T, unknown> {
  return {
    accessorKey,
    header,
    cell: ({ row }) => {
      const src = row.original[accessorKey] as string | null | undefined
      const alt = options?.alt ? options.alt(row.original) : 'image'
      if (!src) {
        return (
          <span className={`text-muted-foreground ${options?.className ?? ''}`}>
            No image
          </span>
        )
      }
      return (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt={alt}
          className={`h-8 w-8 rounded-md object-cover ${options?.className ?? ''}`}
        />
      )
    },
  }
}

// Actions column — action buttons (edit, delete, view) with callback handlers
// This factory creates a stable column definition — callbacks are passed at creation time
export function actionsColumn<T>(options: {
  onEdit?: (row: T) => void
  onDelete?: (row: T) => void
  onView?: (row: T) => void
}): ColumnDef<T, unknown> {
  return {
    id: 'actions.view',
    header: 'Actions',
    cell: ({ row }) => {
      const actions: ReactNode[] = []

      if (options.onView) {
        actions.push(
          <button
            key="view"
            type="button"
            onClick={() => options.onView!(row.original)}
            className="rounded-md px-2 py-1 text-xs hover:bg-muted"
          >
            View
          </button>
        )
      }

      if (options.onEdit) {
        actions.push(
          <button
            key="edit"
            type="button"
            onClick={() => options.onEdit!(row.original)}
            className="rounded-md px-2 py-1 text-xs hover:bg-muted"
          >
            Edit
          </button>
        )
      }

      if (options.onDelete) {
        actions.push(
          <button
            key="delete"
            type="button"
            onClick={() => options.onDelete!(row.original)}
            className="rounded-md px-2 py-1 text-xs text-red-600 hover:bg-red-50"
          >
            Delete
          </button>
        )
      }

      return <div className="flex gap-1">{actions}</div>
    },
  }
}

// Factory function to create a complete set of column definitions
// Call this once outside of render, then reuse the returned array
export function createColumns<T>(options: {
  textColumns?: Array<{ accessorKey: keyof T; header: string; options?: { sortable?: boolean; className?: string } }>
  badgeColumns?: Array<{ accessorKey: keyof T; header: string; variantMap: Record<string, string> }>
  dateColumns?: Array<{ accessorKey: keyof T; header: string; options?: { sortable?: boolean; format?: 'full' | 'short' | 'datetime' } }>
  imageColumns?: Array<{ accessorKey: keyof T; header: string; options?: { sortable?: boolean; alt?: (row: T) => string; className?: string } }>
  actions?: { onEdit?: (row: T) => void; onDelete?: (row: T) => void; onView?: (row: T) => void }
}): ColumnDef<T, unknown>[] {
  const columns: ColumnDef<T, unknown>[] = []

  if (options.textColumns) {
    for (const col of options.textColumns) {
      columns.push(textColumn(col.accessorKey, col.header, col.options))
    }
  }

  if (options.badgeColumns) {
    for (const col of options.badgeColumns) {
      columns.push(badgeColumn(col.accessorKey, col.header, col.variantMap))
    }
  }

  if (options.dateColumns) {
    for (const col of options.dateColumns) {
      columns.push(dateColumn(col.accessorKey, col.header, col.options))
    }
  }

  if (options.imageColumns) {
    for (const col of options.imageColumns) {
      columns.push(imageColumn(col.accessorKey, col.header, col.options))
    }
  }

  if (options.actions) {
    columns.push(actionsColumn(options.actions))
  }

  return columns
}
