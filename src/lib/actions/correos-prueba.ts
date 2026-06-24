// Server Actions del módulo de Configuración para enviar correos de prueba con las funciones reales de envío
"use server";

import { z } from "zod";
import {
  sendWelcomeEmail,
  sendFacturasVencidasEmail,
  sendRequerimientosPendientesEmail,
} from "@/lib/email";

type Err = { ok: false; error: string };

const bienvenidaSchema = z.object({
  correo: z.string().email(),
  nombres: z.string().min(1),
  apellidos: z.string().min(1),
  contrasena: z.string().min(1),
});

export async function enviarPruebaBienvenida(
  data: z.infer<typeof bienvenidaSchema>,
): Promise<{ ok: true } | Err> {
  const parsed = bienvenidaSchema.safeParse(data);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  }
  return sendWelcomeEmail(parsed.data);
}

const facturaSchema = z.object({
  correo: z.string().email(),
  proveedor: z.string().min(1),
  serie: z.string().min(1),
  numero: z.string().min(1),
  moneda: z.enum(["SOLES", "DOLARES", "EUROS"]),
  montoNeto: z.number().positive(),
  formaPago: z.string().nullable(),
  diasVencida: z.number().int().min(0),
});

export async function enviarPruebaFacturasVencidas(
  data: z.infer<typeof facturaSchema>,
): Promise<{ ok: true } | Err> {
  const parsed = facturaSchema.safeParse(data);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  }
  const d = parsed.data;
  return sendFacturasVencidasEmail({
    destinatario: d.correo,
    facturas: [
      {
        id: 0,
        proveedor: d.proveedor,
        serie: d.serie,
        numero: d.numero,
        fechaVencimiento: new Date(Date.now() - d.diasVencida * 86_400_000),
        moneda: d.moneda,
        montoNeto: d.montoNeto,
        formaPago: d.formaPago,
        registradoContable: false,
        diasVencida: d.diasVencida,
      },
    ],
  });
}

const requerimientoSchema = z.object({
  correo: z.string().email(),
  area: z.string().min(1),
  responsable: z.string().min(1),
  prioridad: z.enum(["ALTA", "MEDIA"]),
  diasRetraso: z.number().int().min(0),
  descripcion: z.string().min(1),
});

export async function enviarPruebaRequerimientos(
  data: z.infer<typeof requerimientoSchema>,
): Promise<{ ok: true } | Err> {
  const parsed = requerimientoSchema.safeParse(data);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  }
  const d = parsed.data;
  return sendRequerimientosPendientesEmail({
    destinatario: d.correo,
    requerimientos: [
      {
        id: 0,
        area: d.area,
        responsable: d.responsable,
        prioridad: d.prioridad,
        diasRetraso: d.diasRetraso,
        descripcion: d.descripcion,
        fechaSolicitud: new Date(Date.now() - d.diasRetraso * 86_400_000),
      },
    ],
  });
}
