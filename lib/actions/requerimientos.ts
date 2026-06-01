'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { auth } from '@/lib/auth'
import type { EstadoRequerimiento } from '@prisma/client'

type Err = { ok: false; error: string }

const crearSchema = z.object({
  fechaSolicitud:        z.string().min(1),
  areaId:                z.string().cuid(),
  responsableId:         z.string().cuid(),
  prioridad:             z.enum(['ALTA', 'MEDIA']),
  tipo:                  z.enum(['COMPRA', 'SERVICIO']),
  descripcion:           z.string().min(1).max(1000),
  fechaEstimadaAtencion: z.string().optional(),
})

async function getSessionUserId(): Promise<string | null> {
  const session = await auth()
  if (session?.user?.id) return session.user.id
  if (session?.user?.email) {
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true },
    })
    return user?.id ?? null
  }
  return null
}

export async function crearRequerimiento(data: {
  fechaSolicitud:        string
  areaId:                string
  responsableId:         string
  prioridad:             'ALTA' | 'MEDIA'
  tipo:                  'COMPRA' | 'SERVICIO'
  descripcion:           string
  fechaEstimadaAtencion?: string
}): Promise<{ ok: true; id: string } | Err> {
  const parsed = crearSchema.safeParse(data)
  if (!parsed.success) {
    const msg = parsed.error.issues[0]?.message ?? 'Datos inválidos'
    return { ok: false, error: msg }
  }

  const creadoPorId = await getSessionUserId()
  if (!creadoPorId) return { ok: false, error: 'No autenticado' }

  try {
    const req = await prisma.requerimiento.create({
      data: {
        fechaSolicitud:        new Date(parsed.data.fechaSolicitud),
        areaId:                parsed.data.areaId,
        responsableId:         parsed.data.responsableId,
        prioridad:             parsed.data.prioridad,
        tipo:                  parsed.data.tipo,
        descripcion:           parsed.data.descripcion,
        fechaEstimadaAtencion: parsed.data.fechaEstimadaAtencion
          ? new Date(parsed.data.fechaEstimadaAtencion)
          : null,
        creadoPorId,
      },
    })

    await prisma.auditLog.create({
      data: {
        userId:    creadoPorId,
        modulo:    'REQUERIMIENTOS',
        accion:    'CREAR_REQUERIMIENTO',
        entidadId: req.id,
        datosNuevos: {
          areaId: req.areaId, responsableId: req.responsableId,
          prioridad: req.prioridad, tipo: req.tipo,
        },
      },
    })

    revalidatePath('/requerimientos')
    return { ok: true, id: req.id }
  } catch (e) {
    console.error('[crearRequerimiento]', e)
    return { ok: false, error: 'Error al registrar el requerimiento' }
  }
}

export async function cambiarEstadoRequerimiento(
  id: string,
  estado: EstadoRequerimiento,
): Promise<{ ok: true } | Err> {
  const userId = await getSessionUserId()
  if (!userId) return { ok: false, error: 'No autenticado' }

  try {
    const anterior = await prisma.requerimiento.findUnique({
      where: { id },
      select: { estado: true },
    })

    await prisma.requerimiento.update({
      where: { id },
      data: {
        estado,
        ...(estado !== 'PENDIENTE' && estado !== 'NO_ATENDIDO'
          ? { atendidoPorId: userId }
          : {}),
      },
    })

    await prisma.auditLog.create({
      data: {
        userId,
        modulo:    'REQUERIMIENTOS',
        accion:    'CAMBIAR_ESTADO',
        entidadId: id,
        datosAnteriores: { estado: anterior?.estado },
        datosNuevos:     { estado },
      },
    })

    revalidatePath('/requerimientos')
    revalidatePath(`/requerimientos/${id}`)
    return { ok: true }
  } catch (e) {
    console.error('[cambiarEstadoRequerimiento]', e)
    return { ok: false, error: 'Error al cambiar el estado' }
  }
}
