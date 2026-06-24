import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { AuditoriaView } from "@/components/auditoria/AuditoriaView";
import { accionesPorCategoria, accionesPorEntidad } from "@/lib/auditoria-meta";

const PAGE_SIZE = 30;

interface Props {
  searchParams: Promise<{
    page?: string; modulo?: string; entidad?: string; tipo?: string;
    usuario?: string; desde?: string; hasta?: string;
  }>;
}

export default async function AuditoriaPage({ searchParams }: Props) {
  const sp = await searchParams;
  const page = Math.max(1, parseInt(sp.page ?? "1") || 1);

  const where: Prisma.AuditLogWhereInput = {};
  if (sp.modulo) where.modulo = sp.modulo;

  const accionesEntidad = sp.entidad ? accionesPorEntidad(sp.entidad) : null;
  const accionesTipo = sp.tipo ? accionesPorCategoria(sp.tipo) : null;
  if (accionesEntidad && accionesTipo) {
    where.accion = { in: accionesEntidad.filter((a) => accionesTipo.includes(a)) };
  } else if (accionesEntidad) {
    where.accion = { in: accionesEntidad };
  } else if (accionesTipo) {
    where.accion = { in: accionesTipo };
  }

  if (sp.usuario) {
    where.user = {
      OR: [
        { nombres: { contains: sp.usuario } },
        { apellidos: { contains: sp.usuario } },
        { email: { contains: sp.usuario } },
      ],
    };
  }
  if (sp.desde || sp.hasta) {
    where.createdAt = {};
    if (sp.desde) where.createdAt.gte = new Date(sp.desde);
    if (sp.hasta) {
      const hasta = new Date(sp.hasta);
      hasta.setHours(23, 59, 59, 999);
      where.createdAt.lte = hasta;
    }
  }

  const [total, raw] = await Promise.all([
    prisma.auditLog.count({ where }),
    prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: {
        user: { select: { nombres: true, apellidos: true, email: true } },
      },
    }),
  ]);

  const logs = raw.map((l) => ({
    ...l,
    user: {
      nombre: `${l.user.nombres} ${l.user.apellidos}`.trim(),
      email: l.user.email,
    },
  }));

  return (
    <AuditoriaView
      logs={logs}
      total={total}
      page={page}
      pageSize={PAGE_SIZE}
    />
  );
}
