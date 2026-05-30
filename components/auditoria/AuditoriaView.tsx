'use client'

import { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Search } from 'lucide-react'
import { format } from 'date-fns'
import type { Modulo } from '@prisma/client'

interface AuditLog {
  id: string
  modulo: Modulo
  accion: string
  entidadId: string
  datosAnteriores: unknown
  datosNuevos: unknown
  createdAt: Date
  user: { nombre: string; email: string }
}

const moduloColor: Record<string, string> = {
  COMPROBANTES: 'bg-blue-100 text-blue-700',
  REQUERIMIENTOS: 'bg-purple-100 text-purple-700',
  USUARIOS: 'bg-gray-100 text-gray-700',
  AUTH: 'bg-green-100 text-green-700',
}

export function AuditoriaView({ logs }: { logs: AuditLog[] }) {
  const [busqueda, setBusqueda] = useState('')

  const filtrados = useMemo(() => {
    const q = busqueda.toLowerCase()
    if (!q) return logs
    return logs.filter(
      (l) =>
        l.user.nombre.toLowerCase().includes(q) ||
        l.accion.toLowerCase().includes(q) ||
        l.modulo.toLowerCase().includes(q)
    )
  }, [logs, busqueda])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Auditoría</h1>
        <p className="text-sm text-gray-500 mt-1">Trazabilidad de acciones del sistema</p>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Buscar por usuario, acción..."
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
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Usuario</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Módulo</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Acción</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Entidad</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtrados.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-10 text-center text-gray-400">
                      Sin registros de auditoría
                    </td>
                  </tr>
                ) : (
                  filtrados.map((log) => (
                    <tr key={log.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 text-gray-500 whitespace-nowrap">
                        {format(new Date(log.createdAt), 'dd/MM/yyyy HH:mm')}
                      </td>
                      <td className="px-4 py-3 font-medium text-gray-800">{log.user.nombre}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${moduloColor[log.modulo] ?? 'bg-gray-100 text-gray-600'}`}>
                          {log.modulo}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-700">{log.accion}</td>
                      <td className="px-4 py-3 font-mono text-xs text-gray-400 truncate max-w-[120px]">
                        {log.entidadId}
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
