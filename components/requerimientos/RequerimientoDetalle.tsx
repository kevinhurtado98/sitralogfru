'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { format } from 'date-fns'
import type { EstadoRequerimiento, Prioridad, TipoRequerimiento } from '@prisma/client'

interface RequerimientoCompleto {
  id: string
  fechaSolicitud: Date
  area: string
  prioridad: Prioridad
  tipo: TipoRequerimiento
  descripcion: string
  estado: EstadoRequerimiento
  diasRetraso: number
  createdAt: Date
  updatedAt: Date
  responsable: { nombre: string; email: string }
  creadoPor: { nombre: string }
  atendidoPor: { nombre: string } | null
}

export function RequerimientoDetalle({ requerimiento: r }: { requerimiento: RequerimientoCompleto }) {
  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{r.area}</h1>
          <p className="text-sm text-gray-500 mt-1">
            Solicitado el {format(new Date(r.fechaSolicitud), 'dd/MM/yyyy')}
          </p>
        </div>
        <StatusBadge status={r.estado} />
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Detalle del requerimiento</CardTitle></CardHeader>
        <CardContent>
          <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
            <Field label="Área" value={r.area} />
            <Field label="Responsable" value={r.responsable.nombre} />
            <Field label="Prioridad" value={r.prioridad === 'ALTA' ? '🔴 Alta (atender hoy)' : '🟡 Media'} />
            <Field label="Tipo" value={r.tipo === 'COMPRA' ? 'Compra' : 'Servicio'} />
            <Field label="Días de retraso" value={r.diasRetraso > 0 ? `${r.diasRetraso} días` : 'Sin retraso'} />
            <Field label="Creado por" value={r.creadoPor.nombre} />
            <Field label="Atendido por" value={r.atendidoPor?.nombre ?? '—'} />
            <Field label="Última actualización" value={format(new Date(r.updatedAt), 'dd/MM/yyyy HH:mm')} />
          </dl>

          <div className="mt-4 pt-4 border-t border-gray-100">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Descripción</p>
            <p className="text-sm text-gray-800 whitespace-pre-line leading-relaxed">{r.descripcion}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs text-gray-500 uppercase tracking-wide font-medium">{label}</dt>
      <dd className="mt-0.5 text-gray-800">{value}</dd>
    </div>
  )
}
