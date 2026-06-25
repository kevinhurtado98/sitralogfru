// Lógica de ejecución de reportes (server-only: usa Prisma). El catálogo y los tipos compartidos están en reportes-catalogo.ts
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import type { ReporteResultado } from "@/lib/reportes-catalogo";

export type { ReporteResultado } from "@/lib/reportes-catalogo";

const FORMA_LABEL: Record<string, string> = {
  CREDITO: "Crédito", FACTORING: "Factoring",
  FACTURA_NEGOCIABLE: "Factura negociable", LETRA: "Letra",
};
const ESTADO_REQ_LABEL: Record<string, string> = {
  ATENDIDO_TOTAL: "Atendido total", ATENDIDO_PARCIAL: "Atendido parcial",
  PENDIENTE: "Pendiente", NO_ATENDIDO: "No atendido",
};

// ─── Helpers de agregación ───────────────────────────────────────────────────

function agruparPorMes<T>(
  items: T[],
  fecha: (item: T) => Date,
  valor: (item: T) => number,
): { categoria: string; valor: number }[] {
  const map = new Map<string, { label: string; valor: number; orden: number }>();
  for (const item of items) {
    const d = fecha(item);
    const key = `${d.getFullYear()}-${d.getMonth()}`;
    const actual = map.get(key);
    const inc = valor(item);
    if (actual) actual.valor += inc;
    else
      map.set(key, {
        label: format(d, "MMM yyyy", { locale: es }),
        valor: inc,
        orden: d.getFullYear() * 12 + d.getMonth(),
      });
  }
  return Array.from(map.values())
    .sort((a, b) => a.orden - b.orden)
    .map(({ label, valor }) => ({ categoria: label, valor }));
}

function agruparPor<T>(
  items: T[],
  clave: (item: T) => string,
  valor: (item: T) => number,
): { categoria: string; valor: number }[] {
  const map = new Map<string, number>();
  for (const item of items) {
    const k = clave(item);
    map.set(k, (map.get(k) ?? 0) + valor(item));
  }
  return Array.from(map.entries()).map(([categoria, valor]) => ({ categoria, valor }));
}

function rangoFecha(desde?: string, hasta?: string): Prisma.DateTimeFilter | undefined {
  if (!desde && !hasta) return undefined;
  const filtro: Prisma.DateTimeFilter = {};
  if (desde) filtro.gte = new Date(desde);
  if (hasta) {
    const h = new Date(hasta);
    h.setHours(23, 59, 59, 999);
    filtro.lte = h;
  }
  return filtro;
}

// ─── Reportes de comprobantes ────────────────────────────────────────────────

async function facturasPorEstado(
  estado: "VENCIDA" | "POR_VENCER",
  desde?: string,
  hasta?: string,
): Promise<ReporteResultado> {
  const facturas = await prisma.factura.findMany({
    where: { estado, fechaVencimiento: rangoFecha(desde, hasta) },
    orderBy: { fechaVencimiento: "asc" },
    select: { serie: true, numero: true, proveedor: true, fechaVencimiento: true, montoNeto: true },
  });

  return {
    columnas: ["N° Factura", "Proveedor", "F. Vencimiento", "Monto neto"],
    filas: facturas.map((f) => [
      `${f.serie}-${f.numero}`,
      f.proveedor,
      format(f.fechaVencimiento, "dd/MM/yyyy"),
      Number(f.montoNeto),
    ]),
    agregado: agruparPorMes(facturas, (f) => f.fechaVencimiento, (f) => Number(f.montoNeto)),
  };
}

async function facturasSinRegistro(desde?: string, hasta?: string): Promise<ReporteResultado> {
  const facturas = await prisma.factura.findMany({
    where: { registradoContable: false, estado: { not: "PAGADA" }, fechaEmision: rangoFecha(desde, hasta) },
    orderBy: { fechaEmision: "asc" },
    select: { serie: true, numero: true, proveedor: true, fechaEmision: true, estado: true, montoNeto: true },
  });

  return {
    columnas: ["N° Factura", "Proveedor", "F. Emisión", "Estado", "Monto neto"],
    filas: facturas.map((f) => [
      `${f.serie}-${f.numero}`,
      f.proveedor,
      format(f.fechaEmision, "dd/MM/yyyy"),
      f.estado,
      Number(f.montoNeto),
    ]),
    agregado: agruparPorMes(facturas, (f) => f.fechaEmision, () => 1),
  };
}

