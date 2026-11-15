'use client'

import { Children, useState, type ReactNode } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'

function Pagination({
  page,
  pages,
  total,
  onChange,
}: {
  page: number
  pages: number
  total: number
  onChange: (page: number) => void
}) {
  return (
    <nav className="workspace-pagination" aria-label="Paginação">
      <span aria-live="polite">
        {total} itens · {page + 1} / {pages}
      </span>
      <div>
        <button
          type="button"
          aria-label="Página anterior"
          disabled={page === 0}
          onClick={() => onChange(page - 1)}
        >
          <ChevronLeft size={18} />
        </button>
        <button
          type="button"
          aria-label="Próxima página"
          disabled={page === pages - 1}
          onClick={() => onChange(page + 1)}
        >
          <ChevronRight size={18} />
        </button>
      </div>
    </nav>
  )
}

export function WorkspaceList({
  children,
  pageSize = 6,
  className,
  as: Tag = 'div',
}: {
  children: ReactNode
  pageSize?: number
  className?: string
  as?: 'div' | 'ol'
}) {
  const items = Children.toArray(children)
  const [requestedPage, setPage] = useState(0)
  const pages = Math.max(1, Math.ceil(items.length / pageSize))
  const page = Math.min(requestedPage, pages - 1)
  return (
    <div>
      <Tag className={className}>
        {items.slice(page * pageSize, (page + 1) * pageSize)}
      </Tag>
      {pages > 1 && (
        <Pagination
          page={page}
          pages={pages}
          total={items.length}
          onChange={setPage}
        />
      )}
    </div>
  )
}

export function WorkspaceTableBody({
  children,
  columns,
  className,
  pageSize = 8,
}: {
  children: ReactNode
  columns: number
  pageSize?: number
  className?: string
}) {
  const rows = Children.toArray(children)
  const [requestedPage, setPage] = useState(0)
  const pages = Math.max(1, Math.ceil(rows.length / pageSize))
  const page = Math.min(requestedPage, pages - 1)
  return (
    <>
      <tbody className={className}>
        {rows.slice(page * pageSize, (page + 1) * pageSize)}
      </tbody>
      {pages > 1 && (
        <tfoot>
          <tr>
            <td colSpan={columns}>
              <Pagination
                page={page}
                pages={pages}
                total={rows.length}
                onChange={setPage}
              />
            </td>
          </tr>
        </tfoot>
      )}
    </>
  )
}
