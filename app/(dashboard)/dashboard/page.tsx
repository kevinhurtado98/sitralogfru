import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { IndicadoresView } from "@/components/indicadores/IndicadoresView";

export default async function IndicadoresPage() {
  const session = await auth();

  const [rawFacturas, requerimientos] = await Promise.all([
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
  ]);

  // Decimal de Prisma → number antes de pasar al client component
  const facturas = rawFacturas.map((f) => ({ ...f, montoNeto: Number(f.montoNeto) }));

  return <IndicadoresView facturas={facturas} requerimientos={requerimientos} />;
}
