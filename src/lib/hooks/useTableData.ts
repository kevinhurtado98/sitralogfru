'use client'

import { useEffect, useMemo, useState } from 'react'

export type SortDir = 'asc' | 'desc'

export type SortAccessor<T> = (item: T) => string | number | Date | null

export const PAGE_SIZES = [20, 50, 100, 200] as const

/** Ordena (1 columna activa a la vez, ciclo asc → desc → sin orden) y pagina un arreglo ya filtrado. */
export function useTableData<T>(
  data: T[],
  accessors: Record<string, SortAccessor<T>>,
  initialPageSize: number = 20,
) {
  const [sortKey, setSortKey] = useState<string | null>(null)
  const [sortDir, setSortDir] = useState<SortDir>('asc')
  const [page, setPage]       = useState(1)
  const [pageSize, setPageSize] = useState(initialPageSize)

  function toggleSort(key: string) {
    if (sortKey !== key)      { setSortKey(key); setSortDir('asc') }
    else if (sortDir === 'asc') setSortDir('desc')
    else                       setSortKey(null)
  }

  const sorted = useMemo(() => {
    const getValue = sortKey ? accessors[sortKey] : null
    if (!getValue) return data
    return [...data].sort((a, b) => {
      const va = getValue(a)
      const vb = getValue(b)
      if (va == null) return vb == null ? 0 : 1
      if (vb == null) return -1
      const cmp =
        va instanceof Date || vb instanceof Date ? new Date(va).getTime() - new Date(vb).getTime()
        : typeof va === 'number' && typeof vb === 'number' ? va - vb
        : String(va).localeCompare(String(vb), 'es', { sensitivity: 'base' })
      return sortDir === 'asc' ? cmp : -cmp
    })
  }, [data, sortKey, sortDir, accessors])

  useEffect(() => { setPage(1) }, [data, sortKey, sortDir, pageSize])

  const totalItems  = sorted.length
  const totalPages  = Math.max(1, Math.ceil(totalItems / pageSize))
  const safePage    = Math.min(page, totalPages)

  const pageData = useMemo(
    () => sorted.slice((safePage - 1) * pageSize, safePage * pageSize),
    [sorted, safePage, pageSize],
  )

  return {
    sortKey, sortDir, toggleSort,
    page: safePage, setPage, pageSize, setPageSize,
    pageData, totalItems, totalPages,
  }
}
