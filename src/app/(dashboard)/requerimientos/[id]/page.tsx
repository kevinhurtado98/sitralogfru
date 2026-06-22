import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { RequerimientoDetalle } from "@/components/requerimientos/RequerimientoDetalle";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function RequerimientoDetallePage({ params }: Props) {
  const { id } = await params;

  const raw = await prisma.requerimiento.findUnique({
    where: { id: parseInt(id) },
    include: {
      area: { select: { nombre: true } },
      responsable: { select: { nombres: true, apellidos: true, correo: true } },
      creadoPor: { select: { nombres: true, apellidos: true } },
      atendidoPor: { select: { nombres: true, apellidos: true } },
      historial: {
        orderBy: { createdAt: "desc" },
        include: { registradoPor: { select: { nombres: true, apellidos: true } } },
      },
    },
  });
  if (!raw) notFound();

  const req = {
    ...raw,
    area: raw.area.nombre,
    responsable: {
      nombre: `${raw.responsable.nombres} ${raw.responsable.apellidos}`.trim(),
      correo: raw.responsable.correo,
    },
    creadoPor: {
      nombre: `${raw.creadoPor.nombres} ${raw.creadoPor.apellidos}`.trim(),
    },
    atendidoPor: raw.atendidoPor
      ? {
          nombre:
            `${raw.atendidoPor.nombres} ${raw.atendidoPor.apellidos}`.trim(),
        }
      : null,
    historial: raw.historial.map((h) => ({
      ...h,
      registradoPor: {
        nombre: `${h.registradoPor.nombres} ${h.registradoPor.apellidos}`.trim(),
      },
    })),
  };

  return <RequerimientoDetalle requerimiento={req} />;
}
