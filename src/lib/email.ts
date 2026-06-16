// Mecanismo de alertas por correo usando Brevo (ex Sendinblue) como proveedor SMTP
import { render } from "@react-email/render";
import { BienvenidaEmail } from "@/emails/BienvenidaEmail";
import { RequerimientosPendientesEmail } from "@/emails/RequerimientosPendientesEmail";
import type { RequerimientoEmailItem } from "@/emails/RequerimientosPendientesEmail";
import { FacturasVencidasEmail } from "@/emails/FacturasVencidasEmail";
import type { FacturaEmailItem } from "@/emails/FacturasVencidasEmail";

const API_URL = "https://api.brevo.com/v3/smtp/email";
const APP_URL = process.env.AUTH_URL ?? "http://localhost:3000";

// Correo fijo que recibe todas las alertas automáticas del sistema
const ALERTA_DESTINATARIO = "khurtado@fruchincha.com.pe";

// Envía correo de bienvenida con las credenciales al nuevo usuario
export async function sendWelcomeEmail(params: {
  nombres: string;
  apellidos: string;
  correo: string;
  contrasena: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const apiKey = process.env.BREVO_API_KEY;
  const from = process.env.BREVO_FROM;

  if (!apiKey || !from)
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

    const res = await fetch(API_URL, {
      method: "POST",
      headers: {
        "api-key": apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        sender: { name: "SITRALOGFRU", email: from },
        to: [{ email: params.correo }],
        subject: "Bienvenido a SITRALOGFRU — tus credenciales de acceso",
        htmlContent: html,
      }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      return {
        ok: false,
        error: (err as { message?: string }).message ?? `Error ${res.status}`,
      };
    }

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
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const apiKey = process.env.BREVO_API_KEY;
  const from = process.env.BREVO_FROM;

  if (!apiKey || !from)
    return { ok: false, error: "Credenciales de email no configuradas" };

  try {
    const html = await render(
      RequerimientosPendientesEmail({
        requerimientos: params.requerimientos,
        appUrl: APP_URL,
      }),
    );

    const res = await fetch(API_URL, {
      method: "POST",
      headers: {
        "api-key": apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        sender: { name: "SITRALOGFRU", email: from },
        to: [{ email: ALERTA_DESTINATARIO }],
        subject: "Requerimientos Pendientes de Atención",
        htmlContent: html,
      }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      return {
        ok: false,
        error: (err as { message?: string }).message ?? `Error ${res.status}`,
      };
    }

    return { ok: true };
  } catch (e: unknown) {
    return {
      ok: false,
      error: (e as Error).message ?? "Error al enviar el correo de alerta",
    };
  }
}

// Envía alerta con las facturas vencidas que aún no tienen pago registrado
export async function sendFacturasVencidasEmail(params: {
  facturas: FacturaEmailItem[];
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const apiKey = process.env.BREVO_API_KEY;
  const from = process.env.BREVO_FROM;

  if (!apiKey || !from)
    return { ok: false, error: "Credenciales de email no configuradas" };

  try {
    const html = await render(
      FacturasVencidasEmail({
        facturas: params.facturas,
        appUrl: APP_URL,
      }),
    );

    const res = await fetch(API_URL, {
      method: "POST",
      headers: {
        "api-key": apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        sender: { name: "SITRALOGFRU", email: from },
        to: [{ email: ALERTA_DESTINATARIO }],
        subject: "Facturas Vencidas sin pago Generado",
        htmlContent: html,
      }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      return {
        ok: false,
        error: (err as { message?: string }).message ?? `Error ${res.status}`,
      };
    }

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
