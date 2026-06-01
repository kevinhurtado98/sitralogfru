import { prisma } from '@/lib/prisma'
import { RequerimientosView } from '@/components/requerimientos/RequerimientosView'

export default async function RequerimientosPage() {
  const [raw, areas] = await Promise.all([
    prisma.requerimiento.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        area:        { select: { nombre: true } },
        responsable: { select: { nombres: true, apellidos: true } },
        creadoPor:   { select: { nombres: true, apellidos: true } },
      },
    }),
    prisma.area.findMany({
      where:   { activo: true },
      orderBy: { nombre: 'asc' },
      include: {
        responsables: {
          where:   { activo: true },
          orderBy: { nombres: 'asc' },
          select:  { id: true, nombres: true, apellidos: true, correo: true },
        },
      },
    }),
  ])

  const requerimientos = raw.map((r) => ({
    ...r,
    area:        r.area.nombre,
    responsable: { nombre: `${r.responsable.nombres} ${r.responsable.apellidos}`.trim() },
    creadoPor:   { nombre: `${r.creadoPor.nombres} ${r.creadoPor.apellidos}`.trim() },
  }))

  return <RequerimientosView requerimientos={requerimientos} areas={areas} />
}
