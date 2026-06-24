import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { generarReportePDF } from "@/lib/pdf";
import { format } from "date-fns";

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const body = (await request.json()) as {
    titulo: string;
    columnas: string[];
    filas: (string | number)[][];
    rango: string;
  };

  if (!body.titulo || !Array.isArray(body.columnas) || !Array.isArray(body.filas)) {
    return NextResponse.json({ error: "Datos de reporte inválidos" }, { status: 400 });
  }

  const buffer = await generarReportePDF(body.titulo, body.columnas, body.filas, body.rango ?? "");
  const arrayBuffer = buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength) as ArrayBuffer;

  return new NextResponse(arrayBuffer, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="reporte-${format(new Date(), "yyyy-MM-dd")}.pdf"`,
    },
  });
}
