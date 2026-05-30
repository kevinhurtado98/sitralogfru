'use server'

import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import bcrypt from 'bcryptjs'
import { z } from 'zod'

const schema = z.object({
  actual:    z.string().min(1, 'Ingresa tu contraseña actual'),
  nueva:     z.string().min(8, 'La nueva contraseña debe tener al menos 8 caracteres'),
  confirmar: z.string().min(1),
}).refine(d => d.nueva === d.confirmar, {
  message: 'Las contraseñas no coinciden',
  path: ['confirmar'],
})

type Result = { ok: true } | { ok: false; error: string; field?: 'actual' | 'nueva' | 'confirmar' }

export async function cambiarPassword(data: {
  actual: string; nueva: string; confirmar: string
}): Promise<Result> {
  const session = await auth()
  if (!session?.user?.id) return { ok: false, error: 'No autenticado' }

  const parsed = schema.safeParse(data)
  if (!parsed.success) {
    const issue = parsed.error.issues[0]
    return { ok: false, error: issue.message, field: issue.path[0] as 'actual' | 'nueva' | 'confirmar' }
  }

  const user = await prisma.user.findUnique({ where: { id: session.user.id } })
  if (!user) return { ok: false, error: 'Usuario no encontrado' }

  const actual_ok = await bcrypt.compare(parsed.data.actual, user.password)
  if (!actual_ok) return { ok: false, error: 'La contraseña actual es incorrecta', field: 'actual' }

  const hash = await bcrypt.hash(parsed.data.nueva, 10)
  await prisma.user.update({ where: { id: user.id }, data: { password: hash } })

  return { ok: true }
}
