'use client'

import { useState, useTransition } from 'react'
import { format } from 'date-fns'
import { IconArrowLeft, IconCheck } from '@tabler/icons-react'
import { cambiarEstadoRequerimiento } from '@/lib/actions/requerimientos'
import type { EstadoRequerimiento } from '@/lib/types'

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

export function RequerimientoDetalle({ requerimiento: r }: { requerimiento: RequerimientoCompleto }) {
  const [estado, setEstado] = useState(r.estado)
  const [errorMsg, setErrorMsg] = useState('')
  const [isPending, startTransition] = useTransition()

  function cambiarEstado(nuevoEstado: EstadoRequerimiento) {
    if (nuevoEstado === estado || isPending) return
    setErrorMsg('')
    startTransition(async () => {
      const res = await cambiarEstadoRequerimiento(r.id, nuevoEstado)
      if (!res.ok) { setErrorMsg(res.error); return }
      setEstado(nuevoEstado)
    })
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
            {ESTADOS_OPCIONES.map(({ valor, label, color, bg }) => {
              const isCurrent = estado === valor
              return (
                <button
                  key={valor}
                  onClick={() => cambiarEstado(valor)}
                  disabled={isCurrent || isPending}
                  style={{
                    padding: '6px 14px',
                    borderRadius: 'var(--r)',
                    border: `1.5px solid ${isCurrent ? color : 'var(--bm)'}`,
                    background: isCurrent ? bg : 'transparent',
                    color: isCurrent ? color : 'var(--t2)',
                    fontSize: 12,
                    fontWeight: isCurrent ? 600 : 400,
                    cursor: isCurrent || isPending ? 'default' : 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 5,
                    opacity: isPending && !isCurrent ? 0.5 : 1,
                    transition: 'all 0.12s',
                  }}
                >
                  {isCurrent && <IconCheck size={11} />}
                  {label}
                </button>
              )
            })}
          </div>
          {errorMsg && (
            <div style={{ fontSize: 12, color: 'var(--red)', marginTop: 8 }}>{errorMsg}</div>
          )}
        </div>

        <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid var(--bl)' }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>
            Descripción
          </div>
          <p style={{ fontSize: 13, color: 'var(--t1)', whiteSpace: 'pre-line', lineHeight: 1.7 }}>
            {r.descripcion}
          </p>
        </div>
      </div>
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
