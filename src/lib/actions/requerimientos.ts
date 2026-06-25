// Server Actions del módulo de Requerimientos (creación y cambio de estado)
'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { getSessionUserId, registrarAuditoria } from '@/lib/audit'
import type { EstadoRequerimiento } from '@/lib/types'

type Err = { ok: false; error: string }

// Validación de los campos requeridos al crear un requerimiento
const crearSchema = z.object({
  fechaSolicitud:        z.string().min(1),
  areaId:                z.number().int(),
  responsableId:         z.number().int(),
  prioridad:             z.enum(['ALTA', 'MEDIA']),
  tipo:                  z.enum(['COMPRA', 'SERVICIO']),
  descripcion:           z.string().min(1).max(1000),
  glosa:                 z.string().min(1).max(500),
  fechaEstimadaAtencion: z.string().optional(),
})

// Registra un nuevo requerimiento en la BD después de validar los datos con Zod
export async function crearRequerimiento(data: {
  fechaSolicitud:        string
  areaId:                number
  responsableId:         number
  prioridad:             'ALTA' | 'MEDIA'
  tipo:                  'COMPRA' | 'SERVICIO'
  descripcion:           string
  glosa:                 string
  fechaEstimadaAtencion?: string
}): Promise<{ ok: true; id: number } | Err> {
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
        glosa:                 parsed.data.glosa,
        fechaEstimadaAtencion: parsed.data.fechaEstimadaAtencion
          ? new Date(parsed.data.fechaEstimadaAtencion)
          : null,
        creadoPorId,
      },
    })

    await registrarAuditoria(creadoPorId, 'REQUERIMIENTOS', 'CREAR_REQUERIMIENTO', String(req.id), undefined, {
      areaId: req.areaId, responsableId: req.responsableId,
      prioridad: req.prioridad, tipo: req.tipo,
    })

    revalidatePath('/requerimientos')
    return { ok: true, id: req.id }
  } catch (e) {
    console.error('[crearRequerimiento]', e)
    return { ok: false, error: 'Error al registrar el requerimiento' }
  }
}

// Cambia el estado de un requerimiento, asigna al usuario que lo atendió y registra el cambio en el historial
export async function cambiarEstadoRequerimiento(
  id: number,
  estado: EstadoRequerimiento,
  observacion?: string,
  imagenUrl?: string,
): Promise<{ ok: true } | Err> {
  const userId = await getSessionUserId()
  if (!userId) return { ok: false, error: 'No autenticado' }

  const obs = observacion?.trim() || ''
  if (estado === 'ATENDIDO_PARCIAL' && !obs) {
    return { ok: false, error: 'Agrega una observación: qué se hizo y qué falta por atender.' }
  }

  try {
    const anterior = await prisma.requerimiento.findUnique({ where: { id }, select: { estado: true } })

    await prisma.requerimiento.update({
      where: { id },
      data: {
        estado,
        ...(estado !== 'PENDIENTE' && estado !== 'NO_ATENDIDO'
          ? { atendidoPorId: userId }
          : {}),
      },
    })

    await prisma.historialEstadoRequerimiento.create({
      data: {
        requerimientoId: id,
        estado,
        observacion: obs || null,
        imagenUrl: imagenUrl || null,
        registradoPorId: userId,
      },
    })

    await registrarAuditoria(userId, 'REQUERIMIENTOS', 'CAMBIAR_ESTADO', String(id),
      { estado: anterior?.estado },
      { estado, observacion: obs, imagenUrl },
    )

    revalidatePath('/requerimientos')
    revalidatePath(`/requerimientos/${id}`)
    return { ok: true }
  } catch (e) {
    console.error('[cambiarEstadoRequerimiento]', e)
    return { ok: false, error: 'Error al cambiar el estado' }
  }
}
