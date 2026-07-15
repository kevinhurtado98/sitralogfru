import { prisma } from "@/lib/prisma";
import { ComprobantesView } from "@/components/comprobantes/ComprobantesView";

export default async function ComprobantesPage() {
  const raw = await prisma.factura.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      proveedor: true,
      serie: true,
      numero: true,
      fechaVencimiento: true,
      moneda: true,
      tipo: true,
      ordenCompra: true,
      montoNeto: true,
      estado: true,
      formaPago: true,
      semanaPago: true,
      viernesPago: true,
      registradoContable: true,
      fechaRegistroContable: true,
    },
  });

  const facturas = raw.map((f) => ({
    ...f,
    montoNeto: Number(f.montoNeto),
  }));

  return <ComprobantesView facturas={facturas} />;
}
