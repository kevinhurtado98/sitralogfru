import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generarExcel, type ColumnaExcel } from "@/lib/excel";
import { format } from "date-fns";

const MONEDA_PRE: Record<string, string> = { SOLES: "S/", DOLARES: "$", EUROS: "€" };
const ESTADO_LABEL: Record<string, string> = {
  POR_VENCER: "Por vencer", PENDIENTE: "Pendiente", PAGADA: "Pagada", VENCIDA: "Vencida",
};
const FORMA_LABEL: Record<string, string> = {
  CREDITO: "Crédito", FACTORING: "Factoring",
  FACTURA_NEGOCIABLE: "Factura negociable", LETRA: "Letra",
};
const TIPO_LABEL: Record<string, string> = { COMPRA: "Compra", SERVICIO: "Servicio" };

interface FilaExport {
  serie: string; numero: string; proveedor: string; tipo: string;
  ordenCompra: string | null;
  fechaVencimiento: Date; moneda: string; montoNeto: Prisma.Decimal;
  semanaPago: number | null; formaPago: string | null; estado: string;
  registradoContable: boolean; fechaPago: Date | null;
}

const COLUMNAS: ColumnaExcel<FilaExport>[] = [
  { header: "N° Factura", width: 18, value: (f) => `${f.serie}-${f.numero}` },
  { header: "Proveedor", width: 32, value: (f) => f.proveedor },
  { header: "Tipo", width: 12, value: (f) => TIPO_LABEL[f.tipo] ?? f.tipo },
  { header: "Orden compra", width: 16, value: (f) => f.ordenCompra ?? "" },
  { header: "F. Vencimiento", width: 16, value: (f) => format(f.fechaVencimiento, "dd/MM/yyyy") },
  { header: "Moneda", width: 10, value: (f) => f.moneda === "SOLES" ? "PEN" : f.moneda === "DOLARES" ? "USD" : "EUR" },
  { header: "Monto a pagar", width: 16, value: (f) => `${MONEDA_PRE[f.moneda]} ${Number(f.montoNeto).toFixed(2)}` },
  { header: "Semana pago", width: 14, value: (f) => f.semanaPago ?? "" },
  { header: "Forma pago", width: 18, value: (f) => f.formaPago ? FORMA_LABEL[f.formaPago] : "" },
  { header: "Estado", width: 14, value: (f) => ESTADO_LABEL[f.estado] ?? f.estado },
  { header: "Reg. contable", width: 14, value: (f) => f.registradoContable ? "Sí" : "Pendiente" },
  { header: "Fecha de pago", width: 16, value: (f) => f.fechaPago ? format(f.fechaPago, "dd/MM/yyyy") : "" },
];

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const params = request.nextUrl.searchParams;
  const q = params.get("q")?.trim();
  const orden = params.get("orden")?.trim();
  const tipo = params.get("tipo");
  const estado = params.get("estado");
  const desde = params.get("desde");
  const hasta = params.get("hasta");
  const semana = params.get("semana");
  const contable = params.get("contable");

  const where: Prisma.FacturaWhereInput = {};
  if (q) {
    where.OR = [
      { proveedor: { contains: q } },
      { serie: { contains: q } },
      { numero: { contains: q } },
    ];
  }
  if (orden) where.ordenCompra = { contains: orden };
  if (tipo) where.tipo = tipo;
  if (estado) where.estado = estado;
  if (desde || hasta) {
    where.fechaVencimiento = {};
    if (desde) where.fechaVencimiento.gte = new Date(desde);
    if (hasta) {
      const h = new Date(hasta);
      h.setHours(23, 59, 59, 999);
      where.fechaVencimiento.lte = h;
    }
  }
  if (semana) {
    const sem = parseInt(semana);
    if (!isNaN(sem)) where.semanaPago = sem;
  }
  if (contable === "pendiente") where.registradoContable = false;
  if (contable === "registrado") where.registradoContable = true;

  const facturas = await prisma.factura.findMany({
    where,
    orderBy: { fechaVencimiento: "asc" },
    select: {
      serie: true, numero: true, proveedor: true, tipo: true, ordenCompra: true, fechaVencimiento: true,
      moneda: true, montoNeto: true, semanaPago: true, formaPago: true,
      estado: true, registradoContable: true, fechaPago: true,
    },
  });

  const buffer = await generarExcel(COLUMNAS, facturas, "Comprobantes");
  const arrayBuffer = buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength) as ArrayBuffer;

  return new NextResponse(arrayBuffer, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="comprobantes-${format(new Date(), "yyyy-MM-dd")}.xlsx"`,
    },
  });
}
