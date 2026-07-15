'use client'

import { useState, useMemo, useTransition } from 'react'
import Link from 'next/link'
import { format } from 'date-fns'
import {
  IconAlertTriangle, IconSearch, IconEye, IconTrash,
  IconFileCode, IconPencilPlus, IconRotate, IconChecks, IconX, IconCircleCheck, IconFileSpreadsheet,
} from '@tabler/icons-react'
import { eliminarFactura, toggleRegistroContable } from '@/lib/actions/comprobantes'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { SortableTh } from '@/components/ui/SortableTh'
import { Pagination } from '@/components/ui/Pagination'
import { useTableData, type SortAccessor } from '@/lib/hooks/useTableData'

// ─── Types ───────────────────────────────────────────────────────────────────

export interface FacturaRow {
  id: number
  proveedor: string
  serie: string; numero: string
  fechaVencimiento: Date | string
  moneda: string
  tipo: string
  ordenCompra: string | null
  montoNeto: number
  estado: string
  formaPago: string | null
  semanaPago: number | null
  viernesPago: Date | string | null
  registradoContable: boolean
  fechaRegistroContable: Date | string | null
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const MONEDA_PRE: Record<string, string> = { SOLES: 'S/', DOLARES: '$', EUROS: '€' }
const FORMA_LABEL: Record<string, string> = {
  CREDITO: 'Crédito', FACTORING: 'Factoring',
  FACTURA_NEGOCIABLE: 'Factura negociable', LETRA: 'Letra',
}
const TIPO_LABEL: Record<string, string> = { COMPRA: 'Compra', SERVICIO: 'Servicio' }

function estadoBadgeClass(e: string) {
  return ({ POR_VENCER: 'badge-red', PENDIENTE: 'badge-amber', PAGADA: 'badge-green', VENCIDA: 'badge-red' } as Record<string, string>)[e]
}
function estadoLabel(e: string) {
  return ({ POR_VENCER: 'Por vencer', PENDIENTE: 'Pendiente', PAGADA: 'Pagada', VENCIDA: 'Vencida' } as Record<string, string>)[e]
}

// ─── Toggle contable inline ───────────────────────────────────────────────────

function ToggleContable({ factura, onToggle }: {
  factura: FacturaRow
  onToggle: () => void
}) {
  if (factura.registradoContable) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <div className="ctog-track on" onClick={onToggle}>
          <div className="ctog-knob" />
        </div>
        <span style={{ fontSize: 11, color: 'var(--green-t)', fontFamily: 'var(--fm)' }}>
          ✓ {factura.fechaRegistroContable
            ? format(new Date(factura.fechaRegistroContable), 'dd/MM/yyyy')
            : ''}
        </span>
        <button
          className="ib"
          title="Deshacer"
          onClick={(e) => { e.stopPropagation(); onToggle() }}
          style={{ width: 22, height: 22 }}
        >
          <IconRotate size={11} />
        </button>
      </div>
    )
  }
  return (
    <div
      style={{ display: 'flex', alignItems: 'center', gap: 7, cursor: 'pointer' }}
      onClick={onToggle}
    >
      <div className="ctog-track"><div className="ctog-knob" /></div>
      <span style={{ fontSize: 11, color: 'var(--t3)' }}>Pendiente · registrar</span>
    </div>
  )
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export function ComprobantesView({ facturas: initial }: { facturas: FacturaRow[] }) {
  const [, startTransition]          = useTransition()
  const [facturas, setFacturas]      = useState(initial)
  const [selected, setSelected]      = useState<number[]>([])

  // Filtros
  const [busqueda,       setBusqueda]       = useState('')
  const [filtroOrden,    setFiltroOrden]    = useState('')
  const [filtroTipo,     setFiltroTipo]     = useState('')
  const [filtroEstado,   setFiltroEstado]   = useState('')
  const [filtroDesde,    setFiltroDesde]    = useState('')
  const [filtroHasta,    setFiltroHasta]    = useState('')
  const [filtroSemana,   setFiltroSemana]   = useState('')
  const [filtroContable, setFiltroContable] = useState('')

  // Eliminar
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [confirmId,   setConfirmId]   = useState<number | null>(null)

  const vencidas   = facturas.filter((f) => f.estado === 'VENCIDA')
  const sinContable = facturas.filter((f) => !f.registradoContable).length

  const filtradas = useMemo(() => {
    let r = facturas

    if (busqueda) {
      const q = busqueda.toLowerCase()
      r = r.filter((f) =>
        f.proveedor.toLowerCase().includes(q) ||
        `${f.serie}-${f.numero}`.toLowerCase().includes(q)
      )
    }
    if (filtroOrden) {
      const q = filtroOrden.toLowerCase()
      r = r.filter((f) => f.ordenCompra?.toLowerCase().includes(q))
    }
    if (filtroTipo)   r = r.filter((f) => f.tipo === filtroTipo)
    if (filtroEstado) r = r.filter((f) => f.estado === filtroEstado)
    if (filtroDesde)  r = r.filter((f) => new Date(f.fechaVencimiento) >= new Date(filtroDesde))
    if (filtroHasta) {
      const h = new Date(filtroHasta); h.setHours(23, 59, 59, 999)
      r = r.filter((f) => new Date(f.fechaVencimiento) <= h)
    }
    if (filtroSemana) {
      const sem = parseInt(filtroSemana)
      if (!isNaN(sem)) r = r.filter((f) => f.semanaPago === sem)
    }
    if (filtroContable === 'pendiente')   r = r.filter((f) => !f.registradoContable)
    if (filtroContable === 'registrado')  r = r.filter((f) => f.registradoContable)

    return r
  }, [facturas, busqueda, filtroOrden, filtroTipo, filtroEstado, filtroDesde, filtroHasta, filtroSemana, filtroContable])

  const sortAccessors = useMemo<Record<string, SortAccessor<FacturaRow>>>(() => ({
    numero:          (f) => `${f.serie}-${f.numero}`,
    proveedor:       (f) => f.proveedor,
    tipo:            (f) => TIPO_LABEL[f.tipo] ?? f.tipo,
    ordenCompra:     (f) => f.ordenCompra ?? '',
    fechaVencimiento:(f) => new Date(f.fechaVencimiento),
    moneda:          (f) => f.moneda,
    monto:           (f) => f.montoNeto,
    semanaPago:      (f) => f.semanaPago ?? -1,
    formaPago:       (f) => f.formaPago ? FORMA_LABEL[f.formaPago] : '',
    estado:          (f) => f.estado,
    contable:        (f) => f.registradoContable ? 1 : 0,
  }), [])

  const {
    sortKey, sortDir, toggleSort,
    page, setPage, pageSize, setPageSize,
    pageData, totalItems, totalPages,
  } = useTableData(filtradas, sortAccessors, 20)

  function limpiarFiltros() {
    setBusqueda(''); setFiltroOrden(''); setFiltroTipo(''); setFiltroEstado(''); setFiltroDesde('')
    setFiltroHasta(''); setFiltroSemana(''); setFiltroContable('')
  }

  function exportarExcel() {
    const params = new URLSearchParams()
    if (busqueda)       params.set('q', busqueda)
    if (filtroOrden)    params.set('orden', filtroOrden)
    if (filtroTipo)     params.set('tipo', filtroTipo)
    if (filtroEstado)   params.set('estado', filtroEstado)
    if (filtroDesde)    params.set('desde', filtroDesde)
    if (filtroHasta)    params.set('hasta', filtroHasta)
    if (filtroSemana)   params.set('semana', filtroSemana)
    if (filtroContable) params.set('contable', filtroContable)
    window.location.href = `/api/comprobantes/export?${params.toString()}`
  }

  function toggleContable(id: number) {
    const f = facturas.find((x) => x.id === id)
    if (!f) return
    const newVal = !f.registradoContable
    setFacturas((prev) => prev.map((x) =>
      x.id === id
        ? { ...x, registradoContable: newVal, fechaRegistroContable: newVal ? new Date() : null }
        : x
    ))
    startTransition(() => { toggleRegistroContable(id, newVal) })
  }

  function toggleSel(id: number) {
    setSelected((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id])
  }

  function registrarSeleccionadas() {
    const hoy = new Date()
    const toRegister = selected.filter((id) => !facturas.find((f) => f.id === id)?.registradoContable)
    setFacturas((prev) => prev.map((f) =>
      selected.includes(f.id) && !f.registradoContable
        ? { ...f, registradoContable: true, fechaRegistroContable: hoy }
        : f
    ))
    setSelected([])
    startTransition(async () => {
      await Promise.all(toRegister.map((id) => toggleRegistroContable(id, true)))
    })
  }

  function pedirConfirmacion(id: number) {
    setConfirmId(id); setConfirmOpen(true)
  }

  function handleEliminar() {
    if (!confirmId) return
    const id = confirmId
    setConfirmOpen(false)
    setConfirmId(null)
    startTransition(async () => {
      const res = await eliminarFactura(id)
      if (res.ok) setFacturas((prev) => prev.filter((f) => f.id !== id))
    })
  }

  const hayFiltros = busqueda || filtroOrden || filtroTipo || filtroEstado || filtroDesde || filtroHasta || filtroSemana || filtroContable

  return (
    <>
      {/* Alert vencidas */}
      {vencidas.length > 0 && (
        <div className="alert-warn">
          <IconAlertTriangle size={16} style={{ color: 'var(--amber)', flexShrink: 0, marginTop: 1 }} />
          <span>
            <strong>{vencidas.length} factura{vencidas.length > 1 ? 's' : ''} vencida{vencidas.length > 1 ? 's' : ''}</strong>
            {' '}sin pago registrado. Notificación enviada.
          </span>
        </div>
      )}

      {/* Filtros */}
      <div className="fc">
        <div style={{ display: 'flex', gap: 9, flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div className="fg">
            <label>Proveedor / N° factura</label>
            <input type="text" placeholder="Buscar..." value={busqueda} onChange={(e) => setBusqueda(e.target.value)} />
          </div>
          <div className="fg" style={{ maxWidth: 130 }}>
            <label>Desde</label>
            <input type="date" value={filtroDesde} onChange={(e) => setFiltroDesde(e.target.value)} />
          </div>
          <div className="fg" style={{ maxWidth: 130 }}>
            <label>Hasta</label>
            <input type="date" value={filtroHasta} onChange={(e) => setFiltroHasta(e.target.value)} />
          </div>
          <div className="fg" style={{ maxWidth: 110 }}>
            <label>Semana pago</label>
            <input type="number" placeholder="20" min={1} max={53} value={filtroSemana} onChange={(e) => setFiltroSemana(e.target.value)} />
          </div>
          <div className="fg" style={{ maxWidth: 150 }}>
            <label>N° orden compra</label>
            <input type="text" placeholder="Buscar orden..." value={filtroOrden} onChange={(e) => setFiltroOrden(e.target.value)} />
          </div>
          <div className="fg" style={{ maxWidth: 130 }}>
            <label>Tipo</label>
            <select value={filtroTipo} onChange={(e) => setFiltroTipo(e.target.value)}>
              <option value="">Todos</option>
              <option value="COMPRA">Compra</option>
              <option value="SERVICIO">Servicio</option>
            </select>
          </div>
          <div className="fg" style={{ maxWidth: 140 }}>
            <label>Estado</label>
            <select value={filtroEstado} onChange={(e) => setFiltroEstado(e.target.value)}>
              <option value="">Todos</option>
              <option value="POR_VENCER">Por vencer</option>
              <option value="PENDIENTE">Pendiente</option>
              <option value="PAGADA">Pagada</option>
              <option value="VENCIDA">Vencida</option>
            </select>
          </div>
          <div className="fg" style={{ maxWidth: 150 }}>
            <label>Reg. contable</label>
            <select value={filtroContable} onChange={(e) => setFiltroContable(e.target.value)}>
              <option value="">Todos</option>
              <option value="pendiente">Pendiente</option>
              <option value="registrado">Registrado</option>
            </select>
          </div>
          {hayFiltros && (
            <button className="btn" onClick={limpiarFiltros}>
              <IconSearch size={13} /> Limpiar
            </button>
          )}
        </div>
        {hayFiltros && filtradas.length !== facturas.length && (
          <div style={{ fontSize: 12, color: 'var(--t3)', marginTop: 8 }}>
            Mostrando {filtradas.length} de {facturas.length} facturas
          </div>
        )}
      </div>

      {/* Métricas */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(125px,1fr))', gap: 11, marginBottom: 16 }}>
        <div className="mc">
          <div className="mc-label">Total facturas</div>
          <div className="mc-value b">{facturas.length}</div>
        </div>
        <div className="mc">
          <div className="mc-label">Por vencer</div>
          <div className="mc-value r">{facturas.filter((f) => f.estado === 'POR_VENCER').length}</div>
        </div>
        <div className="mc">
          <div className="mc-label">Pendientes contable</div>
          <div className="mc-value a">{sinContable}</div>
        </div>
        <div className="mc">
          <div className="mc-label">Pagadas</div>
          <div className="mc-value g">{facturas.filter((f) => f.estado === 'PAGADA').length}</div>
        </div>
      </div>

      {/* Barra selección masiva */}
      {selected.length > 0 && (
        <div style={{
          background: 'var(--blue-bg)', border: '1px solid #B5D4F4',
          borderRadius: 'var(--rm)', padding: '9px 14px', marginBottom: 12,
          display: 'flex', alignItems: 'center', gap: 12,
          fontSize: 13, color: 'var(--blue-t)',
        }}>
          <IconChecks size={16} />
          <span>
            {selected.length} factura{selected.length > 1 ? 's' : ''} seleccionada{selected.length > 1 ? 's' : ''}
          </span>
          <button className="btn btn-sm btn-g" style={{ marginLeft: 'auto' }} onClick={registrarSeleccionadas}>
            <IconCircleCheck size={12} /> Registrar contablemente
          </button>
          <button className="btn btn-sm" onClick={() => setSelected([])}>
            <IconX size={12} />
          </button>
        </div>
      )}

      {/* Tabla */}
      <div className="tc">
        <div style={{
          padding: '11px 15px', borderBottom: '1px solid var(--bl)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <span style={{ fontSize: 13, fontWeight: 600 }}>Facturas registradas</span>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-sm" onClick={exportarExcel}>
              <IconFileSpreadsheet size={13} /> Exportar Excel
            </button>
            <Link href="/comprobantes/nuevo-manual">
              <button className="btn btn-sm">
                <IconPencilPlus size={13} /> Registro manual
              </button>
            </Link>
            <Link href="/comprobantes/nuevo">
              <button className="btn btn-sm">
                <IconFileCode size={13} /> Importar XML
              </button>
            </Link>
          </div>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table>
            <thead>
              <tr>
                <th style={{ width: 36 }}>
                  <input
                    type="checkbox"
                    checked={selected.length === pageData.length && pageData.length > 0}
                    onChange={(e) => setSelected(e.target.checked ? pageData.map((f) => f.id) : [])}
                  />
                </th>
                <SortableTh label="N° Factura" sortKey="numero" activeKey={sortKey} dir={sortDir} onSort={toggleSort} />
                <SortableTh label="Proveedor" sortKey="proveedor" activeKey={sortKey} dir={sortDir} onSort={toggleSort} />
                <SortableTh label="Tipo" sortKey="tipo" activeKey={sortKey} dir={sortDir} onSort={toggleSort} />
                <SortableTh label="Orden compra" sortKey="ordenCompra" activeKey={sortKey} dir={sortDir} onSort={toggleSort} />
                <SortableTh label="F. Vencimiento" sortKey="fechaVencimiento" activeKey={sortKey} dir={sortDir} onSort={toggleSort} />
                <SortableTh label="Moneda" sortKey="moneda" activeKey={sortKey} dir={sortDir} onSort={toggleSort} />
                <SortableTh label="Monto a pagar" sortKey="monto" activeKey={sortKey} dir={sortDir} onSort={toggleSort} />
                <SortableTh label="Semana pago" sortKey="semanaPago" activeKey={sortKey} dir={sortDir} onSort={toggleSort} />
                <SortableTh label="Forma pago" sortKey="formaPago" activeKey={sortKey} dir={sortDir} onSort={toggleSort} />
                <SortableTh label="Estado" sortKey="estado" activeKey={sortKey} dir={sortDir} onSort={toggleSort} />
                <SortableTh label="✓ Registro contable" sortKey="contable" activeKey={sortKey} dir={sortDir} onSort={toggleSort} style={{ minWidth: 210 }} />
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {pageData.length === 0 ? (
                <tr>
                  <td colSpan={13} style={{ textAlign: 'center', padding: '40px 0', color: 'var(--t3)' }}>
                    No hay facturas registradas
                  </td>
                </tr>
              ) : pageData.map((f) => (
                <tr
                  key={f.id}
                  style={{ background: selected.includes(f.id) ? 'var(--blue-bg)' : undefined }}
                >
                  <td style={{ textAlign: 'center' }}>
                    <input
                      type="checkbox"
                      checked={selected.includes(f.id)}
                      onChange={() => toggleSel(f.id)}
                    />
                  </td>
                  <td>
                    <span style={{ fontFamily: 'var(--fm)', fontSize: 12 }}>
                      {f.serie}-{f.numero}
                    </span>
                  </td>
                  <td style={{ maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {f.proveedor}
                  </td>
                  <td>
                    <span className={`badge ${f.tipo === 'COMPRA' ? 'badge-blue' : 'badge-slate'}`}>
                      {TIPO_LABEL[f.tipo] ?? f.tipo}
                    </span>
                  </td>
                  <td>
                    {f.ordenCompra
                      ? <span style={{ fontFamily: 'var(--fm)', fontSize: 12 }}>{f.ordenCompra}</span>
                      : <span style={{ color: 'var(--t3)' }}>—</span>}
                  </td>
                  <td>{format(new Date(f.fechaVencimiento), 'dd/MM/yyyy')}</td>
                  <td>
                    <span className="badge badge-slate">
                      {f.moneda === 'SOLES' ? 'PEN' : f.moneda === 'DOLARES' ? 'USD' : 'EUR'}
                    </span>
                  </td>
                  <td style={{ fontWeight: 600 }}>
                    {MONEDA_PRE[f.moneda]}{' '}
                    {f.montoNeto.toLocaleString('es-PE', { minimumFractionDigits: 2 })}
                  </td>
                  <td>
                    {f.semanaPago && f.viernesPago ? (
                      <span className="stag">
                        Sem.{f.semanaPago} · Vie {format(new Date(f.viernesPago), 'dd/MM')}
                      </span>
                    ) : (
                      <span style={{ color: 'var(--t3)' }}>—</span>
                    )}
                  </td>
                  <td>{f.formaPago ? FORMA_LABEL[f.formaPago] : '—'}</td>
                  <td>
                    <span className={`badge ${estadoBadgeClass(f.estado)}`}>
                      {estadoLabel(f.estado)}
                    </span>
                  </td>
                  <td>
                    <ToggleContable factura={f} onToggle={() => toggleContable(f.id)} />
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 4 }}>
                      <Link href={`/comprobantes/${f.id}`}>
                        <button className="ib" title="Ver detalle"><IconEye size={13} /></button>
                      </Link>
                      <button
                        className="ib ib-danger"
                        title="Eliminar"
                        onClick={() => pedirConfirmacion(f.id)}
                      >
                        <IconTrash size={13} />
                      </button>
                    </div>
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

      {/* Confirm eliminar */}
      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Eliminar factura"
        description="¿Estás seguro que deseas eliminar esta factura? Se eliminarán también las notas de crédito y débito asociadas. Esta acción no se puede deshacer."
        confirmLabel="Eliminar"
        cancelLabel="Cancelar"
        variant="danger"
        onConfirm={handleEliminar}
      />
    </>
  )
}
