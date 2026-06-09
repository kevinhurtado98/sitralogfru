import { prisma } from "@/lib/prisma";
import { GestionarUsuariosView } from "@/components/configuracion/GestionarUsuariosView";

export default async function GestionarUsuariosPage() {
  const raw = await prisma.user.findMany({
    select: {
      id: true,
      nombres: true,
      apellidos: true,
      email: true,
      activo: true,
      notificaciones: true,
      rol: { select: { nombre: true } },
    },
    orderBy: { createdAt: "asc" },
  });

  const usuarios = raw.map((u) => ({ ...u, rol: u.rol.nombre }));

  return <GestionarUsuariosView usuarios={usuarios} />;
}
