import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import { RequerimientoDetalle } from '@/components/requerimientos/RequerimientoDetalle'

interface Props {
  params: Promise<{ id: string }>
}

export default async function RequerimientoDetallePage({ params }: Props) {
  const { id } = await params
  const raw = await prisma.requerimiento.findUnique({
    where: { id },
    include: {
      responsable: { select: { nombres: true, apellidos: true, email: true } },
      creadoPor:   { select: { nombres: true, apellidos: true } },
      atendidoPor: { select: { nombres: true, apellidos: true } },
    },
  })
  if (!raw) notFound()

  const req = {
    ...raw,
    responsable: { nombre: `${raw.responsable.nombres} ${raw.responsable.apellidos}`.trim(), email: raw.responsable.email },
    creadoPor:   { nombre: `${raw.creadoPor.nombres} ${raw.creadoPor.apellidos}`.trim() },
    atendidoPor: raw.atendidoPor
      ? { nombre: `${raw.atendidoPor.nombres} ${raw.atendidoPor.apellidos}`.trim() }
      : null,
  }

  return <RequerimientoDetalle requerimiento={req} />
}
