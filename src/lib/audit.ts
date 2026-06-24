// Helper compartido para registrar movimientos en la tabla de auditoría
'use server'

import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

// Obtiene el ID del usuario autenticado desde la sesión JWT
export async function getSessionUserId(): Promise<number | null> {
  const session = await auth()
  const rawId = session?.user?.id ?? null
  if (rawId) return Number(rawId)
  if (session?.user?.email) {
    const user = await prisma.user.findUnique({ where: { email: session.user.email }, select: { id: true } })
    return user?.id ?? null
  }
  return null
}

// Inserta un registro de auditoría; nunca propaga el error para no romper la acción principal
export async function registrarAuditoria(
  userId: number,
  modulo: string,
  accion: string,
  entidadId: string,
  datosAnteriores?: object,
  datosNuevos?: object,
) {
  try {
    await prisma.auditLog.create({
      data: {
        userId, modulo, accion, entidadId,
        ...(datosAnteriores !== undefined ? { datosAnteriores: JSON.stringify(datosAnteriores) } : {}),
        ...(datosNuevos !== undefined ? { datosNuevos: JSON.stringify(datosNuevos) } : {}),
      },
    })
  } catch (e) {
    console.error('[audit]', e)
  }
}
