'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { format } from 'date-fns'
import { etiquetaSemanaPago } from '@/lib/semana-pago'
import type { EstadoFactura, Moneda, TipoFactura, FormaPago } from '@prisma/client'

interface NotaCredito {
  id: string
  serie: string
  numero: string
  monto: unknown
  descripcion: string | null
  fecha: Date
}

interface FacturaConRelaciones {
  id: string
  proveedor: string
  rucProveedor: string | null
  serie: string
  numero: string
  fechaEmision: Date
  fechaVencimiento: Date
  moneda: Moneda
  tipo: TipoFactura
  monto: unknown
  retencion: unknown
  detraccion: unknown
  montoNeto: unknown
  estado: EstadoFactura
  formaPago: FormaPago | null
  ordenCompra: string | null
  fechaRegistroContable: Date | null
  registradoContable: boolean
  semanaPago: number | null
  viernesPago: Date | null
  notas: string | null
  notasCredito: NotaCredito[]
  notasDebito: NotaCredito[]
  creadoPor: { nombre: string; email: string }
}

const monedaLabel: Record<string, string> = { SOLES: 'Soles (PEN)', DOLARES: 'Dólares (USD)', EUROS: 'Euros (EUR)' }
const formaPagoLabel: Record<string, string> = {
  CREDITO: 'Crédito',
  FACTORING: 'Factoring',
  FACTURA_NEGOCIABLE: 'Factura Negociable',
  LETRA: 'Letra',
}

export function FacturaDetalle({ factura }: { factura: FacturaConRelaciones }) {
  const semanaPagoLabel =
    factura.semanaPago && factura.viernesPago
      ? etiquetaSemanaPago({
          semana: factura.semanaPago,
          año: new Date(factura.viernesPago).getFullYear(),
          viernesPago: new Date(factura.viernesPago),
        })
      : '—'

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {factura.serie}-{factura.numero}
          </h1>
          <p className="text-sm text-gray-500 mt-1">{factura.proveedor}</p>
        </div>
        <StatusBadge status={factura.estado} />
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Datos del comprobante</CardTitle></CardHeader>
        <CardContent>
          <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
            <Field label="Proveedor" value={factura.proveedor} />
            <Field label="RUC" value={factura.rucProveedor ?? '—'} />
            <Field label="Fecha de emisión" value={format(new Date(factura.fechaEmision), 'dd/MM/yyyy')} />
            <Field label="Fecha de vencimiento" value={format(new Date(factura.fechaVencimiento), 'dd/MM/yyyy')} />
            <Field label="Moneda" value={monedaLabel[factura.moneda] ?? factura.moneda} />
            <Field label="Tipo" value={factura.tipo === 'COMPRA' ? 'Factura de Compra' : 'Factura de Servicio'} />
            <Field label="Monto total" value={`${Number(factura.monto).toFixed(2)}`} />
            <Field label="Retención (3%)" value={`${Number(factura.retencion).toFixed(2)}`} />
            <Field label="Detracción" value={`${Number(factura.detraccion).toFixed(2)}`} />
            <Field label="Monto neto a pagar" value={`${Number(factura.montoNeto).toFixed(2)}`} className="font-semibold text-gray-900" />
            <Field label="Forma de pago" value={factura.formaPago ? formaPagoLabel[factura.formaPago] : '—'} />
            <Field label="Orden de compra" value={factura.ordenCompra ?? '—'} />
            <Field label="Semana de pago" value={semanaPagoLabel} />
            <Field label="Registrado contable" value={factura.registradoContable ? '✓ Sí' : '✗ Pendiente'} />
          </dl>
          {factura.notas && (
            <div className="mt-4 pt-4 border-t border-gray-100">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Notas</p>
              <p className="text-sm text-gray-700 whitespace-pre-line">{factura.notas}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {(factura.notasCredito.length > 0 || factura.notasDebito.length > 0) && (
        <Card>
          <CardHeader><CardTitle className="text-base">Notas de crédito / débito</CardTitle></CardHeader>
          <CardContent>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left py-2 font-medium text-gray-600">Tipo</th>
                  <th className="text-left py-2 font-medium text-gray-600">N°</th>
                  <th className="text-right py-2 font-medium text-gray-600">Monto</th>
                  <th className="text-left py-2 font-medium text-gray-600">Fecha</th>
                </tr>
              </thead>
              <tbody>
                {factura.notasCredito.map((n) => (
                  <tr key={n.id} className="border-b border-gray-50">
                    <td className="py-2 text-green-600 font-medium">NC</td>
                    <td className="py-2">{n.serie}-{n.numero}</td>
                    <td className="py-2 text-right font-mono">{Number(n.monto).toFixed(2)}</td>
                    <td className="py-2">{format(new Date(n.fecha), 'dd/MM/yyyy')}</td>
                  </tr>
                ))}
                {factura.notasDebito.map((n) => (
                  <tr key={n.id} className="border-b border-gray-50">
                    <td className="py-2 text-red-600 font-medium">ND</td>
                    <td className="py-2">{n.serie}-{n.numero}</td>
                    <td className="py-2 text-right font-mono">{Number(n.monto).toFixed(2)}</td>
                    <td className="py-2">{format(new Date(n.fecha), 'dd/MM/yyyy')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

function Field({ label, value, className }: { label: string; value: string; className?: string }) {
  return (
    <div>
      <dt className="text-xs text-gray-500 uppercase tracking-wide font-medium">{label}</dt>
      <dd className={`mt-0.5 text-gray-800 ${className ?? ''}`}>{value}</dd>
    </div>
  )
}
