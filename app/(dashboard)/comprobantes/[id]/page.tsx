import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { FacturaDetalle } from "@/components/comprobantes/FacturaDetalle";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function FacturaDetallePage({ params }: Props) {
  const { id } = await params;

  const raw = await prisma.factura.findUnique({
    where: { id: parseInt(id) },
    include: {
      notasCredito: true,
      notasDebito: true,
      creadoPor: { select: { nombres: true, apellidos: true, email: true } },
    },
  });

  if (!raw) notFound();

  const factura = {
    ...raw,
    monto: Number(raw.monto),
    retencion: Number(raw.retencion),
    detraccion: Number(raw.detraccion),
    montoNeto: Number(raw.montoNeto),
    creadoPor: {
      nombre: `${raw.creadoPor.nombres} ${raw.creadoPor.apellidos}`.trim(),
      email: raw.creadoPor.email,
    },
    notasCredito: raw.notasCredito.map((n) => ({
      ...n,
      monto: Number(n.monto),
    })),
    notasDebito: raw.notasDebito.map((n) => ({ ...n, monto: Number(n.monto) })),
  };

  return <FacturaDetalle factura={factura} />;
}
