import { prisma } from '@/lib/prisma'
import { RequerimientosView } from '@/components/requerimientos/RequerimientosView'

export default async function RequerimientosPage() {
  const requerimientos = await prisma.requerimiento.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      responsable: { select: { nombre: true } },
      creadoPor:   { select: { nombre: true } },
    },
  })
  return <RequerimientosView requerimientos={requerimientos} />
}
