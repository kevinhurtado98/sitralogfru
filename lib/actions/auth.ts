'use server'

import { signIn } from '@/lib/auth'
import { AuthError } from 'next-auth'
import { z } from 'zod'
import { redirect } from 'next/navigation'
import { isRedirectError } from 'next/dist/client/components/redirect-error'

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
    // En NextAuth v5, un login exitoso puede lanzar NEXT_REDIRECT — hay que dejarlo pasar
    if (isRedirectError(error)) throw error

    if (error instanceof AuthError) {
      // Loguea el tipo exacto para verlo en Vercel Runtime Logs
      console.error('[auth] AuthError tipo:', error.type, '| mensaje:', error.message)

      switch (error.type) {
        case 'CredentialsSignin':
          return { message: 'Correo o contraseña incorrectos.' }
        case 'CallbackRouteError':
          return { message: 'Error al conectar con la base de datos. Revisa los logs.' }
        default:
          return { message: `Error de autenticación: ${error.type}` }
      }
    }

    // Error inesperado (no AuthError)
    console.error('[auth] Error inesperado:', error)
    return { message: 'Error del servidor. Intenta de nuevo.' }
  }

  redirect('/dashboard')
}
