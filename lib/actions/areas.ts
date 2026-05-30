'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

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

export async function crearArea(data: { nombre: string; color: string; tc: string }): Promise<Ok | Err> {
  const parsed = schema.safeParse(data)
  if (!parsed.success) return { ok: false, error: 'Datos inválidos' }

  try {
    const area = await prisma.area.create({ data: parsed.data })
    revalidatePath('/configuracion')
    return { ok: true, area: toAreaData(area) }
  } catch (e: unknown) {
    if ((e as { code?: string })?.code === 'P2002') return { ok: false, error: 'Ya existe un área con ese nombre' }
    return { ok: false, error: 'Error al crear el área' }
  }
}

export async function editarArea(id: string, data: { nombre: string; color: string; tc: string }): Promise<Ok | Err> {
  const parsed = schema.safeParse(data)
  if (!parsed.success) return { ok: false, error: 'Datos inválidos' }

  try {
    const area = await prisma.area.update({ where: { id }, data: parsed.data })
    revalidatePath('/configuracion')
    return { ok: true, area: toAreaData(area) }
  } catch (e: unknown) {
    if ((e as { code?: string })?.code === 'P2002') return { ok: false, error: 'Ya existe un área con ese nombre' }
    return { ok: false, error: 'Error al editar el área' }
  }
}

export async function toggleArea(id: string, activo: boolean): Promise<{ ok: true } | Err> {
  try {
    await prisma.area.update({ where: { id }, data: { activo } })
    revalidatePath('/configuracion')
    return { ok: true }
  } catch {
    return { ok: false, error: 'Error al actualizar el área' }
  }
}
