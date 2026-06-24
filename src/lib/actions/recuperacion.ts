'use server'

import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { z } from 'zod'
import { registrarAuditoria } from '@/lib/audit'
import { sendCodigoRecuperacionEmail } from '@/lib/email'

const MAX_SOLICITUDES_DIA = 3
const MAX_INTENTOS_CODIGO = 5
const EXPIRACION_MINUTOS = 15

type Result = { ok: true } | { ok: false; error: string }

function generarCodigo(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

// Respuesta genérica para no revelar si el correo existe en el sistema
const RESPUESTA_GENERICA: Result = { ok: true }

const emailSchema = z.object({ email: z.string().email('Correo inválido') })

export async function solicitarRecuperacion(data: { email: string }): Promise<Result> {
  const parsed = emailSchema.safeParse(data)
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? 'Correo inválido' }

  const email = parsed.data.email

  // El límite de 3/día se cuenta por correo ingresado (exista o no la cuenta), así el mensaje
  // de "límite alcanzado" no funciona como oráculo para detectar cuentas válidas
  const desde = new Date(Date.now() - 24 * 60 * 60 * 1000)
  const solicitudesHoy = await prisma.passwordResetRequest.count({
    where: { email, createdAt: { gte: desde } },
  })
  if (solicitudesHoy >= MAX_SOLICITUDES_DIA) {
    return { ok: false, error: 'Alcanzaste el máximo de 3 solicitudes por día. Intenta más tarde.' }
  }

  await prisma.passwordResetRequest.create({ data: { email } })

  const user = await prisma.user.findUnique({ where: { email } })
  if (!user || !user.activo) return RESPUESTA_GENERICA

  // Solo el último código solicitado es válido
  await prisma.passwordResetCode.updateMany({
    where: { userId: user.id, usado: false },
    data: { usado: true },
  })

  const codigo = generarCodigo()
  const codigoHash = await bcrypt.hash(codigo, 10)
  await prisma.passwordResetCode.create({
    data: {
      userId: user.id,
      codigoHash,
      expiresAt: new Date(Date.now() + EXPIRACION_MINUTOS * 60 * 1000),
    },
  })

  const result = await sendCodigoRecuperacionEmail({
    nombres: user.nombres,
    apellidos: user.apellidos,
    correo: user.email,
    codigo,
  })
  if (!result.ok) return { ok: false, error: 'No se pudo enviar el correo. Intenta nuevamente.' }

  await registrarAuditoria(user.id, 'AUTH', 'SOLICITAR_RECUPERACION_PASSWORD', String(user.id))

  return RESPUESTA_GENERICA
}

async function buscarCodigoVigente(userId: number) {
  return prisma.passwordResetCode.findFirst({
    where: { userId, usado: false, expiresAt: { gt: new Date() } },
    orderBy: { createdAt: 'desc' },
  })
}

const codigoSchema = z.object({
  email: z.string().email(),
  codigo: z.string().length(6, 'El código debe tener 6 dígitos'),
})

export async function verificarCodigo(data: { email: string; codigo: string }): Promise<Result> {
  const parsed = codigoSchema.safeParse(data)
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? 'Datos inválidos' }

  const user = await prisma.user.findUnique({ where: { email: parsed.data.email } })
  if (!user) return { ok: false, error: 'Código inválido o expirado' }

  const registro = await buscarCodigoVigente(user.id)
  if (!registro) return { ok: false, error: 'Código inválido o expirado' }

  if (registro.intentos >= MAX_INTENTOS_CODIGO) {
    await prisma.passwordResetCode.update({ where: { id: registro.id }, data: { usado: true } })
    return { ok: false, error: 'Demasiados intentos. Solicita un nuevo código.' }
  }

  const valido = await bcrypt.compare(parsed.data.codigo, registro.codigoHash)
  if (!valido) {
    await prisma.passwordResetCode.update({ where: { id: registro.id }, data: { intentos: { increment: 1 } } })
    return { ok: false, error: 'Código incorrecto' }
  }

  return { ok: true }
}

const nuevaPasswordSchema = z
  .object({
    email: z.string().email(),
    codigo: z.string().length(6),
    nueva: z
      .string()
      .min(8, 'La contraseña debe tener al menos 8 caracteres')
      .refine((v) => /[A-Z]/.test(v) || /[0-9]/.test(v), {
        message: 'Debe incluir al menos una mayúscula o un número',
      }),
    confirmar: z.string(),
  })
  .refine((d) => d.nueva === d.confirmar, {
    message: 'Las contraseñas no coinciden',
    path: ['confirmar'],
  })

export async function restablecerPassword(data: {
  email: string
  codigo: string
  nueva: string
  confirmar: string
}): Promise<Result> {
  const parsed = nuevaPasswordSchema.safeParse(data)
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? 'Datos inválidos' }

  const user = await prisma.user.findUnique({ where: { email: parsed.data.email } })
  if (!user) return { ok: false, error: 'Código inválido o expirado' }

  const registro = await buscarCodigoVigente(user.id)
  if (!registro || registro.intentos >= MAX_INTENTOS_CODIGO) {
    return { ok: false, error: 'Código inválido o expirado' }
  }

  const valido = await bcrypt.compare(parsed.data.codigo, registro.codigoHash)
  if (!valido) {
    await prisma.passwordResetCode.update({ where: { id: registro.id }, data: { intentos: { increment: 1 } } })
    return { ok: false, error: 'Código incorrecto' }
  }

  const hash = await bcrypt.hash(parsed.data.nueva, 10)
  await prisma.$transaction([
    prisma.user.update({ where: { id: user.id }, data: { password: hash } }),
    prisma.passwordResetCode.update({ where: { id: registro.id }, data: { usado: true } }),
  ])

  await registrarAuditoria(user.id, 'AUTH', 'RESTABLECER_PASSWORD', String(user.id))

  return { ok: true }
}
