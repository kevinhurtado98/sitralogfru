import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { differenceInCalendarDays, addDays } from 'date-fns'
import { sendRequerimientosPendientesEmail } from '@/lib/email'

// Calcula el plazo límite de atención: usa la fecha estimada manual si existe,
// si no, lo deriva de la prioridad — Alta: mismo día de la solicitud, Media: +3 días
function calcularFechaLimite(r: { fechaSolicitud: Date; prioridad: string; fechaEstimadaAtencion: Date | null }): Date {
  if (r.fechaEstimadaAtencion) return r.fechaEstimadaAtencion
  return r.prioridad === 'ALTA' ? r.fechaSolicitud : addDays(r.fechaSolicitud, 3)
}

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

  // 1. Requerimientos PENDIENTE cuyo plazo (manual o por prioridad) ya pasó → NO_ATENDIDO
  const pendientes = await prisma.requerimiento.findMany({
    where: { estado: 'PENDIENTE' },
    select: { id: true, fechaSolicitud: true, prioridad: true, fechaEstimadaAtencion: true },
  })

  const vencidos = pendientes.filter((r) => calcularFechaLimite(r) < hoy)

  if (vencidos.length > 0) {
    await Promise.all(
      vencidos.map((r) =>
        prisma.requerimiento.update({
          where: { id: r.id },
          data: {
            estado:      'NO_ATENDIDO',
            diasRetraso: differenceInCalendarDays(hoy, calcularFechaLimite(r)),
          },
        })
      )
    )
  }

  // 2. Requerimientos ya en NO_ATENDIDO → actualizar diasRetraso
  const yaNoAtendidos = await prisma.requerimiento.findMany({
    where: { estado: 'NO_ATENDIDO' },
    select: { id: true, fechaSolicitud: true, prioridad: true, fechaEstimadaAtencion: true },
  })

  if (yaNoAtendidos.length > 0) {
    await Promise.all(
      yaNoAtendidos.map((r) =>
        prisma.requerimiento.update({
          where: { id: r.id },
          data: { diasRetraso: differenceInCalendarDays(hoy, calcularFechaLimite(r)) },
        })
      )
    )
  }

  // 3. Enviar a cada responsable solo sus propios requerimientos no atendidos
  let correosEnviados = 0
  const erroresEnvio: string[] = []

  if (vencidos.length + yaNoAtendidos.length > 0) {
    const paraEmail = await prisma.requerimiento.findMany({
      where: { estado: 'NO_ATENDIDO' },
      include: {
        area:        { select: { nombre: true } },
        responsable: { select: { correo: true, nombres: true, apellidos: true } },
      },
      orderBy: { diasRetraso: 'desc' },
    })

    const porResponsable = new Map<string, typeof paraEmail>()
    for (const r of paraEmail) {
      const grupo = porResponsable.get(r.responsable.correo) ?? []
      grupo.push(r)
      porResponsable.set(r.responsable.correo, grupo)
    }

    for (const [correo, grupo] of porResponsable) {
      const result = await sendRequerimientosPendientesEmail({
        destinatario: correo,
        requerimientos: grupo.map((r) => ({
          id:             r.id,
          area:           r.area.nombre,
          responsable:    `${r.responsable.nombres} ${r.responsable.apellidos}`.trim(),
          prioridad:      r.prioridad,
          diasRetraso:    r.diasRetraso,
          descripcion:    r.descripcion,
          fechaSolicitud: r.fechaSolicitud,
        })),
      })

      if (result.ok) correosEnviados++
      else erroresEnvio.push(`${correo}: ${result.error}`)
    }
  }

  return NextResponse.json({
    ok:             true,
    nuevosVencidos: vencidos.length,
    actualizados:   yaNoAtendidos.length,
    correosEnviados,
    ...(erroresEnvio.length > 0 ? { erroresEnvio } : {}),
  })
}
