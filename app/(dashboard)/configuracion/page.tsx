import { prisma } from '@/lib/prisma'
import { ConfiguracionView } from '@/components/configuracion/ConfiguracionView'

export default async function ConfiguracionPage() {
  const [usuarios, responsables] = await Promise.all([
    prisma.user.findMany({
      select: { id: true, nombres: true, apellidos: true, email: true, rol: true, activo: true, notificaciones: true },
      orderBy: { createdAt: 'asc' },
    }),
    prisma.responsable.findMany({
      select: {
        id: true, nombres: true, apellidos: true, correo: true, areaId: true,
        area: { select: { nombre: true, color: true, tc: true } },
      },
      where: { activo: true },
      orderBy: { createdAt: 'asc' },
    }),
  ])

  return (
    <ConfiguracionView
      usuarios={usuarios.map(u => ({
        id: u.id, nombres: u.nombres, apellidos: u.apellidos,
        email: u.email, rol: u.rol, activo: u.activo, notificaciones: u.notificaciones,
      }))}
      responsables={responsables.map(r => ({
        id: r.id, nombres: r.nombres, apellidos: r.apellidos, correo: r.correo,
        areaNombre: r.area.nombre, areaColor: r.area.color, areaTc: r.area.tc,
      }))}
    />
  )
}
