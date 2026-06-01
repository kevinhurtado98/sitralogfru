'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { auth } from '@/lib/auth'

type AreaData = { id: string; nombre: string; color: string; tc: string; activo: boolean }
type Ok = { ok: true; area: AreaData }
type Err = { ok: false; error: string }

const schema = z.object({
  nombre: z.string().min(1).max(60),
  color:  z.string().regex(/^#[0-9A-Fa-f]{6}$/),
  tc:     z.string().regex(/^#[0-9A-Fa-f]{6}$/),
})

function toAreaData(a: { id: string; nombre: string; color: string; tc: string; activo: boolean }): AreaData {
  return { id: a.id, nombre: a.nombre, color: a.color, tc: a.tc, activo: a.activo }
}

async function getUserId(): Promise<string | null> {
  const session = await auth()
  if (session?.user?.id) return session.user.id
  // Fallback: buscar por email si el JWT no tiene id (sesión antigua)
  if (session?.user?.email) {
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true },
    })
    return user?.id ?? null
  }
  return null
}

async function registrarAudit(userId: string, accion: string, entidadId: string, datosAnteriores?: object, datosNuevos?: object) {
  try {
    await prisma.auditLog.create({
      data: {
        userId,
        modulo: 'CONFIGURACION',
        accion,
        entidadId,
        ...(datosAnteriores !== undefined ? { datosAnteriores } : {}),
        ...(datosNuevos     !== undefined ? { datosNuevos }     : {}),
      },
    })
  } catch (e) {
    console.error('[audit] ERROR al guardar:', e)
  }
}

export async function crearArea(data: { nombre: string; color: string; tc: string }): Promise<Ok | Err> {
  const parsed = schema.safeParse(data)
  if (!parsed.success) return { ok: false, error: 'Datos inválidos' }

  try {
    const area = await prisma.area.create({ data: parsed.data })

    const userId = await getUserId()
    if (userId) {
      await registrarAudit(userId, 'CREAR_AREA', area.id, undefined, {
        nombre: area.nombre, color: area.color, tc: area.tc,
      })
    }

    revalidatePath('/configuracion')
    return { ok: true, area: toAreaData(area) }
  } catch (e: unknown) {
    console.error('[crearArea]', e)
    if ((e as { code?: string })?.code === 'P2002') return { ok: false, error: 'Ya existe un área con ese nombre' }
    return { ok: false, error: 'Error al crear el área' }
  }
}

export async function editarArea(id: string, data: { nombre: string; color: string; tc: string }): Promise<Ok | Err> {
  const parsed = schema.safeParse(data)
  if (!parsed.success) return { ok: false, error: 'Datos inválidos' }

  try {
    const anterior = await prisma.area.findUnique({
      where: { id },
      select: { nombre: true, color: true, tc: true },
    })

    const area = await prisma.area.update({ where: { id }, data: parsed.data })

    const userId = await getUserId()
    if (userId) {
      await registrarAudit(
        userId,
        'EDITAR_AREA',
        id,
        anterior ? { nombre: anterior.nombre, color: anterior.color, tc: anterior.tc } : undefined,
        { nombre: area.nombre, color: area.color, tc: area.tc },
      )
    }

    revalidatePath('/configuracion')
    return { ok: true, area: toAreaData(area) }
  } catch (e: unknown) {
    console.error('[editarArea]', e)
    if ((e as { code?: string })?.code === 'P2002') return { ok: false, error: 'Ya existe un área con ese nombre' }
    return { ok: false, error: 'Error al editar el área' }
  }
}

export async function toggleArea(id: string, activo: boolean): Promise<{ ok: true } | Err> {
  try {
    const anterior = await prisma.area.findUnique({
      where: { id },
      select: { nombre: true },
    })

    await prisma.area.update({ where: { id }, data: { activo } })

    const userId = await getUserId()
    if (userId) {
      await registrarAudit(
        userId,
        activo ? 'ACTIVAR_AREA' : 'DESACTIVAR_AREA',
        id,
        { nombre: anterior?.nombre ?? id, activo: !activo },
        { nombre: anterior?.nombre ?? id, activo },
      )
    }

    revalidatePath('/configuracion')
    return { ok: true }
  } catch (e) {
    console.error('[toggleArea]', e)
    return { ok: false, error: 'Error al actualizar el área' }
  }
}
