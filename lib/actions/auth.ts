'use server'

import { signIn } from '@/lib/auth'
import { AuthError } from 'next-auth'
import { z } from 'zod'
import { redirect } from 'next/navigation'

const schema = z.object({
  email: z.string().email({ message: 'Correo inválido' }),
  password: z.string().min(6, { message: 'Mínimo 6 caracteres' }),
})

type FormState = {
  errors?: { email?: string[]; password?: string[] }
  message?: string
} | undefined

export async function login(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = schema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
  })

  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors }
  }

  try {
    await signIn('credentials', {
      email: parsed.data.email,
      password: parsed.data.password,
      redirect: false,
    })
  } catch (error) {
    if (error instanceof AuthError) {
      return { message: 'Credenciales incorrectas. Verifica tu correo y contraseña.' }
    }
    return { message: 'Error del servidor. Intenta de nuevo.' }
  }

  redirect('/indicadores')
}
