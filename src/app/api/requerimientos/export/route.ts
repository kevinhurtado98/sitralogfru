import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generarExcel, type ColumnaExcel } from "@/lib/excel";
import { format } from "date-fns";

const ESTADO_LABEL: Record<string, string> = {
  ATENDIDO_TOTAL: "Atendido total", ATENDIDO_PARCIAL: "Atendido parcial",
  PENDIENTE: "Pendiente", NO_ATENDIDO: "No atendido",
};

interface FilaExport {
  fechaSolicitud: Date; tipo: string; prioridad: string; descripcion: string;
  glosa: string | null;
  diasRetraso: number; estado: string;
  area: { nombre: string };
  responsable: { nombres: string; apellidos: string };
  creadoPor: { nombres: string; apellidos: string };
}

const COLUMNAS: ColumnaExcel<FilaExport>[] = [
  { header: "Fecha", width: 14, value: (r) => format(r.fechaSolicitud, "dd/MM/yyyy") },
  { header: "Área", width: 20, value: (r) => r.area.nombre },
  { header: "Responsable", width: 26, value: (r) => `${r.responsable.nombres} ${r.responsable.apellidos}`.trim() },
  { header: "Tipo", width: 12, value: (r) => r.tipo === "COMPRA" ? "Compra" : "Servicio" },
  { header: "Prioridad", width: 10, value: (r) => r.prioridad === "ALTA" ? "Alta" : "Media" },
  { header: "Descripción", width: 50, value: (r) => r.descripcion },
  { header: "Glosa", width: 50, value: (r) => r.glosa ?? "" },
  { header: "Generado por", width: 24, value: (r) => `${r.creadoPor.nombres} ${r.creadoPor.apellidos}`.trim() },
  { header: "Días atraso", width: 12, value: (r) => r.diasRetraso },
  { header: "Estado", width: 18, value: (r) => ESTADO_LABEL[r.estado] ?? r.estado },
];

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const params = request.nextUrl.searchParams;
  const q = params.get("q")?.trim();
  const area = params.get("area");
  const estado = params.get("estado");
  const desde = params.get("desde");
  const hasta = params.get("hasta");

  const where: Prisma.RequerimientoWhereInput = {};
  if (q) {
    where.OR = [
      { descripcion: { contains: q } },
      { area: { nombre: { contains: q } } },
      { responsable: { nombres: { contains: q } } },
      { responsable: { apellidos: { contains: q } } },
    ];
  }
  if (area) where.area = { nombre: area };
  if (estado) where.estado = estado;
  if (desde || hasta) {
    where.fechaSolicitud = {};
    if (desde) where.fechaSolicitud.gte = new Date(desde);
    if (hasta) {
      const h = new Date(hasta);
      h.setHours(23, 59, 59, 999);
      where.fechaSolicitud.lte = h;
    }
  }

  const requerimientos = await prisma.requerimiento.findMany({
    where,
    orderBy: { createdAt: "desc" },
    select: {
      fechaSolicitud: true, tipo: true, prioridad: true, descripcion: true,
      glosa: true,
      diasRetraso: true, estado: true,
      area: { select: { nombre: true } },
      responsable: { select: { nombres: true, apellidos: true } },
      creadoPor: { select: { nombres: true, apellidos: true } },
    },
  });

  const buffer = await generarExcel(COLUMNAS, requerimientos, "Requerimientos");
  const arrayBuffer = buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength) as ArrayBuffer;

  return new NextResponse(arrayBuffer, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="requerimientos-${format(new Date(), "yyyy-MM-dd")}.xlsx"`,
    },
  });
}
