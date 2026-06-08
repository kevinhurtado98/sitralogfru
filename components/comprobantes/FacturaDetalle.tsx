'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { format } from 'date-fns'
import { IconArrowLeft, IconDeviceFloppy, IconCircleCheck, IconFileMinus, IconFilePlus, IconCheck } from '@tabler/icons-react'
import type { TipoFactura, FormaPago } from '@/lib/types'
import { actualizarFactura, marcarComoPagada } from '@/lib/actions/comprobantes'

// ─── Types ───────────────────────────────────────────────────────────────────

interface NotaDoc {
  id: number; serie: string; numero: string
  monto: number; descripcion: string | null; fecha: Date | string
}

interface FacturaFull {
  id: number
  proveedor: string; rucProveedor: string | null
  serie: string; numero: string
  fechaEmision: Date | string; fechaVencimiento: Date | string
  moneda: string; tipo: string
  monto: number; retencion: number; detraccion: number; montoNeto: number
  estado: string
  formaPago: string | null
  ordenCompra: string | null
  fechaRegistroContable: Date | string | null
  registradoContable: boolean
  semanaPago: number | null; viernesPago: Date | string | null
  notas: string | null
  notasCredito: NotaDoc[]; notasDebito: NotaDoc[]
  creadoPor: { nombre: string; email: string }
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const MONEDA_PRE: Record<string, string> = { SOLES: 'S/', DOLARES: '$', EUROS: '€' }
const MONEDA_LABEL: Record<string, string> = { SOLES: 'Soles (PEN)', DOLARES: 'Dólares (USD)', EUROS: 'Euros (EUR)' }
const ESTADO_BADGE: Record<string, string> = {
  POR_VENCER: 'badge-red', PENDIENTE: 'badge-amber', PAGADA: 'badge-green', VENCIDA: 'badge-red',
}
const ESTADO_LABEL: Record<string, string> = {
  POR_VENCER: 'Por vencer', PENDIENTE: 'Pendiente', PAGADA: 'Pagada', Vencida: 'Vencida', VENCIDA: 'Vencida',
}

function fmt(v: Date | string | null | undefined) {
  return v ? format(new Date(v), 'dd/MM/yyyy') : '—'
}

function fmtInput(v: Date | string | null | undefined) {
  return v ? format(new Date(v), 'yyyy-MM-dd') : ''
}

// ─── Field read-only ─────────────────────────────────────────────────────────

function Field({ label, value, mono, color, big }: {
  label: string; value: string; mono?: boolean; color?: string; big?: boolean
}) {
  return (
    <div className="fi" style={{ gap: 3 }}>
      <label>{label}</label>
      <div style={{
        fontSize: big ? 17 : 14, fontWeight: 500,
        fontFamily: mono ? 'var(--fm)' : undefined,
        color: color ?? 'var(--t1)',
        paddingTop: 2,
      }}>
        {value}
      </div>
    </div>
  )
}

// ─── Component ───────────────────────────────────────────────────────────────

export function FacturaDetalle({ factura: f }: { factura: FacturaFull }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const [tipo,                  setTipo]                  = useState<TipoFactura>(f.tipo as TipoFactura)
  const [formaPago,             setFormaPago]             = useState<FormaPago | ''>((f.formaPago ?? '') as FormaPago | '')
  const [ordenCompra,           setOrdenCompra]           = useState(f.ordenCompra ?? '')
  const [notas,                 setNotas]                 = useState(f.notas ?? '')
  const [registradoContable,    setRegistradoContable]    = useState(f.registradoContable)
  const [fechaRegistroContable, setFechaRegistroContable] = useState(fmtInput(f.fechaRegistroContable))
  const [estado,                setEstado]                = useState(f.estado)
  const [feedback,              setFeedback]              = useState<{ ok: boolean; msg: string } | null>(null)

  function handleGuardar() {
    setFeedback(null)
    startTransition(async () => {
      const res = await actualizarFactura(f.id, {
        tipo,
        formaPago:             formaPago || null,
        ordenCompra,
        notas,
        registradoContable,
        fechaRegistroContable: registradoContable ? (fechaRegistroContable || null) : null,
      })
      if (res.ok) {
        setFeedback({ ok: true, msg: 'Cambios guardados correctamente.' })
      } else {
        setFeedback({ ok: false, msg: res.error })
      }
    })
  }

  function handleMarcarPagada() {
    setFeedback(null)
    startTransition(async () => {
      const res = await marcarComoPagada(f.id)
      if (res.ok) {
        setEstado('PAGADA')
        setFeedback({ ok: true, msg: 'Factura marcada como pagada.' })
        router.refresh()
      } else {
        setFeedback({ ok: false, msg: res.error })
      }
    })
  }

  function handleToggleContable() {
    const newVal = !registradoContable
    setRegistradoContable(newVal)
    if (newVal && !fechaRegistroContable) {
      setFechaRegistroContable(format(new Date(), 'yyyy-MM-dd'))
    }
    if (!newVal) setFechaRegistroContable('')
  }

  return (
    <div>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 16 }}>
        <Link href="/comprobantes">
          <button className="btn btn-sm"><IconArrowLeft size={13} /> Volver</button>
        </Link>
        <span style={{ fontSize: 13, color: 'var(--t2)' }}>
          Factura <span style={{ fontFamily: 'var(--fm)' }}>{f.serie}-{f.numero}</span> · {f.proveedor}
        </span>
        <span className={`badge ${ESTADO_BADGE[estado]}`} style={{ marginLeft: 'auto' }}>
          {ESTADO_LABEL[estado] ?? estado}
        </span>
      </div>

