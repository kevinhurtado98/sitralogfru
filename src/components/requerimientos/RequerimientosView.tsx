'use client'

import { useState, useMemo } from 'react'
import { format } from 'date-fns'
import { IconSearch, IconEye, IconPlus, IconFileSpreadsheet } from '@tabler/icons-react'
import type { EstadoRequerimiento, Prioridad, TipoRequerimiento } from '@/lib/types'
import { SortableTh } from '@/components/ui/SortableTh'
import { Pagination } from '@/components/ui/Pagination'
import { useTableData, type SortAccessor } from '@/lib/hooks/useTableData'

// ─── Types ───────────────────────────────────────────────────────────────────

export interface AreaConResponsables {
  id:     number
  nombre: string
  color:  string
  tc:     string
  responsables: { id: number; nombres: string; apellidos: string; correo: string }[]
}

export interface ReqRow {
  id:             number
  fechaSolicitud: Date | string
  area:           string
  prioridad:      string
  tipo:           string
  descripcion:    string
  glosa:          string | null
  estado:         string
  diasRetraso:    number
  responsable:    { nombre: string }
  creadoPor:      { nombre: string }
  fechaUltimoCambio: Date | string | null
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function estadoBadge(e: string) {
  const map: Record<string, [string, string]> = {
    ATENDIDO_TOTAL:    ['badge-green', 'Atendido total'],
    ATENDIDO_PARCIAL:  ['badge-ora',   'Atendido parcial'],
    PENDIENTE:         ['badge-red',   'Pendiente'],
    NO_ATENDIDO:       ['badge-red',   'No atendido'],
  }
  const [cls, label] = map[e] ?? ['badge-slate', e]
  return <span className={`badge ${cls}`}>{label}</span>
}

function prioridadBadge(p: string) {
  return p === 'ALTA'
    ? <span className="badge badge-red">Alta</span>
    : <span className="badge badge-amber">Media</span>
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export function RequerimientosView({
  requerimientos,
  areas,
}: {
  requerimientos: ReqRow[]
  areas:          AreaConResponsables[]
}) {
  const [busqueda,     setBusqueda]     = useState('')
  const [filtroArea,   setFiltroArea]   = useState('')
  const [filtroDesde,  setFiltroDesde]  = useState('')
  const [filtroHasta,  setFiltroHasta]  = useState('')
  const [filtroEstado, setFiltroEstado] = useState('')

  const filtrados = useMemo(() => {
    return requerimientos.filter((r) => {
      if (busqueda) {
        const q = busqueda.toLowerCase()
        const match =
          r.area.toLowerCase().includes(q) ||
          r.responsable.nombre.toLowerCase().includes(q) ||
          r.descripcion.toLowerCase().includes(q)
        if (!match) return false
      }
      if (filtroArea   && r.area !== filtroArea)     return false
      if (filtroEstado && r.estado !== filtroEstado) return false
      if (filtroDesde) {
        if (new Date(r.fechaSolicitud) < new Date(filtroDesde)) return false
      }
      if (filtroHasta) {
        const h = new Date(filtroHasta)
        h.setHours(23, 59, 59)
        if (new Date(r.fechaSolicitud) > h) return false
      }
      return true
    })
  }, [requerimientos, busqueda, filtroArea, filtroEstado, filtroDesde, filtroHasta])

  const sortAccessors = useMemo<Record<string, SortAccessor<ReqRow>>>(() => ({
    fecha:       (r) => new Date(r.fechaSolicitud),
    area:        (r) => r.area,
    responsable: (r) => r.responsable.nombre,
    tipo:        (r) => r.tipo,
    prioridad:   (r) => r.prioridad === 'ALTA' ? 1 : 0,
    descripcion: (r) => r.descripcion,
    glosa:       (r) => r.glosa ?? '',
    creadoPor:   (r) => r.creadoPor.nombre,
    diasRetraso: (r) => r.diasRetraso,
    estado:      (r) => r.estado,
    actualizacion: (r) => r.fechaUltimoCambio ? new Date(r.fechaUltimoCambio) : null,
  }), [])

  const {
    sortKey, sortDir, toggleSort,
    page, setPage, pageSize, setPageSize,
    pageData, totalItems, totalPages,
  } = useTableData(filtrados, sortAccessors, 20)

  function limpiar() {
    setBusqueda(''); setFiltroArea(''); setFiltroDesde(''); setFiltroHasta(''); setFiltroEstado('')
  }

  function exportarExcel() {
    const params = new URLSearchParams()
    if (busqueda)     params.set('q', busqueda)
    if (filtroArea)   params.set('area', filtroArea)
    if (filtroEstado) params.set('estado', filtroEstado)
    if (filtroDesde)  params.set('desde', filtroDesde)
    if (filtroHasta)  params.set('hasta', filtroHasta)
    window.location.href = `/api/requerimientos/export?${params.toString()}`
  }

  return (
    <>
      {/* Filtros */}
      <div className="fc">
        <div style={{ display: 'flex', gap: 9, flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div className="fg">
            <label>Buscar</label>
            <input type="text" placeholder="Área, responsable, descripción..." value={busqueda} onChange={(e) => setBusqueda(e.target.value)} />
          </div>
          <div className="fg" style={{ maxWidth: 130 }}>
            <label>Desde</label>
            <input type="date" value={filtroDesde} onChange={(e) => setFiltroDesde(e.target.value)} />
          </div>
          <div className="fg" style={{ maxWidth: 130 }}>
            <label>Hasta</label>
            <input type="date" value={filtroHasta} onChange={(e) => setFiltroHasta(e.target.value)} />
          </div>
          <div className="fg" style={{ maxWidth: 160 }}>
            <label>Área</label>
            <select value={filtroArea} onChange={(e) => setFiltroArea(e.target.value)}>
              <option value="">Todas</option>
              {areas.map((a) => <option key={a.id} value={a.nombre}>{a.nombre}</option>)}
            </select>
          </div>
          <div className="fg" style={{ maxWidth: 160 }}>
            <label>Estado</label>
            <select value={filtroEstado} onChange={(e) => setFiltroEstado(e.target.value)}>
              <option value="">Todos</option>
              <option value="PENDIENTE">Pendiente</option>
              <option value="ATENDIDO_PARCIAL">Atendido parcial</option>
              <option value="ATENDIDO_TOTAL">Atendido total</option>
              <option value="NO_ATENDIDO">No atendido</option>
            </select>
          </div>
          <button className="btn" onClick={limpiar}><IconSearch size={13} /> Limpiar</button>
          <button className="btn" onClick={exportarExcel}><IconFileSpreadsheet size={13} /> Exportar Excel</button>
          <a href="/requerimientos/nuevo" className="btn btn-p" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <IconPlus size={13} /> Nuevo requerimiento
          </a>
        </div>
      </div>

      {/* Tabla */}
      <div className="tc">
        <div style={{ padding: '11px 15px', borderBottom: '1px solid var(--bl)' }}>
          <span style={{ fontSize: 13, fontWeight: 600 }}>
            Requerimientos registrados
            {filtrados.length !== requerimientos.length
              ? ` · ${filtrados.length} de ${requerimientos.length}`
              : ` · ${requerimientos.length}`}
          </span>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table>
            <thead>
              <tr>
                <SortableTh label="Fecha" sortKey="fecha" activeKey={sortKey} dir={sortDir} onSort={toggleSort} />
                <SortableTh label="Área" sortKey="area" activeKey={sortKey} dir={sortDir} onSort={toggleSort} />
                <SortableTh label="Responsable" sortKey="responsable" activeKey={sortKey} dir={sortDir} onSort={toggleSort} />
                <SortableTh label="Tipo" sortKey="tipo" activeKey={sortKey} dir={sortDir} onSort={toggleSort} />
                <SortableTh label="Prioridad" sortKey="prioridad" activeKey={sortKey} dir={sortDir} onSort={toggleSort} />
                <SortableTh label="Descripción" sortKey="descripcion" activeKey={sortKey} dir={sortDir} onSort={toggleSort} />
                <SortableTh label="Glosa" sortKey="glosa" activeKey={sortKey} dir={sortDir} onSort={toggleSort} />
                <SortableTh label="Generado por" sortKey="creadoPor" activeKey={sortKey} dir={sortDir} onSort={toggleSort} />
                <SortableTh label="Días atraso" sortKey="diasRetraso" activeKey={sortKey} dir={sortDir} onSort={toggleSort} />
                <SortableTh label="Estado" sortKey="estado" activeKey={sortKey} dir={sortDir} onSort={toggleSort} />
                <SortableTh label="Últ. actualización" sortKey="actualizacion" activeKey={sortKey} dir={sortDir} onSort={toggleSort} />
                <th></th>
              </tr>
            </thead>
            <tbody>
              {pageData.length === 0 ? (
                <tr><td colSpan={12} style={{ textAlign: 'center', padding: '32px 0', color: 'var(--t3)' }}>
                  No hay requerimientos
                </td></tr>
              ) : pageData.map((r) => (
                <tr key={r.id}>
                  <td style={{ whiteSpace: 'nowrap' }}>{format(new Date(r.fechaSolicitud), 'dd/MM/yyyy')}</td>
                  <td style={{ fontWeight: 500 }}>{r.area}</td>
                  <td>{r.responsable.nombre}</td>
                  <td><span className="badge badge-blue">{r.tipo === 'COMPRA' ? 'Compra' : 'Servicio'}</span></td>
                  <td>{prioridadBadge(r.prioridad)}</td>
                  <td style={{ maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'var(--t2)' }}>
                    {r.descripcion}
                  </td>
                  <td style={{ maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'var(--t2)' }}>
                    {r.glosa ?? '—'}
                  </td>
                  <td style={{ fontSize: 12, color: 'var(--t2)' }}>{r.creadoPor.nombre}</td>
                  <td>
                    {r.diasRetraso > 0
                      ? <span style={{ fontWeight: 600, color: 'var(--red)' }}>{r.diasRetraso} días</span>
                      : <span style={{ color: 'var(--t3)' }}>—</span>}
                  </td>
                  <td>{estadoBadge(r.estado)}</td>
                  <td style={{ fontSize: 12, color: 'var(--t3)', whiteSpace: 'nowrap' }}>
                    {r.fechaUltimoCambio ? format(new Date(r.fechaUltimoCambio), 'dd/MM/yyyy HH:mm') : '—'}
                  </td>
                  <td>
                    <a href={`/requerimientos/${r.id}`} className="ib"><IconEye size={13} /></a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <Pagination
          page={page}
          totalPages={totalPages}
          totalItems={totalItems}
          pageSize={pageSize}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
        />
      </div>
    </>
  )
}
