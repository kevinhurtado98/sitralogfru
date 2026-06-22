'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { format } from 'date-fns'
import * as Dialog from '@radix-ui/react-dialog'
import { motion, AnimatePresence } from 'motion/react'
import { IconArrowLeft, IconCheck, IconX, IconPaperclip, IconPhoto } from '@tabler/icons-react'
import { cambiarEstadoRequerimiento } from '@/lib/actions/requerimientos'
import type { EstadoRequerimiento } from '@/lib/types'

interface HistorialItem {
  id: number
  estado: string
  observacion: string | null
  imagenUrl: string | null
  createdAt: Date | string
  registradoPor: { nombre: string }
}

interface RequerimientoCompleto {
  id:                    number
  fechaSolicitud:        Date
  area:                  string
  prioridad:             string
  tipo:                  string
  descripcion:           string
  estado:                string
  diasRetraso:           number
  fechaEstimadaAtencion: Date | null
  createdAt:             Date
  updatedAt:             Date
  responsable:           { nombre: string; correo: string }
  creadoPor:             { nombre: string }
  atendidoPor:           { nombre: string } | null
  historial:             HistorialItem[]
}

const ESTADOS_OPCIONES: { valor: EstadoRequerimiento; label: string; color: string; bg: string }[] = [
  { valor: 'PENDIENTE',         label: 'Pendiente',         color: '#dc2626', bg: '#fef2f2' },
  { valor: 'ATENDIDO_PARCIAL',  label: 'Atendido parcial',  color: '#ea7316', bg: '#fff7ed' },
  { valor: 'ATENDIDO_TOTAL',    label: 'Atendido total',    color: '#16a34a', bg: '#f0fdf4' },
  { valor: 'GESTION_REALIZADA', label: 'Gestión realizada', color: '#64748b', bg: '#f8fafc' },
]

function estadoBadge(e: string) {
  const map: Record<string, [string, string]> = {
    ATENDIDO_TOTAL:    ['badge-green', 'Atendido total'],
    ATENDIDO_PARCIAL:  ['badge-ora',   'Atendido parcial'],
    PENDIENTE:         ['badge-red',   'Pendiente'],
    NO_ATENDIDO:       ['badge-red',   'No atendido'],
    GESTION_REALIZADA: ['badge-slate', 'Gestión realizada'],
  }
  const [cls, label] = map[e] ?? ['badge-slate', e]
  return <span className={`badge ${cls}`}>{label}</span>
}

// ─── Modal de cambio de estado ────────────────────────────────────────────────

const overlayV = { hidden: { opacity: 0 }, show: { opacity: 1 }, exit: { opacity: 0 } }
const dialogV  = {
  hidden: { opacity: 0, scale: 0.96, x: '-50%', y: 'calc(-50% + 10px)' },
  show:   { opacity: 1, scale: 1,    x: '-50%', y: '-50%', transition: { type: 'spring' as const, stiffness: 380, damping: 28 } },
  exit:   { opacity: 0, scale: 0.95, x: '-50%', y: 'calc(-50% + 6px)', transition: { duration: 0.14 } },
}

interface CambiarEstadoModalProps {
  open:          boolean
  onClose:       () => void
  requerimientoId: number
  nuevoEstado:   { valor: EstadoRequerimiento; label: string; color: string } | null
  onSuccess:     (estado: EstadoRequerimiento) => void
}