      {/* Feedback */}
      {feedback && (
        <div style={{
          padding: '8px 12px', borderRadius: 'var(--r)', fontSize: 13, marginBottom: 14,
          background: feedback.ok ? '#f0fdf4' : '#fef2f2',
          color:      feedback.ok ? '#16a34a' : 'var(--red)',
          border:     `1px solid ${feedback.ok ? '#bbf7d0' : '#fecaca'}`,
        }}>
          {feedback.msg}
        </div>
      )}

      {/* Datos importados */}
      <div className="dc">
        <div className="ss">Datos importados automáticamente</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
          <Field label="Proveedor"      value={f.proveedor} />
          <Field label="RUC"            value={f.rucProveedor ?? '—'} mono />
          <Field label="N° Factura"     value={`${f.serie}-${f.numero}`} mono />
          <Field label="Moneda"         value={MONEDA_LABEL[f.moneda]} />
          <Field label="Fecha emisión"  value={fmt(f.fechaEmision)} />
          <Field
            label="Fecha vencimiento"
            value={fmt(f.fechaVencimiento)}
            color={estado !== 'PAGADA' ? 'var(--amber)' : undefined}
          />
          <Field label="Monto total"    value={`${MONEDA_PRE[f.moneda]} ${f.monto.toFixed(2)}`} />
          <Field
            label="Retención (3%)"
            value={`- ${MONEDA_PRE[f.moneda]} ${f.retencion.toFixed(2)}`}
            color="var(--red)"
          />
          {f.detraccion > 0 && (
            <Field
              label="Detracción"
              value={`- ${MONEDA_PRE[f.moneda]} ${f.detraccion.toFixed(2)}`}
              color="var(--red)"
            />
          )}
          <Field
            label="Monto neto a pagar"
            value={`${MONEDA_PRE[f.moneda]} ${f.montoNeto.toFixed(2)}`}
            color="var(--green)"
            big
          />
        </div>
      </div>

      {/* Datos manuales */}
      <div className="dc">
        <div className="ss">Datos de registro manual</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>

          <div className="fi">
            <label>Tipo de compra</label>
            <select value={tipo} onChange={(e) => setTipo(e.target.value as TipoFactura)}>
              <option value="COMPRA">Factura de Compra</option>
              <option value="SERVICIO">Factura de Servicio</option>
            </select>
          </div>

          <div className="fi">
            <label>Forma de pago</label>
            <select value={formaPago} onChange={(e) => setFormaPago(e.target.value as FormaPago | '')}>
              <option value="">— Sin asignar —</option>
              <option value="CREDITO">Crédito</option>
              <option value="FACTORING">Factoring</option>
              <option value="FACTURA_NEGOCIABLE">Factura negociable</option>
              <option value="LETRA">Letra</option>
            </select>
          </div>

          <div className="fi">
            <label>N° Orden de compra (OCO)</label>
            <input
              type="text"
              value={ordenCompra}
              onChange={(e) => setOrdenCompra(e.target.value)}
              placeholder="OCO 2026-000000"
              style={{ fontFamily: 'var(--fm)' }}
            />
          </div>

          <div className="fi">
            <label>Semana de pago</label>
            <div style={{ paddingTop: 6 }}>
              {f.semanaPago && f.viernesPago ? (
                <span className="stag">
                  Sem.{f.semanaPago} · Vie {format(new Date(f.viernesPago), 'dd/MM/yyyy')}
                </span>
              ) : (
                <span style={{ fontSize: 13, color: 'var(--t3)' }}>—</span>
              )}
            </div>
          </div>

