import { prisma } from "@/lib/prisma";
import { AuditoriaView } from "@/components/auditoria/AuditoriaView";

export default async function AuditoriaPage() {
  const raw = await prisma.auditLog.findMany({
    orderBy: { createdAt: "desc" },
    take: 200,
    include: {
      user: { select: { nombres: true, apellidos: true, email: true } },
    },
  });

  const logs = raw.map((l) => ({
    ...l,
    user: {
      nombre: `${l.user.nombres} ${l.user.apellidos}`.trim(),
      email: l.user.email,
    },
  }));

  return <AuditoriaView logs={logs} />;
}
