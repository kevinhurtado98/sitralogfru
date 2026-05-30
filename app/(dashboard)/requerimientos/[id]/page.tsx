import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import { RequerimientoDetalle } from '@/components/requerimientos/RequerimientoDetalle'

interface Props {
  params: Promise<{ id: string }>
}

export default async function RequerimientoDetallePage({ params }: Props) {
  const { id } = await params
  const req = await prisma.requerimiento.findUnique({
    where: { id },
    include: {
      responsable: { select: { nombre: true, email: true } },
      creadoPor: { select: { nombre: true } },
      atendidoPor: { select: { nombre: true } },
    },
  })
  if (!req) notFound()
  return <RequerimientoDetalle requerimiento={req} />
}
