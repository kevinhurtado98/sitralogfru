import { prisma } from '@/lib/prisma'
import { RequerimientosView } from '@/components/requerimientos/RequerimientosView'
import type { AreaConResponsables } from '@/components/requerimientos/RequerimientosView'

export default async function RequerimientosPage() {
  const [raw, areasRaw] = await Promise.all([
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

  const areas: AreaConResponsables[] = areasRaw.map((a) => ({
    id:           a.id,
    nombre:       a.nombre,
    color:        a.color,
    tc:           a.tc,
    responsables: a.responsables.map(r => ({ id: r.id, nombres: r.nombres, apellidos: r.apellidos, correo: r.correo })),
  }))

  return <RequerimientosView requerimientos={requerimientos} areas={areas} />
}
