// Mecanismo de alertas por correo usando Resend como proveedor
import { Resend } from "resend";
import { render } from "@react-email/render";
import { BienvenidaEmail } from "@/emails/BienvenidaEmail";
import { RequerimientosPendientesEmail } from "@/emails/RequerimientosPendientesEmail";
import type { RequerimientoEmailItem } from "@/emails/RequerimientosPendientesEmail";
import { FacturasVencidasEmail } from "@/emails/FacturasVencidasEmail";
import type { FacturaEmailItem } from "@/emails/FacturasVencidasEmail";
import { CodigoRecuperacionEmail } from "@/emails/CodigoRecuperacionEmail";

const APP_URL = process.env.AUTH_URL ?? "http://localhost:3000";

// Correo fijo que recibe todas las alertas automáticas del sistema
const ALERTA_DESTINATARIO = "khurtado@fruchincha.com.pe";

function getResendClient(): { resend: Resend; from: string } | null {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM;
  if (!apiKey || !from) return null;
  return { resend: new Resend(apiKey), from };
}

// Envía correo de bienvenida con las credenciales al nuevo usuario
export async function sendWelcomeEmail(params: {
  nombres: string;
  apellidos: string;
  correo: string;
  contrasena: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const client = getResendClient();
  if (!client)
    return { ok: false, error: "Credenciales de email no configuradas" };

  try {
    const html = await render(
      BienvenidaEmail({
        nombres: params.nombres,
        apellidos: params.apellidos,
        correo: params.correo,
        contrasena: params.contrasena,
        appUrl: APP_URL,
      }),
    );

    const { error } = await client.resend.emails.send({
      from: `SITRALOGFRU <${client.from}>`,
      to: [params.correo],
      subject: "Bienvenido a SITRALOGFRU — tus credenciales de acceso",
      html,
    });

    if (error) return { ok: false, error: error.message };
    return { ok: true };
  } catch (e: unknown) {
    return {
      ok: false,
      error: (e as Error).message ?? "Error al enviar el correo",
    };
  }
}

// Envía alerta con la lista de requerimientos pendientes de atención
export async function sendRequerimientosPendientesEmail(params: {
  requerimientos: RequerimientoEmailItem[];
  destinatario?: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const client = getResendClient();
  if (!client)
    return { ok: false, error: "Credenciales de email no configuradas" };

  try {
    const html = await render(
      RequerimientosPendientesEmail({
        requerimientos: params.requerimientos,
        appUrl: APP_URL,
      }),
    );

    const { error } = await client.resend.emails.send({
      from: `SITRALOGFRU <${client.from}>`,
      to: [params.destinatario ?? ALERTA_DESTINATARIO],
      subject: "Requerimientos Pendientes de Atención",
      html,
    });

    if (error) return { ok: false, error: error.message };
    return { ok: true };
  } catch (e: unknown) {
    return {
      ok: false,
      error: (e as Error).message ?? "Error al enviar el correo de alerta",
    };
  }
}

// Envía el código de 6 dígitos para recuperación de contraseña por autoservicio
export async function sendCodigoRecuperacionEmail(params: {
  nombres: string;
  apellidos: string;
  correo: string;
  codigo: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const client = getResendClient();
  if (!client)
    return { ok: false, error: "Credenciales de email no configuradas" };

  try {
    const html = await render(
      CodigoRecuperacionEmail({
        nombres: params.nombres,
        apellidos: params.apellidos,
        codigo: params.codigo,
      }),
    );

    const { error } = await client.resend.emails.send({
      from: `SITRALOGFRU <${client.from}>`,
      to: [params.correo],
      subject: "Código de recuperación de contraseña",
      html,
    });

    if (error) return { ok: false, error: error.message };
    return { ok: true };
  } catch (e: unknown) {
    return {
      ok: false,
      error: (e as Error).message ?? "Error al enviar el código de recuperación",
    };
  }
}

// Envía alerta con las facturas vencidas que aún no tienen pago registrado
export async function sendFacturasVencidasEmail(params: {
  facturas: FacturaEmailItem[];
  destinatario?: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const client = getResendClient();
  if (!client)
    return { ok: false, error: "Credenciales de email no configuradas" };

  try {
    const html = await render(
      FacturasVencidasEmail({
        facturas: params.facturas,
        appUrl: APP_URL,
      }),
    );

    const { error } = await client.resend.emails.send({
      from: `SITRALOGFRU <${client.from}>`,
      to: [params.destinatario ?? ALERTA_DESTINATARIO],
      subject: "Facturas Vencidas sin pago Generado",
      html,
    });

    if (error) return { ok: false, error: error.message };
    return { ok: true };
  } catch (e: unknown) {
    return {
      ok: false,
      error:
        (e as Error).message ??
        "Error al enviar el correo de facturas vencidas",
    };
  }
}
