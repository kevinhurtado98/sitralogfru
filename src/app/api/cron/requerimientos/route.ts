import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { differenceInCalendarDays } from 'date-fns'
import { sendRequerimientosPendientesEmail } from '@/lib/email'

export async function GET(request: Request) {
  // Vercel crons send Authorization: Bearer <CRON_SECRET>
  const secret = process.env.CRON_SECRET
  if (secret) {
    const auth = request.headers.get('authorization')
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
  }

  const hoy = new Date()
  hoy.setHours(0, 0, 0, 0)

  // 1. Requerimientos PENDIENTE con fecha estimada vencida → NO_ATENDIDO
  const vencidos = await prisma.requerimiento.findMany({
    where: {
      estado:                'PENDIENTE',
      fechaEstimadaAtencion: { lt: hoy },
    },
    include: {
      area:        { select: { nombre: true } },
      responsable: { select: { nombres: true, apellidos: true } },
    },
  })

  if (vencidos.length > 0) {
    await Promise.all(
      vencidos.map((r) =>
        prisma.requerimiento.update({
          where: { id: r.id },
          data: {
            estado:      'NO_ATENDIDO',
            diasRetraso: differenceInCalendarDays(hoy, r.fechaEstimadaAtencion!),
          },
        })
      )
    )
  }

  // 2. Requerimientos ya en NO_ATENDIDO → actualizar diasRetraso
  const yaNoAtendidos = await prisma.requerimiento.findMany({
    where: {
      estado:                'NO_ATENDIDO',
      fechaEstimadaAtencion: { not: null, lt: hoy },
    },
    select: { id: true, fechaEstimadaAtencion: true },
  })

  if (yaNoAtendidos.length > 0) {
    await Promise.all(
      yaNoAtendidos.map((r) =>
        prisma.requerimiento.update({
          where: { id: r.id },
          data: { diasRetraso: differenceInCalendarDays(hoy, r.fechaEstimadaAtencion!) },
        })
      )
    )
  }

  // 3. Enviar email si hay requerimientos NO_ATENDIDO
  const totalNoAtendidos = vencidos.length + yaNoAtendidos.length
  let emailEnviado = false
  let emailError: string | undefined

  if (totalNoAtendidos > 0) {
    const paraEmail = await prisma.requerimiento.findMany({
      where: { estado: 'NO_ATENDIDO' },
      include: {
        area:        { select: { nombre: true } },
        responsable: { select: { nombres: true, apellidos: true } },
      },
      orderBy: { diasRetraso: 'desc' },
    })

    const result = await sendRequerimientosPendientesEmail({
      requerimientos: paraEmail.map((r) => ({
        id:             r.id,
        area:           r.area.nombre,
        responsable:    `${r.responsable.nombres} ${r.responsable.apellidos}`.trim(),
        prioridad:      r.prioridad,
        diasRetraso:    r.diasRetraso,
        descripcion:    r.descripcion,
        fechaSolicitud: r.fechaSolicitud,
      })),
    })

    emailEnviado = result.ok
    if (!result.ok) emailError = result.error
  }

  return NextResponse.json({
    ok:             true,
    nuevosVencidos: vencidos.length,
    actualizados:   yaNoAtendidos.length,
    emailEnviado,
    ...(emailError ? { emailError } : {}),
  })
}
