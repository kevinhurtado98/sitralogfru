'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { format } from 'date-fns'
import {
  IconAlertTriangle, IconSearch, IconEye, IconPencil, IconTrash,
  IconFileCode, IconRotate, IconChecks, IconX, IconCircleCheck,
} from '@tabler/icons-react'
import type { EstadoFactura, Moneda, FormaPago } from '@/lib/types'

// ─── Types ───────────────────────────────────────────────────────────────────

export interface FacturaRow {
  id: string
  proveedor: string
  serie: string; numero: string
  fechaVencimiento: Date | string
  moneda: Moneda
  montoNeto: number
  estado: EstadoFactura
  formaPago: FormaPago | null
  semanaPago: number | null
  viernesPago: Date | string | null
  registradoContable: boolean
  fechaRegistroContable: Date | string | null
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const MONEDA_PRE: Record<Moneda, string> = { SOLES: 'S/', DOLARES: '$', EUROS: '€' }
const FORMA_LABEL: Record<FormaPago, string> = {
  CREDITO: 'Crédito', FACTORING: 'Factoring',
  FACTURA_NEGOCIABLE: 'Factura negociable', LETRA: 'Letra',
}

function estadoBadgeClass(e: EstadoFactura) {
  return { POR_VENCER: 'badge-red', PENDIENTE: 'badge-amber', PAGADA: 'badge-green', VENCIDA: 'badge-red' }[e]
}
function estadoLabel(e: EstadoFactura) {
  return { POR_VENCER: 'Por vencer', PENDIENTE: 'Pendiente', PAGADA: 'Pagada', VENCIDA: 'Vencida' }[e]
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
  const [facturas, setFacturas]     = useState(initial)
  const [selected, setSelected]     = useState<string[]>([])
  const [busqueda, setBusqueda]     = useState('')
  const [filtroEstado, setFiltroEstado] = useState('')

  const vencidas = facturas.filter((f) => f.estado === 'VENCIDA')
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
    if (filtroEstado) r = r.filter((f) => f.estado === filtroEstado)
    return r
  }, [facturas, busqueda, filtroEstado])

  function toggleContable(id: string) {
    setFacturas((prev) => prev.map((f) =>
      f.id === id
        ? {
            ...f,
            registradoContable: !f.registradoContable,
            fechaRegistroContable: !f.registradoContable ? new Date() : null,
          }
        : f
    ))
  }

  function toggleSel(id: string) {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    )
  }

  function registrarSeleccionadas() {
    const hoy = new Date()
    setFacturas((prev) => prev.map((f) =>
      selected.includes(f.id) && !f.registradoContable
        ? { ...f, registradoContable: true, fechaRegistroContable: hoy }
        : f
    ))
    setSelected([])
  }

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
            <input
              type="text"
              placeholder="Buscar..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
            />
          </div>
          <div className="fg" style={{ maxWidth: 130 }}>
            <label>Desde</label>
            <input type="date" />
          </div>
          <div className="fg" style={{ maxWidth: 130 }}>
            <label>Hasta</label>
            <input type="date" />
          </div>
          <div className="fg" style={{ maxWidth: 130 }}>
            <label>Semana pago</label>
            <input type="text" placeholder="Sem. 20" />
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
            <select>
              <option value="">Todos</option>
              <option value="pendiente">Pendiente</option>
              <option value="registrado">Registrado</option>
            </select>
          </div>
          <button className="btn btn-p">
            <IconSearch size={13} /> Filtrar
          </button>
        </div>
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
          <div className="mc-label">Pagadas este mes</div>
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
          <button
            className="btn btn-sm btn-g"
            style={{ marginLeft: 'auto' }}
            onClick={registrarSeleccionadas}
          >
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
          padding: '11px 15px',
          borderBottom: '1px solid var(--bl)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <span style={{ fontSize: 13, fontWeight: 600 }}>Facturas registradas</span>
          <Link href="/comprobantes/nuevo">
            <button className="btn btn-sm">
              <IconFileCode size={13} /> Importar XML
            </button>
          </Link>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table>
            <thead>
              <tr>
                <th style={{ width: 36 }}>
                  <input
                    type="checkbox"
                    checked={selected.length === filtradas.length && filtradas.length > 0}
                    onChange={(e) => setSelected(e.target.checked ? filtradas.map((f) => f.id) : [])}
                  />
                </th>
                <th>N° Factura</th>
                <th>Proveedor</th>
                <th>F. Vencimiento</th>
                <th>Moneda</th>
                <th>Monto a pagar</th>
                <th>Semana pago</th>
                <th>Forma pago</th>
                <th>Estado</th>
                <th style={{ minWidth: 210 }}>✓ Registro contable</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filtradas.length === 0 ? (
                <tr>
                  <td colSpan={11} style={{ textAlign: 'center', padding: '40px 0', color: 'var(--t3)' }}>
                    No hay facturas registradas
                  </td>
                </tr>
              ) : filtradas.map((f) => (
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
                    <ToggleContable
                      factura={f}
                      onToggle={() => toggleContable(f.id)}
                    />
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 4 }}>
                      <Link href={`/comprobantes/${f.id}`}>
                        <button className="ib" title="Ver detalle">
                          <IconEye size={13} />
                        </button>
                      </Link>
                      <button className="ib" title="Editar">
                        <IconPencil size={13} />
                      </button>
                      <button className="ib ib-danger" title="Eliminar">
                        <IconTrash size={13} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  )
}
