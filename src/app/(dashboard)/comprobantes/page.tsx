import { prisma } from "@/lib/prisma";
import { ComprobantesView } from "@/components/comprobantes/ComprobantesView";

export default async function ComprobantesPage() {
  const raw = await prisma.factura.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      creadoPor: { select: { nombres: true, apellidos: true } },
      notasCredito: true,
      notasDebito: true,
    },
  });

  const facturas = raw.map((f) => ({
    ...f,
    monto: Number(f.monto),
    retencion: Number(f.retencion),
    detraccion: Number(f.detraccion),
    montoNeto: Number(f.montoNeto),
    creadoPor: {
      nombre: `${f.creadoPor.nombres} ${f.creadoPor.apellidos}`.trim(),
    },
    notasCredito: f.notasCredito.map((n) => ({ ...n, monto: Number(n.monto) })),
    notasDebito: f.notasDebito.map((n) => ({ ...n, monto: Number(n.monto) })),
  }));

  return <ComprobantesView facturas={facturas} />;
}
