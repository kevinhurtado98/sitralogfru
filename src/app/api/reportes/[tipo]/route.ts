import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { ejecutarReporte } from "@/lib/reportes";

interface Props {
  params: Promise<{ tipo: string }>;
}

export async function GET(request: NextRequest, { params }: Props) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { tipo } = await params;
  const desde = request.nextUrl.searchParams.get("desde") ?? undefined;
  const hasta = request.nextUrl.searchParams.get("hasta") ?? undefined;

  const resultado = await ejecutarReporte(tipo, desde, hasta);
  if (!resultado) {
    return NextResponse.json({ error: "Tipo de reporte no reconocido" }, { status: 404 });
  }

  return NextResponse.json(resultado);
}
