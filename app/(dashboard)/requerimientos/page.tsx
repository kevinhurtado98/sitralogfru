import { prisma } from '@/lib/prisma'
import { RequerimientosView } from '@/components/requerimientos/RequerimientosView'

export default async function RequerimientosPage() {
  const raw = await prisma.requerimiento.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      responsable: { select: { nombres: true, apellidos: true } },
      creadoPor:   { select: { nombres: true, apellidos: true } },
    },
  })

  const requerimientos = raw.map(r => ({
    ...r,
    responsable: { nombre: `${r.responsable.nombres} ${r.responsable.apellidos}`.trim() },
    creadoPor:   { nombre: `${r.creadoPor.nombres} ${r.creadoPor.apellidos}`.trim() },
  }))

  return <RequerimientosView requerimientos={requerimientos} />
}
