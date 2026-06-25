'use client'

import { IconArrowDown, IconArrowsSort, IconArrowUp } from '@tabler/icons-react'
import type { CSSProperties } from 'react'
import type { SortDir } from '@/lib/hooks/useTableData'

export function SortableTh({
  label, sortKey, activeKey, dir, onSort, style,
}: {
  label: string
  sortKey: string
  activeKey: string | null
  dir: SortDir
  onSort: (key: string) => void
  style?: CSSProperties
}) {
  const active = activeKey === sortKey
  return (
    <th
      className={`sortable${active ? ' active' : ''}`}
      style={style}
      onClick={() => onSort(sortKey)}
    >
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
        {label}
        {active
          ? (dir === 'asc' ? <IconArrowUp size={12} className="sort-ic" /> : <IconArrowDown size={12} className="sort-ic" />)
          : <IconArrowsSort size={12} className="sort-ic" />}
      </span>
    </th>
  )
}
