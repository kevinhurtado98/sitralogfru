'use client'

import Link from 'next/link'
import { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { Upload, Search } from 'lucide-react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import type { EstadoFactura, Moneda, TipoFactura } from '@prisma/client'

interface Factura {
  id: string
  proveedor: string
  serie: string
  numero: string
  fechaVencimiento: Date
  moneda: Moneda
  tipo: TipoFactura
  montoNeto: unknown
  estado: EstadoFactura
  formaPago: string | null
  semanaPago: number | null
  creadoPor: { nombre: string }
}

interface Props {
  facturas: Factura[]
}

const monedaSymbol: Record<string, string> = {
  SOLES: 'S/',
  DOLARES: 'US$',
  EUROS: '€',
}

export function ComprobantesView({ facturas }: Props) {
  const [busqueda, setBusqueda] = useState('')

  const filtradas = useMemo(() => {
    const q = busqueda.toLowerCase()
    if (!q) return facturas
    return facturas.filter(
      (f) =>
        f.proveedor.toLowerCase().includes(q) ||
        `${f.serie}-${f.numero}`.toLowerCase().includes(q)
    )
  }, [facturas, busqueda])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Comprobantes</h1>
          <p className="text-sm text-gray-500 mt-1">{facturas.length} registros</p>
        </div>
        <Button variant="primary" size="sm" asChild>
          <Link href="/comprobantes/nuevo">
            <Upload className="h-4 w-4" />
            Subir comprobantes
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Buscar por proveedor o N° factura..."
                className="pl-9"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Factura</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Proveedor</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Vencimiento</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Semana</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-600">Monto neto</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtradas.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-10 text-center text-gray-400 text-sm">
                      No hay facturas registradas
                    </td>
                  </tr>
                ) : (
                  filtradas.map((f) => (
                    <tr key={f.id} className="hover:bg-blue-50/40 transition-colors">
                      <td className="px-4 py-3">
                        <Link
                          href={`/comprobantes/${f.id}`}
                          className="font-mono text-blue-700 hover:underline"
                        >
                          {f.serie}-{f.numero}
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-gray-800 max-w-[200px] truncate">{f.proveedor}</td>
                      <td className="px-4 py-3 text-gray-600">
                        {format(new Date(f.fechaVencimiento), 'dd/MM/yyyy')}
                      </td>
                      <td className="px-4 py-3 text-gray-600">
                        {f.semanaPago ? `Sem. ${f.semanaPago}` : '—'}
                      </td>
                      <td className="px-4 py-3 text-right font-mono font-medium">
                        {monedaSymbol[f.moneda] ?? ''}{' '}
                        {Number(f.montoNeto).toLocaleString('es-PE', {
                          minimumFractionDigits: 2,
                        })}
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={f.estado} />
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
