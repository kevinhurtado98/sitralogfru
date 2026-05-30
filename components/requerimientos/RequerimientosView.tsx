'use client'

import Link from 'next/link'
import { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { Plus, Search } from 'lucide-react'
import { format } from 'date-fns'
import type { EstadoRequerimiento, Prioridad, TipoRequerimiento } from '@prisma/client'

interface Requerimiento {
  id: string
  fechaSolicitud: Date
  area: string
  prioridad: Prioridad
  tipo: TipoRequerimiento
  descripcion: string
  estado: EstadoRequerimiento
  diasRetraso: number
  responsable: { nombre: string }
  creadoPor: { nombre: string }
}

const prioridadBadge: Record<string, string> = {
  ALTA: 'bg-red-100 text-red-700 border-red-200',
  MEDIA: 'bg-yellow-100 text-yellow-700 border-yellow-200',
}

export function RequerimientosView({ requerimientos }: { requerimientos: Requerimiento[] }) {
  const [busqueda, setBusqueda] = useState('')

  const filtrados = useMemo(() => {
    const q = busqueda.toLowerCase()
    if (!q) return requerimientos
    return requerimientos.filter(
      (r) =>
        r.area.toLowerCase().includes(q) ||
        r.responsable.nombre.toLowerCase().includes(q) ||
        r.descripcion.toLowerCase().includes(q)
    )
  }, [requerimientos, busqueda])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Requerimientos</h1>
          <p className="text-sm text-gray-500 mt-1">{requerimientos.length} registros</p>
        </div>
        <Button variant="primary" size="sm" asChild>
          <Link href="/requerimientos/nuevo">
            <Plus className="h-4 w-4" />
            Nuevo requerimiento
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Buscar por área, responsable..."
              className="pl-9"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
            />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Fecha</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Área</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Responsable</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Prioridad</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Tipo</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Estado</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-600">Retraso</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtrados.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-10 text-center text-gray-400 text-sm">
                      No hay requerimientos registrados
                    </td>
                  </tr>
                ) : (
                  filtrados.map((r) => (
                    <tr key={r.id} className="hover:bg-blue-50/40 transition-colors">
                      <td className="px-4 py-3 text-gray-600">
                        {format(new Date(r.fechaSolicitud), 'dd/MM/yyyy')}
                      </td>
                      <td className="px-4 py-3">
                        <Link href={`/requerimientos/${r.id}`} className="text-blue-700 hover:underline font-medium">
                          {r.area}
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-gray-700">{r.responsable.nombre}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${prioridadBadge[r.prioridad]}`}>
                          {r.prioridad === 'ALTA' ? 'Alta' : 'Media'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-600">
                        {r.tipo === 'COMPRA' ? 'Compra' : 'Servicio'}
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={r.estado} />
                      </td>
                      <td className="px-4 py-3 text-right">
                        {r.diasRetraso > 0 ? (
                          <span className="text-red-600 font-medium">{r.diasRetraso}d</span>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
