import { prisma } from '@/lib/prisma'
import { NuevoRequerimientoView } from '@/components/requerimientos/NuevoRequerimientoView'
import type { TarjetaRapida } from '@/components/requerimientos/NuevoRequerimientoView'

export default async function NuevoRequerimientoPage() {
  const [areas, usoReciente] = await Promise.all([
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
    // Últimos 20 responsables distintos usados en requerimientos, por fecha desc
    prisma.requerimiento.groupBy({
      by:      ['responsableId'],
      orderBy: { _max: { createdAt: 'desc' } },
      take:    20,
      _max:    { createdAt: true },
    }),
  ])

  let tarjetasRapidas: TarjetaRapida[]

  if (usoReciente.length > 0) {
    const ids = usoReciente.map((r) => r.responsableId)

    const responsables = await prisma.responsable.findMany({
      where:   { id: { in: ids }, activo: true },
      include: { area: { select: { id: true, nombre: true, color: true, tc: true } } },
    })

    // Reordenar para mantener el orden más-reciente-primero del groupBy
    const orden = new Map(ids.map((id, i) => [id, i]))
    tarjetasRapidas = responsables
      .sort((a, b) => (orden.get(a.id) ?? 99) - (orden.get(b.id) ?? 99))
      .map((r) => ({
        id: r.id, nombres: r.nombres, apellidos: r.apellidos, correo: r.correo,
        area: r.area,
      }))
  } else {
    // Sin requerimientos aún → primeros 20 ordenados por nombre
    const responsables = await prisma.responsable.findMany({
      where:   { activo: true },
      orderBy: { nombres: 'asc' },
      take:    20,
      include: { area: { select: { id: true, nombre: true, color: true, tc: true } } },
    })
    tarjetasRapidas = responsables.map((r) => ({
      id: r.id, nombres: r.nombres, apellidos: r.apellidos, correo: r.correo,
      area: r.area,
    }))
  }

  return <NuevoRequerimientoView areas={areas} tarjetasRapidas={tarjetasRapidas} />
}