async function facturasPorFormaPago(desde?: string, hasta?: string): Promise<ReporteResultado> {
  const facturas = await prisma.factura.findMany({
    where: { estado: { not: "PAGADA" }, fechaEmision: rangoFecha(desde, hasta) },
    orderBy: { fechaEmision: "asc" },
    select: { serie: true, numero: true, proveedor: true, formaPago: true, montoNeto: true },
  });

  return {
    columnas: ["N° Factura", "Proveedor", "Forma de pago", "Monto neto"],
    filas: facturas.map((f) => [
      `${f.serie}-${f.numero}`,
      f.proveedor,
      f.formaPago ? FORMA_LABEL[f.formaPago] ?? f.formaPago : "Sin asignar",
      Number(f.montoNeto),
    ]),
    agregado: agruparPor(
      facturas,
      (f) => (f.formaPago ? FORMA_LABEL[f.formaPago] ?? f.formaPago : "Sin asignar"),
      (f) => Number(f.montoNeto),
    ),
  };
}

async function facturasPagadas(desde?: string, hasta?: string): Promise<ReporteResultado> {
  const facturas = await prisma.factura.findMany({
    where: { estado: "PAGADA", fechaPago: rangoFecha(desde, hasta) ?? { not: null } },
    orderBy: { fechaPago: "asc" },
    select: { serie: true, numero: true, proveedor: true, fechaPago: true, montoNeto: true },
  });

  return {
    columnas: ["N° Factura", "Proveedor", "F. Pago", "Monto neto"],
    filas: facturas.map((f) => [
      `${f.serie}-${f.numero}`,
      f.proveedor,
      f.fechaPago ? format(f.fechaPago, "dd/MM/yyyy") : "—",
      Number(f.montoNeto),
    ]),
    agregado: agruparPorMes(
      facturas.filter((f) => f.fechaPago),
      (f) => f.fechaPago!,
      (f) => Number(f.montoNeto),
    ),
  };
}

// ─── Reportes de requerimientos ──────────────────────────────────────────────

async function requerimientosAgrupados(
  agruparPorCampo: "estado" | "prioridad",
  desde?: string,
  hasta?: string,
): Promise<ReporteResultado> {
  const requerimientos = await prisma.requerimiento.findMany({
    where: { fechaSolicitud: rangoFecha(desde, hasta) },
    orderBy: { fechaSolicitud: "asc" },
    include: {
      area: { select: { nombre: true } },
      responsable: { select: { nombres: true, apellidos: true } },
    },
  });

  return {
    columnas: ["Fecha", "Área", "Responsable", "Prioridad", "Estado"],
    filas: requerimientos.map((r) => [
      format(r.fechaSolicitud, "dd/MM/yyyy"),
      r.area.nombre,
      `${r.responsable.nombres} ${r.responsable.apellidos}`.trim(),
      r.prioridad === "ALTA" ? "Alta" : "Media",
      ESTADO_REQ_LABEL[r.estado] ?? r.estado,
    ]),
    agregado:
      agruparPorCampo === "estado"
        ? agruparPor(requerimientos, (r) => ESTADO_REQ_LABEL[r.estado] ?? r.estado, () => 1)
        : agruparPor(requerimientos, (r) => (r.prioridad === "ALTA" ? "Alta" : "Media"), () => 1),
  };
}

async function requerimientosUrgentesSinAtender(desde?: string, hasta?: string): Promise<ReporteResultado> {
  const requerimientos = await prisma.requerimiento.findMany({
    where: {
      prioridad: "ALTA",
      estado: { in: ["PENDIENTE", "NO_ATENDIDO"] },
      fechaSolicitud: rangoFecha(desde, hasta),
    },
    orderBy: { fechaSolicitud: "asc" },
    include: {
      area: { select: { nombre: true } },
      responsable: { select: { nombres: true, apellidos: true } },
    },
  });

  return {
    columnas: ["Fecha", "Área", "Responsable", "Días de retraso", "Estado"],
    filas: requerimientos.map((r) => [
      format(r.fechaSolicitud, "dd/MM/yyyy"),
      r.area.nombre,
      `${r.responsable.nombres} ${r.responsable.apellidos}`.trim(),
      r.diasRetraso,
      ESTADO_REQ_LABEL[r.estado] ?? r.estado,
    ]),
    agregado: agruparPor(requerimientos, (r) => r.area.nombre, () => 1),
  };
}

// ─── Despachador ─────────────────────────────────────────────────────────────

export async function ejecutarReporte(
  id: string,
  desde?: string,
  hasta?: string,
): Promise<ReporteResultado | null> {
  switch (id) {
    case "facturas_vencidas":
      return facturasPorEstado("VENCIDA", desde, hasta);
    case "facturas_por_vencer":
      return facturasPorEstado("POR_VENCER", desde, hasta);
    case "facturas_sin_registro":
      return facturasSinRegistro(desde, hasta);
    case "facturas_por_forma_pago":
      return facturasPorFormaPago(desde, hasta);
    case "facturas_pagadas":
      return facturasPagadas(desde, hasta);
    case "requerimientos_por_estado":
      return requerimientosAgrupados("estado", desde, hasta);
    case "requerimientos_por_prioridad":
      return requerimientosAgrupados("prioridad", desde, hasta);
    case "requerimientos_urgentes_sin_atender":
      return requerimientosUrgentesSinAtender(desde, hasta);
    default:
      return null;
  }
}
