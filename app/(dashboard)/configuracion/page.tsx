import { prisma } from '@/lib/prisma'
import { ConfiguracionView } from '@/components/configuracion/ConfiguracionView'

export default async function ConfiguracionPage() {
  const usuarios = await prisma.user.findMany({
    select: { id: true, nombre: true, email: true, rol: true },
    orderBy: { createdAt: 'asc' },
  })
  return <ConfiguracionView usuarios={usuarios} />
}
