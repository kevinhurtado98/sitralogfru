'use client'

import { format } from 'date-fns'
import { IconArrowLeft } from '@tabler/icons-react'
import type { EstadoRequerimiento, Prioridad, TipoRequerimiento } from '@prisma/client'

interface RequerimientoCompleto {
  id:                    string
  fechaSolicitud:        Date
  area:                  string
  prioridad:             Prioridad
  tipo:                  TipoRequerimiento
  descripcion:           string
  estado:                EstadoRequerimiento
  diasRetraso:           number
  fechaEstimadaAtencion: Date | null
  createdAt:             Date
  updatedAt:             Date
  responsable:           { nombre: string; correo: string }
  creadoPor:             { nombre: string }
  atendidoPor:           { nombre: string } | null
}

function estadoBadge(e: EstadoRequerimiento) {
  const map: Record<EstadoRequerimiento, [string, string]> = {
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
          {estadoBadge(r.estado)}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px 24px' }}>
          <Field label="Área"           value={r.area} />
          <Field label="Responsable"    value={`${r.responsable.nombre} · ${r.responsable.correo}`} />
          <Field label="Prioridad"      value={r.prioridad === 'ALTA' ? 'Alta · atender el mismo día' : 'Media · procedimiento normal'} />
          <Field label="Tipo"           value={r.tipo === 'COMPRA' ? 'Compra' : 'Servicio'} />
          <Field label="Días de retraso" value={r.diasRetraso > 0 ? `${r.diasRetraso} días` : '—'} />
          <Field label="Fecha estimada" value={r.fechaEstimadaAtencion ? format(new Date(r.fechaEstimadaAtencion), 'dd/MM/yyyy') : '—'} />
          <Field label="Generado por"   value={r.creadoPor.nombre} />
          <Field label="Atendido por"   value={r.atendidoPor?.nombre ?? '—'} />
          <Field label="Última actualización" value={format(new Date(r.updatedAt), 'dd/MM/yyyy HH:mm')} />
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
