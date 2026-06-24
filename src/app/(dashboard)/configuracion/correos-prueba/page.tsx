import { auth } from "@/lib/auth";
import { CorreosPruebaView } from "@/components/configuracion/CorreosPruebaView";

export default async function CorreosPruebaPage() {
  const session = await auth();
  const correoSesion = session?.user?.email ?? "";

  return <CorreosPruebaView correoSesion={correoSesion} />;
}
