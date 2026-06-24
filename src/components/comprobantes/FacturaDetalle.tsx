'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { format, getISOWeek } from 'date-fns'
import * as Dialog from '@radix-ui/react-dialog'
import { motion, AnimatePresence } from 'motion/react'
import { IconArrowLeft, IconDeviceFloppy, IconCircleCheck, IconFileMinus, IconFilePlus, IconCheck, IconX, IconRefresh } from '@tabler/icons-react'
import type { TipoFactura, FormaPago } from '@/lib/types'
import { actualizarFactura, marcarComoPagada, crearNotaCredito, crearNotaDebito } from '@/lib/actions/comprobantes'
import { calcularSemanaPago } from '@/lib/semana-pago'

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
  fechaPago: Date | string | null
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

// ─── NotaModal ───────────────────────────────────────────────────────────────

const overlayV = { hidden: { opacity: 0 }, show: { opacity: 1 }, exit: { opacity: 0 } }
const dialogV  = {
  hidden: { opacity: 0, scale: 0.96, x: '-50%', y: 'calc(-50% + 10px)' },
  show:   { opacity: 1, scale: 1,    x: '-50%', y: '-50%', transition: { type: 'spring' as const, stiffness: 380, damping: 28 } },
  exit:   { opacity: 0, scale: 0.95, x: '-50%', y: 'calc(-50% + 6px)', transition: { duration: 0.14 } },
}

interface NotaModalProps {
  open:      boolean
  onClose:   () => void
  tipo:      'credito' | 'debito'
  facturaId: number
  moneda:    string
  onSuccess: () => void
}

