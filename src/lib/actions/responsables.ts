'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

type ResponsableData = {
  id: number; nombres: string; apellidos: string; correo: string
  areaId: number; areaNombre: string; areaColor: string; areaTc: string
}
type Ok  = { ok: true; responsable: ResponsableData }
type Err = { ok: false; error: string }

const schema = z.object({
  nombres:   z.string().min(1).max(80),
  apellidos: z.string().min(1).max(80),
  correo:    z.string().email({ message: 'Correo inválido' }),
  areaId:    z.number().int(),
})

export async function crearResponsable(data: {
  nombres: string; apellidos: string; correo: string; areaId: number
}): Promise<Ok | Err> {
  const parsed = schema.safeParse(data)
  if (!parsed.success) {
    const msg = parsed.error.issues[0]?.message ?? 'Datos inválidos'
    return { ok: false, error: msg }
  }

  try {
    const r = await prisma.responsable.create({
      data: parsed.data,
      include: { area: { select: { nombre: true, color: true, tc: true } } },
    })
    revalidatePath('/configuracion')
    return {
      ok: true,
      responsable: {
        id: r.id, nombres: r.nombres, apellidos: r.apellidos, correo: r.correo,
        areaId: r.areaId, areaNombre: r.area.nombre, areaColor: r.area.color, areaTc: r.area.tc,
      },
    }
  } catch (e: unknown) {
    if ((e as { code?: string })?.code === 'P2002') return { ok: false, error: 'Ya existe un responsable con ese correo' }
    return { ok: false, error: 'Error al crear el responsable' }
  }
}

export async function eliminarResponsable(id: number): Promise<{ ok: true } | Err> {
  try {
    await prisma.responsable.delete({ where: { id } })
    revalidatePath('/configuracion')
    return { ok: true }
  } catch {
    return { ok: false, error: 'Error al eliminar el responsable' }
  }
}
