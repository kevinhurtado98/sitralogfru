// Server Actions del módulo de Comprobantes (facturas, notas de crédito/débito)
"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { z } from "zod";
import { differenceInDays } from "date-fns";
import { calcularSemanaPago } from "@/lib/semana-pago";

type Err = { ok: false; error: string };

const crearManualSchema = z.object({
  proveedor: z.string().min(1).max(200),
  rucProveedor: z.string().max(20).optional(),
  serie: z.string().min(1).max(10),
  numero: z.string().min(1).max(20),
  fechaEmision: z.string().min(1),
  fechaVencimiento: z.string().min(1),
  moneda: z.enum(["SOLES", "DOLARES", "EUROS"]),
  tipo: z.enum(["COMPRA", "SERVICIO"]),
  monto: z.number().positive(),
  formaPago: z
    .enum(["CREDITO", "FACTORING", "FACTURA_NEGOCIABLE", "LETRA"])
    .optional(),
  ordenCompra: z.string().max(50).optional(),
  notas: z.string().optional(),
});

// Obtiene el ID del usuario autenticado desde la sesión JWT
async function getSessionUserId(): Promise<number | null> {
  const session = await auth();
  const rawId = session?.user?.id ?? null;
  if (rawId) return Number(rawId);
  if (session?.user?.email) {
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true },
    });
    return user?.id ?? null;
  }
  return null;
}

// Registra una factura manualmente cuando el proveedor no envía XML
export async function crearFacturaManual(
  data: z.infer<typeof crearManualSchema>,
): Promise<{ ok: true; id: number } | Err> {
  const parsed = crearManualSchema.safeParse(data);
  if (!parsed.success) {
    const msg = parsed.error.issues[0]?.message ?? "Datos inválidos";
    return { ok: false, error: msg };
  }

  const creadoPorId = await getSessionUserId();
  if (!creadoPorId) return { ok: false, error: "No autenticado" };

  const d = parsed.data;

  const existente = await prisma.factura.findFirst({
    where: { serie: d.serie, numero: d.numero },
    select: { id: true },
  });
  if (existente) {
    return { ok: false, error: `${d.serie}-${d.numero} ya está registrada` };
  }

  const fechaEmision = new Date(d.fechaEmision);
  const fechaVencimiento = new Date(d.fechaVencimiento);

  const diasHasta = differenceInDays(fechaVencimiento, new Date());
  const estado =
    diasHasta < 0 ? "VENCIDA" : diasHasta <= 7 ? "POR_VENCER" : "PENDIENTE";

  const { semana: semanaPago, viernesPago } =
    calcularSemanaPago(fechaVencimiento);

  try {
    const factura = await prisma.factura.create({
      data: {
        proveedor: d.proveedor.trim(),
        rucProveedor: d.rucProveedor?.trim() || null,
        serie: d.serie.trim(),
        numero: d.numero.trim(),
        fechaEmision,
        fechaVencimiento,
        moneda: d.moneda,
        tipo: d.tipo,
        monto: d.monto,
        retencion: 0,
        detraccion: 0,
        montoNeto: d.monto,
        estado,
        formaPago: d.formaPago ?? null,
        ordenCompra: d.ordenCompra?.trim() || null,
        notas: d.notas?.trim() || null,
        semanaPago,
        viernesPago,
        creadoPorId,
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: creadoPorId,
        modulo: "COMPROBANTES",
        accion: "CREAR_MANUAL",
        entidadId: String(factura.id),
        datosNuevos: JSON.stringify({
          serie: d.serie,
          numero: d.numero,
          proveedor: d.proveedor,
          monto: d.monto,
        }),
      },
    });

    revalidatePath("/comprobantes");
    return { ok: true, id: factura.id };
  } catch (e) {
    console.error("[crearFacturaManual]", e);
    return { ok: false, error: "Error al registrar la factura" };
  }
}

// Actualiza los datos de una factura y calcula el monto neto descontando retención y detracción
export async function actualizarFactura(
  id: number,
  data: {
    tipo: string;
    formaPago: string | null;
    ordenCompra: string;
    notas: string;
    registradoContable: boolean;
    fechaRegistroContable: string | null;
    fechaPago: string | null;
    retencion: number;
    detraccion: number;
  },
): Promise<{ ok: true } | Err> {
  const userId = await getSessionUserId();
  if (!userId) return { ok: false, error: "No autenticado" };

  try {
    const anterior = await prisma.factura.findUnique({
      where: { id },
      select: {
        tipo: true,
        formaPago: true,
        ordenCompra: true,
        registradoContable: true,
        monto: true,
      },
    });

    const montoNeto = parseFloat(
      (Number(anterior?.monto ?? 0) - data.retencion - data.detraccion).toFixed(
        2,
      ),
    );

    await prisma.factura.update({
      where: { id },
      data: {
        tipo: data.tipo,
        formaPago: data.formaPago || null,
        ordenCompra: data.ordenCompra.trim() || null,
        notas: data.notas.trim() || null,
        registradoContable: data.registradoContable,
        fechaRegistroContable: data.registradoContable
          ? data.fechaRegistroContable
            ? new Date(data.fechaRegistroContable)
            : new Date()
          : null,
        fechaPago: data.fechaPago ? new Date(data.fechaPago) : null,
        retencion: data.retencion,
        detraccion: data.detraccion,
        montoNeto,
      },
    });

    await prisma.auditLog.create({
      data: {
        userId,
        modulo: "COMPROBANTES",
        accion: "EDITAR",
        entidadId: String(id),
        datosAnteriores: JSON.stringify(anterior),
        datosNuevos: JSON.stringify(data),
      },
    });

    revalidatePath("/comprobantes");
    revalidatePath(`/comprobantes/${id}`);
    return { ok: true };
  } catch (e) {
    console.error("[actualizarFactura]", e);
    return { ok: false, error: "Error al actualizar la factura" };
  }
}