function NotaModal({ open, onClose, tipo, facturaId, moneda, onSuccess }: NotaModalProps) {
  const [isPending, startTransition] = useTransition()
  const [serie,       setSerie]       = useState('')
  const [numero,      setNumero]      = useState('')
  const [monto,       setMonto]       = useState('')
  const [descripcion, setDescripcion] = useState('')
  const [fecha,       setFecha]       = useState(format(new Date(), 'yyyy-MM-dd'))
  const [error,       setError]       = useState<string | null>(null)

  const MONEDA_PRE: Record<string, string> = { SOLES: 'S/', DOLARES: '$', EUROS: '€' }
  const label = tipo === 'credito' ? 'Nota de Crédito' : 'Nota de Débito'
  const color = tipo === 'credito' ? 'var(--green)' : 'var(--red)'

  function resetAndClose() {
    setSerie(''); setNumero(''); setMonto(''); setDescripcion('')
    setFecha(format(new Date(), 'yyyy-MM-dd')); setError(null)
    onClose()
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    const montoNum = parseFloat(monto)
    if (!serie.trim() || !numero.trim() || isNaN(montoNum) || montoNum <= 0 || !fecha) {
      setError('Serie, número, monto y fecha son obligatorios.')
      return
    }
    const action = tipo === 'credito' ? crearNotaCredito : crearNotaDebito
    startTransition(async () => {
      const res = await action(facturaId, { serie, numero, monto: montoNum, descripcion, fecha })
      if (res.ok) {
        onSuccess()
        resetAndClose()
      } else {
        setError(res.error)
      }
    })
  }

  return (
    <Dialog.Root open={open} onOpenChange={(v) => { if (!v) resetAndClose() }}>
      <AnimatePresence>
        {open && (
          <Dialog.Portal forceMount>
            <Dialog.Overlay asChild forceMount>
              <motion.div variants={overlayV} initial="hidden" animate="show" exit="exit"
                style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 200 }}
              />
            </Dialog.Overlay>
            <Dialog.Content asChild forceMount>
              <motion.div variants={dialogV} initial="hidden" animate="show" exit="exit"
                style={{
                  position: 'fixed', top: '50%', left: '50%', zIndex: 201,
                  background: 'var(--bg)', borderRadius: 'var(--rl)',
                  boxShadow: '0 8px 40px rgba(0,0,0,0.16), 0 1px 3px rgba(0,0,0,0.08)',
                  border: '1px solid var(--bl)',
                  padding: '24px 24px 20px',
                  width: 420, maxWidth: 'calc(100vw - 32px)',
                  outline: 'none',
                }}
              >
                {/* Header */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
                  <Dialog.Title style={{ fontSize: 15, fontWeight: 600, color, margin: 0 }}>
                    {label}
                  </Dialog.Title>
                  <Dialog.Close asChild>
                    <button className="btn btn-sm" style={{ padding: '3px 6px' }}>
                      <IconX size={13} />
                    </button>
                  </Dialog.Close>
                </div>

                {error && (
                  <div style={{
                    padding: '7px 10px', borderRadius: 'var(--r)', fontSize: 12,
                    background: '#fef2f2', color: 'var(--red)', border: '1px solid #fecaca',
                    marginBottom: 14,
                  }}>
                    {error}
                  </div>
                )}

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <div className="fi">
                      <label>Serie *</label>
                      <input
                        type="text" value={serie} onChange={(e) => setSerie(e.target.value)}
                        placeholder="FC01" style={{ fontFamily: 'var(--fm)', textTransform: 'uppercase' }}
                        maxLength={10}
                      />
                    </div>
                    <div className="fi">
                      <label>Número *</label>
                      <input
                        type="text" value={numero} onChange={(e) => setNumero(e.target.value)}
                        placeholder="00000001" style={{ fontFamily: 'var(--fm)' }}
                        maxLength={20}
                      />
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <div className="fi">
                      <label>Monto ({MONEDA_PRE[moneda] ?? moneda}) *</label>
                      <input
                        type="number" value={monto} onChange={(e) => setMonto(e.target.value)}
                        placeholder="0.00" min="0.01" step="0.01"
                      />
                    </div>
                    <div className="fi">
                      <label>Fecha *</label>
                      <input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} />
                    </div>
                  </div>

                  <div className="fi">
                    <label>Descripción</label>
                    <textarea
                      value={descripcion} onChange={(e) => setDescripcion(e.target.value)}
                      placeholder="Motivo o descripción..."
                      rows={2}
                    />
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 4 }}>
                    <Dialog.Close asChild>
                      <button type="button" className="btn" disabled={isPending}>Cancelar</button>
                    </Dialog.Close>
                    <button
                      type="submit" className="btn btn-p" disabled={isPending}
                      style={{ minWidth: 90 }}
                    >
                      {isPending ? 'Guardando...' : `Registrar ${label}`}
                    </button>
                  </div>
                </form>
              </motion.div>
            </Dialog.Content>
          </Dialog.Portal>
        )}
      </AnimatePresence>
    </Dialog.Root>
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
  const [fechaPago,             setFechaPago]             = useState(fmtInput(f.fechaPago) || format(new Date(), 'yyyy-MM-dd'))
  const [fechaVencimiento,      setFechaVencimiento]      = useState(fmtInput(f.fechaVencimiento))
  const [viernesPago,           setViernesPago]           = useState(fmtInput(f.viernesPago))
  const [estado,                setEstado]                = useState(f.estado)
  const [retencion,             setRetencion]             = useState(f.retencion)
  const [detraccion,            setDetraccion]            = useState(f.detraccion)
  const [feedback,              setFeedback]              = useState<{ ok: boolean; msg: string } | null>(null)
  const [notaModal,             setNotaModal]             = useState<'credito' | 'debito' | null>(null)

  const montoNeto = Math.max(0, f.monto - retencion - detraccion)

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
        fechaPago: estado === 'PAGADA' ? (fechaPago || null) : null,
        fechaVencimiento,
        viernesPago: viernesPago || null,
        retencion,
        detraccion,
      })
      if (res.ok) {
        setFeedback({ ok: true, msg: 'Cambios guardados correctamente.' })
        router.refresh()
      } else {
        setFeedback({ ok: false, msg: res.error })
      }
    })
  }

  function recalcularSemana() {
    if (!fechaVencimiento) return
    const { viernesPago: vp } = calcularSemanaPago(new Date(fechaVencimiento))
    setViernesPago(format(vp, 'yyyy-MM-dd'))
  }

  function handleMarcarPagada() {
    setFeedback(null)
    startTransition(async () => {
      const res = await marcarComoPagada(f.id, fechaPago)
      if (res.ok) {
        setEstado('PAGADA')
        setFeedback({ ok: true, msg: `Factura marcada como pagada (${format(new Date(fechaPago), 'dd/MM/yyyy')}).` })
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

          <div className="fi" style={{ gap: 3 }}>
            <label>Fecha vencimiento</label>
            <input
              type="date"
              value={fechaVencimiento}
              onChange={(e) => setFechaVencimiento(e.target.value)}
              style={{ color: estado !== 'PAGADA' ? 'var(--amber)' : undefined }}
            />
          </div>

          <Field label="Monto total" value={`${MONEDA_PRE[f.moneda]} ${f.monto.toFixed(2)}`} />

          <div className="fi" style={{ gap: 3 }}>
            <label>Retención</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: 13, color: 'var(--t3)', flexShrink: 0 }}>
                {MONEDA_PRE[f.moneda]}
              </span>
              <input
                type="number"
                value={retencion}
                onChange={(e) => setRetencion(Math.max(0, parseFloat(e.target.value) || 0))}
                min="0"
                step="0.01"
                style={{ fontFamily: 'var(--fm)', color: retencion > 0 ? 'var(--red)' : undefined }}
              />
            </div>
          </div>

          <div className="fi" style={{ gap: 3 }}>
            <label>Detracción</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: 13, color: 'var(--t3)', flexShrink: 0 }}>
                {MONEDA_PRE[f.moneda]}
              </span>
              <input
                type="number"
                value={detraccion}
                onChange={(e) => setDetraccion(Math.max(0, parseFloat(e.target.value) || 0))}
                min="0"
                step="0.01"
                style={{ fontFamily: 'var(--fm)', color: detraccion > 0 ? 'var(--red)' : undefined }}
              />
            </div>
          </div>

          <div className="fi" style={{ gap: 3 }}>
            <label>Monto neto a pagar</label>
            <div style={{ fontSize: 17, fontWeight: 500, color: 'var(--green)', paddingTop: 2 }}>
              {MONEDA_PRE[f.moneda]} {montoNeto.toFixed(2)}
            </div>
          </div>
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
            <label>Viernes de pago</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <input
                type="date"
                value={viernesPago}
                onChange={(e) => setViernesPago(e.target.value)}
              />
              <button
                type="button"
                className="ib"
                title="Recalcular según fecha de vencimiento"
                onClick={recalcularSemana}
                style={{ flexShrink: 0 }}
              >
                <IconRefresh size={13} />
              </button>
            </div>
            {viernesPago && (
              <span style={{ fontSize: 11, color: 'var(--t3)', marginTop: 3 }}>
                Semana {getISOWeek(new Date(viernesPago))}
              </span>
            )}
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

          {estado === 'PAGADA' && (
            <div className="fi">
              <label>Fecha de pago</label>
              <input
                type="date"
                value={fechaPago}
                onChange={(e) => setFechaPago(e.target.value)}
              />
            </div>
          )}

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
          <button className="btn btn-sm" onClick={() => setNotaModal('credito')}>
            <IconFileMinus size={13} /> Nota de crédito
          </button>
          <button className="btn btn-sm" onClick={() => setNotaModal('debito')}>
            <IconFilePlus size={13} /> Nota de débito
          </button>
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
        {estado !== 'PAGADA' && (
          <input
            type="date"
            value={fechaPago}
            onChange={(e) => setFechaPago(e.target.value)}
            disabled={!registradoContable || isPending}
            title="Fecha de pago (puede adelantarse antes del vencimiento)"
            style={{ width: 140 }}
          />
        )}
        <button
          className="btn btn-g"
          onClick={handleMarcarPagada}
          disabled={!registradoContable || estado === 'PAGADA' || isPending}
          title={!registradoContable ? 'Registra contablemente antes de marcar como pagada' : undefined}
        >
          <IconCircleCheck size={13} /> {estado === 'PAGADA' ? '✓ Pagada' : 'Marcar como pagada'}
        </button>
      </div>

      <NotaModal
        open={notaModal !== null}
        onClose={() => setNotaModal(null)}
        tipo={notaModal ?? 'credito'}
        facturaId={f.id}
        moneda={f.moneda}
        onSuccess={() => {
          router.refresh()
          setFeedback({ ok: true, msg: notaModal === 'credito' ? 'Nota de crédito registrada.' : 'Nota de débito registrada.' })
        }}
      />

    </div>
  )
}