function CambiarEstadoModal({ open, onClose, requerimientoId, nuevoEstado, onSuccess }: CambiarEstadoModalProps) {
  const [isPending, startTransition] = useTransition()
  const [observacion, setObservacion] = useState('')
  const [imagen,      setImagen]      = useState<File | null>(null)
  const [subiendo,    setSubiendo]    = useState(false)
  const [error,       setError]       = useState<string | null>(null)

  const requiereObservacion = nuevoEstado?.valor === 'ATENDIDO_PARCIAL'

  function resetAndClose() {
    setObservacion(''); setImagen(null); setError(null)
    onClose()
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (!nuevoEstado) return
    if (requiereObservacion && !observacion.trim()) {
      setError('Agrega una observación: qué se hizo y qué falta por atender.')
      return
    }

    startTransition(async () => {
      let imagenUrl: string | undefined

      if (imagen) {
        setSubiendo(true)
        try {
          const body = new FormData()
          body.append('archivo', imagen)
          const res = await fetch('/api/requerimientos/upload-imagen', { method: 'POST', body })
          const data = await res.json() as { ok: boolean; url?: string; mensaje?: string }
          if (!data.ok) {
            setError(data.mensaje ?? 'No se pudo subir la imagen')
            setSubiendo(false)
            return
          }
          imagenUrl = data.url
        } catch {
          setError('Error de conexión al subir la imagen')
          setSubiendo(false)
          return
        }
        setSubiendo(false)
      }

      const res = await cambiarEstadoRequerimiento(requerimientoId, nuevoEstado.valor, observacion, imagenUrl)
      if (res.ok) {
        onSuccess(nuevoEstado.valor)
        resetAndClose()
      } else {
        setError(res.error)
      }
    })
  }

  const ocupado = isPending || subiendo

  return (
    <Dialog.Root open={open} onOpenChange={(v) => { if (!v) resetAndClose() }}>
      <AnimatePresence>
        {open && nuevoEstado && (
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
                  width: 440, maxWidth: 'calc(100vw - 32px)',
                  outline: 'none',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
                  <Dialog.Title style={{ fontSize: 15, fontWeight: 600, color: nuevoEstado.color, margin: 0 }}>
                    Cambiar a &quot;{nuevoEstado.label}&quot;
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
                  <div className="fi">
                    <label>
                      Observación {requiereObservacion ? '*' : <span style={{ color: 'var(--t3)', fontWeight: 400, textTransform: 'none' }}>(opcional)</span>}
                    </label>
                    <textarea
                      value={observacion}
                      onChange={(e) => setObservacion(e.target.value)}
                      placeholder={requiereObservacion
                        ? 'Qué se hizo hasta el momento y qué falta por atender...'
                        : 'Comentario sobre este cambio (opcional)...'}
                      rows={3}
                      maxLength={1000}
                    />
                  </div>

                  <div className="fi">
                    <label>Imagen de evidencia <span style={{ color: 'var(--t3)', fontWeight: 400, textTransform: 'none' }}>(opcional)</span></label>
                    <label
                      style={{
                        display: 'flex', alignItems: 'center', gap: 8,
                        border: '1px dashed var(--bm)', borderRadius: 'var(--rm)',
                        padding: '9px 12px', fontSize: 12, color: 'var(--t2)',
                        cursor: 'pointer',
                      }}
                    >
                      <IconPaperclip size={14} />
                      {imagen ? imagen.name : 'Adjuntar foto del pedido o evidencia...'}
                      <input
                        type="file"
                        accept="image/*"
                        style={{ display: 'none' }}
                        onChange={(e) => setImagen(e.target.files?.[0] ?? null)}
                      />
                    </label>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 4 }}>
                    <Dialog.Close asChild>
                      <button type="button" className="btn" disabled={ocupado}>Cancelar</button>
                    </Dialog.Close>
                    <button type="submit" className="btn btn-p" disabled={ocupado} style={{ minWidth: 110 }}>
                      {subiendo ? 'Subiendo imagen...' : isPending ? 'Guardando...' : 'Confirmar cambio'}
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

// ─── Historial ────────────────────────────────────────────────────────────────

function Historial({ items }: { items: HistorialItem[] }) {
  if (items.length === 0) {
    return (
      <div style={{ background: 'var(--bg2)', borderRadius: 'var(--rm)', padding: '9px 12px', fontSize: 12, color: 'var(--t3)' }}>
        Aún no hay cambios de estado registrados.
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {items.map((h) => (
        <div key={h.id} style={{ display: 'flex', gap: 10 }}>
          <div style={{ paddingTop: 2 }}>{estadoBadge(h.estado)}</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 12, color: 'var(--t3)' }}>
              {format(new Date(h.createdAt), 'dd/MM/yyyy HH:mm')} · {h.registradoPor.nombre}
            </div>
            {h.observacion && (
              <p style={{ fontSize: 13, color: 'var(--t1)', whiteSpace: 'pre-line', marginTop: 3 }}>{h.observacion}</p>
            )}
            {h.imagenUrl && (
              <a href={h.imagenUrl} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 12, color: 'var(--blue)', marginTop: 5 }}>
                <IconPhoto size={13} /> Ver imagen adjunta
              </a>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}

// ─── Componente principal ─────────────────────────────────────────────────────

export function RequerimientoDetalle({ requerimiento: r }: { requerimiento: RequerimientoCompleto }) {
  const router = useRouter()
  const [estado, setEstado] = useState(r.estado)
  const [modalEstado, setModalEstado] = useState<{ valor: EstadoRequerimiento; label: string; color: string } | null>(null)

  function abrirModal(opcion: { valor: EstadoRequerimiento; label: string; color: string }) {
    if (opcion.valor === estado) return
    setModalEstado(opcion)
  }

  function onCambioExitoso(nuevoEstado: EstadoRequerimiento) {
    setEstado(nuevoEstado)
    router.refresh()
  }

  return (
    <>
      <div style={{ marginBottom: 16 }}>
        <a href="/requerimientos" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--t2)', textDecoration: 'none' }}>
          <IconArrowLeft size={14} /> Volver a requerimientos
        </a>
      </div>

      <div className="dc">
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 }}>
          <div>
            <div className="ss" style={{ marginBottom: 2 }}>{r.area}</div>
            <div style={{ fontSize: 12, color: 'var(--t3)' }}>
              Solicitado el {format(new Date(r.fechaSolicitud), 'dd/MM/yyyy')}
            </div>
          </div>
          {estadoBadge(estado)}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px 24px' }}>
          <Field label="Área"                 value={r.area} />
          <Field label="Responsable"          value={`${r.responsable.nombre} · ${r.responsable.correo}`} />
          <Field label="Prioridad"            value={r.prioridad === 'ALTA' ? 'Alta · atender el mismo día' : 'Media · procedimiento normal'} />
          <Field label="Tipo"                 value={r.tipo === 'COMPRA' ? 'Compra' : 'Servicio'} />
          <Field label="Días de retraso"      value={r.diasRetraso > 0 ? `${r.diasRetraso} días` : '—'} />
          <Field label="Fecha estimada"       value={r.fechaEstimadaAtencion ? format(new Date(r.fechaEstimadaAtencion), 'dd/MM/yyyy') : '—'} />
          <Field label="Generado por"         value={r.creadoPor.nombre} />
          <Field label="Atendido por"         value={r.atendidoPor?.nombre ?? '—'} />
          <Field label="Última actualización" value={format(new Date(r.updatedAt), 'dd/MM/yyyy HH:mm')} />
        </div>

        {/* Panel de cambio de estado */}
        <div style={{ marginTop: 20, paddingTop: 16, borderTop: '1px solid var(--bl)' }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 10 }}>
            Cambiar estado
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {ESTADOS_OPCIONES.map((opcion) => {
              const isCurrent = estado === opcion.valor
              return (
                <button
                  key={opcion.valor}
                  onClick={() => abrirModal(opcion)}
                  disabled={isCurrent}
                  style={{
                    padding: '6px 14px',
                    borderRadius: 'var(--r)',
                    border: `1.5px solid ${isCurrent ? opcion.color : 'var(--bm)'}`,
                    background: isCurrent ? opcion.bg : 'transparent',
                    color: isCurrent ? opcion.color : 'var(--t2)',
                    fontSize: 12,
                    fontWeight: isCurrent ? 600 : 400,
                    cursor: isCurrent ? 'default' : 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 5,
                    transition: 'all 0.12s',
                  }}
                >
                  {isCurrent && <IconCheck size={11} />}
                  {opcion.label}
                </button>
              )
            })}
          </div>
        </div>

        <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid var(--bl)' }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>
            Descripción
          </div>
          <p style={{ fontSize: 13, color: 'var(--t1)', whiteSpace: 'pre-line', lineHeight: 1.7 }}>
            {r.descripcion}
          </p>
        </div>

        <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid var(--bl)' }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 10 }}>
            Historial de cambios
          </div>
          <Historial items={r.historial} />
        </div>
      </div>

      <CambiarEstadoModal
        open={modalEstado !== null}
        onClose={() => setModalEstado(null)}
        requerimientoId={r.id}
        nuevoEstado={modalEstado}
        onSuccess={onCambioExitoso}
      />
    </>
  )
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</div>
      <div style={{ fontSize: 13, color: 'var(--t1)', marginTop: 2 }}>{value}</div>
    </div>
  )
}
