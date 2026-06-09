'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import bcrypt from 'bcryptjs'
import { sendWelcomeEmail } from '@/lib/email'

const DEFAULT_PASSWORD = '12345678'

type UsuarioData = {
  id: number; nombres: string; apellidos: string; email: string
  rol: string; activo: boolean; notificaciones: boolean
}
type Ok  = { ok: true; usuario: UsuarioData }
type Err = { ok: false; error: string }

const schema = z.object({
  nombres:   z.string().min(1).max(80),
  apellidos: z.string().min(1).max(80),
  email:     z.string().email({ message: 'Correo inválido' }),
  rol:       z.enum(['ADMIN', 'ASISTENTE']),
})

const userSelect = {
  id: true, nombres: true, apellidos: true, email: true,
  activo: true, notificaciones: true,
  rol: { select: { nombre: true } },
} as const

function mapUsuario(u: { id: number; nombres: string; apellidos: string; email: string; activo: boolean; notificaciones: boolean; rol: { nombre: string } }): UsuarioData {
  return { id: u.id, nombres: u.nombres, apellidos: u.apellidos, email: u.email, activo: u.activo, notificaciones: u.notificaciones, rol: u.rol.nombre }
}

async function getRolId(nombre: string): Promise<number | null> {
  const rol = await prisma.rol.findUnique({ where: { nombre }, select: { id: true } })
  return rol?.id ?? null
}

type CrearResult = Ok & { emailEnviado?: boolean; emailError?: string }

export async function crearUsuario(data: {
  nombres: string; apellidos: string; email: string; rol: string; enviarCorreo?: boolean
}): Promise<CrearResult | Err> {
  const { enviarCorreo, ...rest } = data
  const parsed = schema.safeParse(rest)
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? 'Datos inválidos' }

  const rolId = await getRolId(parsed.data.rol)
  if (!rolId) return { ok: false, error: 'Rol no válido' }

  try {
    const password = await bcrypt.hash(DEFAULT_PASSWORD, 10)
    const u = await prisma.user.create({
      data: { nombres: parsed.data.nombres, apellidos: parsed.data.apellidos, email: parsed.data.email, password, rolId },
      select: userSelect,
    })
    revalidatePath('/configuracion')

    if (enviarCorreo) {
      const emailResult = await sendWelcomeEmail({
        nombres: u.nombres, apellidos: u.apellidos,
        correo: u.email, contrasena: DEFAULT_PASSWORD,
      })
      return { ok: true, usuario: mapUsuario(u), emailEnviado: emailResult.ok, emailError: emailResult.ok ? undefined : emailResult.error }
    }

    return { ok: true, usuario: mapUsuario(u) }
  } catch (e: unknown) {
    if ((e as { code?: string })?.code === 'P2002') return { ok: false, error: 'Ya existe un usuario con ese correo' }
    return { ok: false, error: 'Error al crear el usuario' }
  }
}

export async function editarUsuario(id: number, data: {
  nombres: string; apellidos: string; email: string; rol: string
}): Promise<Ok | Err> {
  const parsed = schema.safeParse(data)
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? 'Datos inválidos' }

  const rolId = await getRolId(parsed.data.rol)
  if (!rolId) return { ok: false, error: 'Rol no válido' }

  try {
    const u = await prisma.user.update({
      where: { id },
      data:  { nombres: parsed.data.nombres, apellidos: parsed.data.apellidos, email: parsed.data.email, rolId },
      select: userSelect,
    })
    revalidatePath('/configuracion')
    return { ok: true, usuario: mapUsuario(u) }
  } catch (e: unknown) {
    if ((e as { code?: string })?.code === 'P2002') return { ok: false, error: 'Ya existe un usuario con ese correo' }
    return { ok: false, error: 'Error al editar el usuario' }
  }
}

export async function toggleUsuarioActivo(id: number, activo: boolean): Promise<{ ok: true } | Err> {
  try {
    await prisma.user.update({ where: { id }, data: { activo } })
    revalidatePath('/configuracion')
    return { ok: true }
  } catch {
    return { ok: false, error: 'Error al actualizar el usuario' }
  }
}

export async function resetPassword(id: number): Promise<{ ok: true } | Err> {
  try {
    const password = await bcrypt.hash(DEFAULT_PASSWORD, 10)
    await prisma.user.update({ where: { id }, data: { password } })
    return { ok: true }
  } catch {
    return { ok: false, error: 'Error al resetear la contraseña' }
  }
}
