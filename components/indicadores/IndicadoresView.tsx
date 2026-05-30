'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
} from 'recharts'
import { format, getMonth, getYear } from 'date-fns'
import { es } from 'date-fns/locale'

interface Factura {
  id: string
  estado: string
  formaPago: string | null
  montoNeto: unknown
  registradoContable: boolean
  fechaEmision: Date
}

interface Requerimiento {
  id: string
  estado: string
  prioridad: string
  diasRetraso: number
  createdAt: Date
}

interface Props {
  facturas: Factura[]
  requerimientos: Requerimiento[]
}

const MESES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']

export function IndicadoresView({ facturas, requerimientos }: Props) {
  const now = new Date()
  const añoActual = getYear(now)

  const pendientesSinRegistro = facturas.filter((f) => !f.registradoContable)
  const pendientesCredito = facturas.filter(
    (f) => f.formaPago === 'CREDITO' && f.estado !== 'PAGADA'
  )
  const pendientesFactoring = facturas.filter(
    (f) => f.formaPago === 'FACTORING' && f.estado !== 'PAGADA'
  )
  const pendientesNegociable = facturas.filter(
    (f) => f.formaPago === 'FACTURA_NEGOCIABLE' && f.estado !== 'PAGADA'
  )

  const reqPendientes = requerimientos.filter((r) => r.estado === 'PENDIENTE' || r.estado === 'NO_ATENDIDO')
  const reqAlta = reqPendientes.filter((r) => r.prioridad === 'ALTA')
  const reqMedia = reqPendientes.filter((r) => r.prioridad === 'MEDIA')

  // Datos mensuales para gráficas (últimos 6 meses)
  const mesesData = Array.from({ length: 6 }, (_, i) => {
    const mes = (getMonth(now) - 5 + i + 12) % 12
    const año = mes > getMonth(now) ? añoActual - 1 : añoActual
    const factMes = facturas.filter(
      (f) => getMonth(new Date(f.fechaEmision)) === mes && getYear(new Date(f.fechaEmision)) === año
    )
    const reqMes = requerimientos.filter(
      (r) => getMonth(new Date(r.createdAt)) === mes && getYear(new Date(r.createdAt)) === año
    )
    return {
      mes: MESES[mes],
      sinRegistro: factMes.filter((f) => !f.registradoContable).length,
      credito: factMes.filter((f) => f.formaPago === 'CREDITO' && f.estado !== 'PAGADA').length,
      requerimientos: reqMes.filter((r) => r.estado === 'PENDIENTE').length,
    }
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Indicadores</h1>
        <p className="text-sm text-gray-500 mt-1">Resumen del sistema</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard title="Sin registro contable" value={pendientesSinRegistro.length} color="text-yellow-600" />
        <KpiCard title="Crédito pendiente" value={pendientesCredito.length} color="text-orange-600" />
        <KpiCard title="Factoring pendiente" value={pendientesFactoring.length} color="text-blue-600" />
        <KpiCard title="Negociable pendiente" value={pendientesNegociable.length} color="text-purple-600" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <KpiCard title="Req. Alta prioridad" value={reqAlta.length} color="text-red-600" />
        <KpiCard title="Req. Media prioridad" value={reqMedia.length} color="text-yellow-600" />
        <KpiCard title="Total requerimientos" value={requerimientos.length} color="text-gray-700" />
      </div>

      {/* Gráfica facturas */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Facturas por mes (últimos 6 meses)</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={mesesData} margin={{ top: 4, right: 20, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" className="opacity-40" />
              <XAxis dataKey="mes" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Legend />
              <Bar dataKey="sinRegistro" name="Sin registro" fill="#f59e0b" radius={[4, 4, 0, 0]} />
              <Bar dataKey="credito" name="Crédito pend." fill="#3b82f6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Gráfica requerimientos */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Requerimientos pendientes por mes</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={mesesData} margin={{ top: 4, right: 20, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" className="opacity-40" />
              <XAxis dataKey="mes" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Bar dataKey="requerimientos" name="Pendientes" fill="#ef4444" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  )
}

function KpiCard({ title, value, color }: { title: string; value: number; color: string }) {
  return (
    <Card>
      <CardContent className="pt-5 pb-4">
        <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">{title}</p>
        <p className={`text-3xl font-bold mt-1 ${color}`}>{value}</p>
      </CardContent>
    </Card>
  )
}
