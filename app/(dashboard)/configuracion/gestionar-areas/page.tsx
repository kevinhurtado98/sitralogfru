import { prisma } from "@/lib/prisma";
import { GestionarAreasView } from "@/components/configuracion/GestionarAreasView";

export default async function GestionarAreasPage() {
  const [areas, responsables] = await Promise.all([
    prisma.area.findMany({
      select: { id: true, nombre: true, color: true, tc: true, activo: true },
      orderBy: { nombre: "asc" },
    }),
    prisma.responsable.findMany({
      select: {
        id: true,
        nombres: true,
        apellidos: true,
        correo: true,
        areaId: true,
        area: { select: { nombre: true, color: true, tc: true } },
      },
      where: { activo: true },
      orderBy: { createdAt: "asc" },
    }),
  ]);

  return (
    <GestionarAreasView
      areas={areas}
      responsables={responsables.map((r) => ({
        id: r.id,
        nombres: r.nombres,
        apellidos: r.apellidos,
        correo: r.correo,
        areaId: r.areaId,
        areaNombre: r.area.nombre,
        areaColor: r.area.color,
        areaTc: r.area.tc,
      }))}
    />
  );
}
