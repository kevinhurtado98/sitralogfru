import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { differenceInCalendarDays } from 'date-fns'
import { sendFacturasVencidasEmail } from '@/lib/email'

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET
  if (secret) {
    const auth = request.headers.get('authorization')
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
  }

  const hoy = new Date()
  hoy.setHours(0, 0, 0, 0)

  const en7Dias = new Date(hoy)
  en7Dias.setDate(en7Dias.getDate() + 7)

  // 1. PENDIENTE/POR_VENCER con fecha ya vencida → VENCIDA
  const recienVencidas = await prisma.factura.findMany({
    where: {
      estado:           { in: ['PENDIENTE', 'POR_VENCER'] },
      fechaVencimiento: { lt: hoy },
    },
  })

  if (recienVencidas.length > 0) {
    await Promise.all(
      recienVencidas.map((f) =>
        prisma.factura.update({
          where: { id: f.id },
          data:  { estado: 'VENCIDA' },
        })
      )
    )
  }

  // 2. PENDIENTE dentro de 7 días → POR_VENCER
  const proximasAVencer = await prisma.factura.findMany({
    where: {
      estado:           'PENDIENTE',
      fechaVencimiento: { gte: hoy, lte: en7Dias },
    },
  })

  if (proximasAVencer.length > 0) {
    await Promise.all(
      proximasAVencer.map((f) =>
        prisma.factura.update({
          where: { id: f.id },
          data:  { estado: 'POR_VENCER' },
        })
      )
    )
  }

  // 3. Enviar email si hay facturas VENCIDAS (nuevas + anteriores sin pagar)
  const todasVencidas = await prisma.factura.findMany({
    where: { estado: 'VENCIDA' },
    orderBy: { fechaVencimiento: 'asc' },
  })

  let emailEnviado = false
  let emailError: string | undefined

  if (todasVencidas.length > 0) {
    const result = await sendFacturasVencidasEmail({
      facturas: todasVencidas.map((f) => ({
        id:                 f.id,
        proveedor:          f.proveedor,
        serie:              f.serie,
        numero:             f.numero,
        fechaVencimiento:   f.fechaVencimiento,
        moneda:             f.moneda,
        montoNeto:          Number(f.montoNeto),
        formaPago:          f.formaPago,
        registradoContable: f.registradoContable,
        diasVencida:        differenceInCalendarDays(hoy, f.fechaVencimiento),
      })),
    })

    emailEnviado = result.ok
    if (!result.ok) emailError = result.error
  }

  return NextResponse.json({
    ok:                true,
    recienVencidas:    recienVencidas.length,
    proximasAVencer:   proximasAVencer.length,
    totalVencidas:     todasVencidas.length,
    emailEnviado,
    ...(emailError ? { emailError } : {}),
  })
}
