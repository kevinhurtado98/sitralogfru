import { prisma } from '@/lib/prisma'
import { ComprobantesView } from '@/components/comprobantes/ComprobantesView'

export default async function ComprobantesPage() {
  const facturas = await prisma.factura.findMany({
    orderBy: { createdAt: 'desc' },
    include: { creadoPor: { select: { nombre: true } } },
  })
  return <ComprobantesView facturas={facturas} />
}
