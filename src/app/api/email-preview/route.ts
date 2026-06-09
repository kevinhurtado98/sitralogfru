import { render } from '@react-email/render'
import { BienvenidaEmail } from '@/emails/BienvenidaEmail'

export async function GET() {
  const html = await render(
    BienvenidaEmail({
      nombres:    'María Elena',
      apellidos:  'Ríos Torres',
      correo:     'mrios@empresa.com',
      contrasena: '12345678',
      appUrl:     'http://localhost:3000',
    })
  )

  return new Response(html, {
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  })
}
