import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { IndicadoresView } from '@/components/indicadores/IndicadoresView'

export default async function IndicadoresPage() {
  const session = await auth()

  const [facturas, requerimientos] = await Promise.all([
    prisma.factura.findMany({
      select: {
        id: true,
        estado: true,
        formaPago: true,
        montoNeto: true,
        registradoContable: true,
        fechaEmision: true,
      },
    }),
    prisma.requerimiento.findMany({
      select: {
        id: true,
        estado: true,
        prioridad: true,
        diasRetraso: true,
        createdAt: true,
      },
    }),
  ])

  return <IndicadoresView facturas={facturas} requerimientos={requerimientos} />
}
