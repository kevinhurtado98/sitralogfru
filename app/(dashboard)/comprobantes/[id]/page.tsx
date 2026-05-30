import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import { FacturaDetalle } from '@/components/comprobantes/FacturaDetalle'

interface Props {
  params: Promise<{ id: string }>
}

export default async function FacturaDetallePage({ params }: Props) {
  const { id } = await params
  const factura = await prisma.factura.findUnique({
    where: { id },
    include: {
      notasCredito: true,
      notasDebito: true,
      creadoPor: { select: { nombre: true, email: true } },
    },
  })
  if (!factura) notFound()
  return <FacturaDetalle factura={factura} />
}