          {/* Registro contable */}
          <div className="fi">
            <label>Fecha registro contable</label>
            <input
              type="date"
              value={fechaRegistroContable}
              onChange={(e) => { setFechaRegistroContable(e.target.value); if (e.target.value) setRegistradoContable(true) }}
            />
          </div>

          <div className="fi">
            <label>Registro contable</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, paddingTop: 6 }}>
              <div
                className={`ctog-track${registradoContable ? ' on' : ''}`}
                onClick={handleToggleContable}
                style={{ cursor: 'pointer' }}
              >
                <div className="ctog-knob" />
              </div>
              <span style={{ fontSize: 12, color: registradoContable ? '#16a34a' : 'var(--t3)' }}>
                {registradoContable ? <><IconCheck size={11} style={{ display: 'inline', verticalAlign: 'middle' }} /> Registrado</> : '✗ Pendiente'}
              </span>
            </div>
          </div>

          <div className="fi" style={{ gridColumn: '1 / -1' }}>
            <label>Notas internas</label>
            <textarea
              value={notas}
              onChange={(e) => setNotas(e.target.value)}
              placeholder="Observaciones, comentarios..."
              rows={3}
            />
          </div>
        </div>
      </div>

      {/* Documentos enlazados */}
      <div className="dc">
        <div className="ss">Documentos enlazados</div>
        <div style={{ display: 'flex', gap: 9, flexWrap: 'wrap', marginBottom: 12 }}>
          <button className="btn btn-sm"><IconFileMinus size={13} /> Nota de crédito</button>
          <button className="btn btn-sm"><IconFilePlus size={13} /> Nota de débito</button>
        </div>

        {f.notasCredito.length === 0 && f.notasDebito.length === 0 ? (
          <div style={{
            background: 'var(--bg2)', borderRadius: 'var(--rm)',
            padding: '9px 12px', fontSize: 12, color: 'var(--t3)',
          }}>
            Sin documentos enlazados.
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--bl)' }}>
                {['Tipo', 'N°', 'Monto', 'Fecha'].map((h) => (
                  <th key={h} style={{ padding: '6px 10px', textAlign: 'left', fontSize: 11, fontWeight: 500, color: 'var(--t2)', textTransform: 'uppercase' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {f.notasCredito.map((n) => (
                <tr key={n.id} style={{ borderBottom: '1px solid var(--bl)' }}>
                  <td style={{ padding: '7px 10px', color: 'var(--green)', fontWeight: 600 }}>NC</td>
                  <td style={{ padding: '7px 10px', fontFamily: 'var(--fm)' }}>{n.serie}-{n.numero}</td>
                  <td style={{ padding: '7px 10px' }}>{MONEDA_PRE[f.moneda]} {n.monto.toFixed(2)}</td>
                  <td style={{ padding: '7px 10px' }}>{fmt(n.fecha)}</td>
                </tr>
              ))}
              {f.notasDebito.map((n) => (
                <tr key={n.id} style={{ borderBottom: '1px solid var(--bl)' }}>
                  <td style={{ padding: '7px 10px', color: 'var(--red)', fontWeight: 600 }}>ND</td>
                  <td style={{ padding: '7px 10px', fontFamily: 'var(--fm)' }}>{n.serie}-{n.numero}</td>
                  <td style={{ padding: '7px 10px' }}>{MONEDA_PRE[f.moneda]} {n.monto.toFixed(2)}</td>
                  <td style={{ padding: '7px 10px' }}>{fmt(n.fecha)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Acciones */}
      <div style={{ display: 'flex', gap: 9, justifyContent: 'flex-end', paddingBottom: 6 }}>
        <button
          className="btn"
          onClick={handleGuardar}
          disabled={isPending}
        >
          <IconDeviceFloppy size={13} /> {isPending ? 'Guardando...' : 'Guardar cambios'}
        </button>
        <button
          className="btn btn-g"
          onClick={handleMarcarPagada}
          disabled={!registradoContable || estado === 'PAGADA' || isPending}
          title={!registradoContable ? 'Registra contablemente antes de marcar como pagada' : undefined}
        >
          <IconCircleCheck size={13} /> {estado === 'PAGADA' ? '✓ Pagada' : 'Marcar como pagada'}
        </button>
      </div>

    </div>
  )
}
