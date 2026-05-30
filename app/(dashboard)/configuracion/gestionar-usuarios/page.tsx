import { prisma } from '@/lib/prisma'
import { GestionarUsuariosView } from '@/components/configuracion/GestionarUsuariosView'

export default async function GestionarUsuariosPage() {
  const usuarios = await prisma.user.findMany({
    select: { id: true, nombres: true, apellidos: true, email: true, rol: true, activo: true, notificaciones: true },
    orderBy: { createdAt: 'asc' },
  })

  return <GestionarUsuariosView usuarios={usuarios} />
}
