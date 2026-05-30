import { prisma } from '@/lib/prisma'
import { AuditoriaView } from '@/components/auditoria/AuditoriaView'

export default async function AuditoriaPage() {
  const logs = await prisma.auditLog.findMany({
    orderBy: { createdAt: 'desc' },
    take: 200,
    include: { user: { select: { nombre: true, email: true } } },
  })
  return <AuditoriaView logs={logs} />
}
