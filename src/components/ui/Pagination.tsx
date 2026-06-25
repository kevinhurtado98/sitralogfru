'use client'

import { IconChevronLeft, IconChevronRight } from '@tabler/icons-react'
import { PAGE_SIZES } from '@/lib/hooks/useTableData'

export function Pagination({
  page, totalPages, totalItems, pageSize, onPageChange, onPageSizeChange,
}: {
  page: number
  totalPages: number
  totalItems: number
  pageSize: number
  onPageChange: (page: number) => void
  onPageSizeChange: (size: number) => void
}) {
  if (totalItems === 0) return null

  const start = (page - 1) * pageSize + 1
  const end   = Math.min(page * pageSize, totalItems)

  return (
    <div className="tc-pag">
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span>Mostrar</span>
        <select value={pageSize} onChange={(e) => onPageSizeChange(Number(e.target.value))}>
          {PAGE_SIZES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <span>{start}–{end} de {totalItems}</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <button className="ib" disabled={page <= 1} onClick={() => onPageChange(page - 1)}>
          <IconChevronLeft size={14} />
        </button>
        <span>Página {page} de {totalPages}</span>
        <button className="ib" disabled={page >= totalPages} onClick={() => onPageChange(page + 1)}>
          <IconChevronRight size={14} />
        </button>
      </div>
    </div>
  )
}