// Cambia el estado de la factura a PAGADA con la fecha de pago real (permite adelantar el pago) y registra la acción en auditoría
export async function marcarComoPagada(
  id: number,
  fechaPago?: string,
): Promise<{ ok: true } | Err> {
  const userId = await getSessionUserId();
  if (!userId) return { ok: false, error: "No autenticado" };

  const fecha = fechaPago ? new Date(fechaPago) : new Date();

  try {
    await prisma.factura.update({
      where: { id },
      data: { estado: "PAGADA", fechaPago: fecha },
    });

    await prisma.auditLog.create({
      data: {
        userId,
        modulo: "COMPROBANTES",
        accion: "MARCAR_PAGADA",
        entidadId: String(id),
        datosNuevos: JSON.stringify({ estado: "PAGADA", fechaPago: fecha }),
      },
    });

    revalidatePath("/comprobantes");
    revalidatePath(`/comprobantes/${id}`);
    return { ok: true };
  } catch (e) {
    console.error("[marcarComoPagada]", e);
    return { ok: false, error: "Error al marcar como pagada" };
  }
}

// Elimina una factura de la BD guardando sus datos anteriores en auditoría
export async function eliminarFactura(id: number): Promise<{ ok: true } | Err> {
  const userId = await getSessionUserId();
  if (!userId) return { ok: false, error: "No autenticado" };

  try {
    const anterior = await prisma.factura.findUnique({
      where: { id },
      select: { serie: true, numero: true, proveedor: true },
    });

    await prisma.factura.delete({ where: { id } });

    await prisma.auditLog.create({
      data: {
        userId,
        modulo: "COMPROBANTES",
        accion: "ELIMINAR",
        entidadId: String(id),
        datosAnteriores: JSON.stringify(anterior),
      },
    });

    revalidatePath("/comprobantes");
    return { ok: true };
  } catch (e) {
    console.error("[eliminarFactura]", e);
    return { ok: false, error: "Error al eliminar la factura" };
  }
}

// Crea una nota de crédito asociada a una factura existente
export async function crearNotaCredito(
  facturaId: number,
  data: {
    serie: string;
    numero: string;
    monto: number;
    descripcion: string;
    fecha: string;
  },
): Promise<{ ok: true } | Err> {
  const userId = await getSessionUserId();
  if (!userId) return { ok: false, error: "No autenticado" };

  try {
    const nota = await prisma.notaCredito.create({
      data: {
        facturaId,
        serie: data.serie.trim(),
        numero: data.numero.trim(),
        monto: data.monto,
        descripcion: data.descripcion.trim() || null,
        fecha: new Date(data.fecha),
      },
    });

    await prisma.auditLog.create({
      data: {
        userId,
        modulo: "COMPROBANTES",
        accion: "CREAR",
        entidadId: String(facturaId),
        datosNuevos: JSON.stringify({
          tipo: "NOTA_CREDITO",
          notaId: nota.id,
          ...data,
        }),
      },
    });

    revalidatePath(`/comprobantes/${facturaId}`);
    return { ok: true };
  } catch (e) {
    console.error("[crearNotaCredito]", e);
    return { ok: false, error: "Error al crear la nota de crédito" };
  }
}

// Crea una nota de débito asociada a una factura existente
export async function crearNotaDebito(
  facturaId: number,
  data: {
    serie: string;
    numero: string;
    monto: number;
    descripcion: string;
    fecha: string;
  },
): Promise<{ ok: true } | Err> {
  const userId = await getSessionUserId();
  if (!userId) return { ok: false, error: "No autenticado" };

  try {
    const nota = await prisma.notaDebito.create({
      data: {
        facturaId,
        serie: data.serie.trim(),
        numero: data.numero.trim(),
        monto: data.monto,
        descripcion: data.descripcion.trim() || null,
        fecha: new Date(data.fecha),
      },
    });

    await prisma.auditLog.create({
      data: {
        userId,
        modulo: "COMPROBANTES",
        accion: "CREAR",
        entidadId: String(facturaId),
        datosNuevos: JSON.stringify({
          tipo: "NOTA_DEBITO",
          notaId: nota.id,
          ...data,
        }),
      },
    });

    revalidatePath(`/comprobantes/${facturaId}`);
    return { ok: true };
  } catch (e) {
    console.error("[crearNotaDebito]", e);
    return { ok: false, error: "Error al crear la nota de débito" };
  }
}

// Activa o desactiva el registro contable de una factura y guarda la fecha correspondiente
export async function toggleRegistroContable(
  id: number,
  registrado: boolean,
): Promise<{ ok: true } | Err> {
  const userId = await getSessionUserId();
  if (!userId) return { ok: false, error: "No autenticado" };

  try {
    await prisma.factura.update({
      where: { id },
      data: {
        registradoContable: registrado,
        fechaRegistroContable: registrado ? new Date() : null,
      },
    });

    await prisma.auditLog.create({
      data: {
        userId,
        modulo: "COMPROBANTES",
        accion: "REGISTRO_CONTABLE",
        entidadId: String(id),
        datosNuevos: JSON.stringify({ registradoContable: registrado }),
      },
    });

    revalidatePath("/comprobantes");
    return { ok: true };
  } catch (e) {
    console.error("[toggleRegistroContable]", e);
    return { ok: false, error: "Error al actualizar registro contable" };
  }
}
