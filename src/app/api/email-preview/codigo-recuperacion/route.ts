import { render } from "@react-email/render";
import { CodigoRecuperacionEmail } from "@/emails/CodigoRecuperacionEmail";

export async function GET() {
  const html = await render(
    CodigoRecuperacionEmail({
      nombres: "María Elena",
      apellidos: "Ríos Torres",
      codigo: "482913",
    }),
  );

  return new Response(html, {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}
