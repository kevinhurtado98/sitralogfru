import { prisma } from '@/lib/prisma'
import { ComprobantesView } from '@/components/comprobantes/ComprobantesView'

export default async function ComprobantesPage() {
  const raw = await prisma.factura.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      creadoPor:   { select: { nombre: true } },
      notasCredito: true,
      notasDebito:  true,
    },
  })

  // Serialize Decimal → number for client props
  const facturas = raw.map((f) => ({
    ...f,
    monto:       Number(f.monto),
    retencion:   Number(f.retencion),
    detraccion:  Number(f.detraccion),
    montoNeto:   Number(f.montoNeto),
    notasCredito: f.notasCredito.map((n) => ({ ...n, monto: Number(n.monto) })),
    notasDebito:  f.notasDebito.map((n)  => ({ ...n, monto: Number(n.monto) })),
  }))

  return <ComprobantesView facturas={facturas} />
}
