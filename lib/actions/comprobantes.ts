'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { auth } from '@/lib/auth'

type Err = { ok: false; error: string }

async function getSessionUserId(): Promise<number | null> {
  const session = await auth()
  const rawId = session?.user?.id ?? null
  if (rawId) return Number(rawId)
  if (session?.user?.email) {
    const user = await prisma.user.findUnique({ where: { email: session.user.email }, select: { id: true } })
    return user?.id ?? null
  }
  return null
}

export async function actualizarFactura(
  id: number,
  data: {
    tipo:                   string
    formaPago:              string | null
    ordenCompra:            string
    notas:                  string
    registradoContable:     boolean
    fechaRegistroContable:  string | null
  },
): Promise<{ ok: true } | Err> {
  const userId = await getSessionUserId()
  if (!userId) return { ok: false, error: 'No autenticado' }

  try {
    const anterior = await prisma.factura.findUnique({
      where:  { id },
      select: { tipo: true, formaPago: true, ordenCompra: true, registradoContable: true },
    })

    await prisma.factura.update({
      where: { id },
      data: {
        tipo:                  data.tipo,
        formaPago:             data.formaPago || null,
        ordenCompra:           data.ordenCompra.trim() || null,
        notas:                 data.notas.trim() || null,
        registradoContable:    data.registradoContable,
        fechaRegistroContable: data.registradoContable
          ? (data.fechaRegistroContable ? new Date(data.fechaRegistroContable) : new Date())
          : null,
      },
    })

    await prisma.auditLog.create({
      data: {
        userId,
        modulo:          'COMPROBANTES',
        accion:          'EDITAR',
        entidadId:       String(id),
        datosAnteriores: JSON.stringify(anterior),
        datosNuevos:     JSON.stringify(data),
      },
    })

    revalidatePath('/comprobantes')
    revalidatePath(`/comprobantes/${id}`)
    return { ok: true }
  } catch (e) {
    console.error('[actualizarFactura]', e)
    return { ok: false, error: 'Error al actualizar la factura' }
  }
}

export async function marcarComoPagada(id: number): Promise<{ ok: true } | Err> {
  const userId = await getSessionUserId()
  if (!userId) return { ok: false, error: 'No autenticado' }

  try {
    await prisma.factura.update({
      where: { id },
      data:  { estado: 'PAGADA' },
    })

    await prisma.auditLog.create({
      data: {
        userId,
        modulo:      'COMPROBANTES',
        accion:      'MARCAR_PAGADA',
        entidadId:   String(id),
        datosNuevos: JSON.stringify({ estado: 'PAGADA' }),
      },
    })

    revalidatePath('/comprobantes')
    revalidatePath(`/comprobantes/${id}`)
    return { ok: true }
  } catch (e) {
    console.error('[marcarComoPagada]', e)
    return { ok: false, error: 'Error al marcar como pagada' }
  }
}

export async function eliminarFactura(id: number): Promise<{ ok: true } | Err> {
  const userId = await getSessionUserId()
  if (!userId) return { ok: false, error: 'No autenticado' }

  try {
    const anterior = await prisma.factura.findUnique({
      where:  { id },
      select: { serie: true, numero: true, proveedor: true },
    })

    await prisma.factura.delete({ where: { id } })

    await prisma.auditLog.create({
      data: {
        userId,
        modulo:          'COMPROBANTES',
        accion:          'ELIMINAR',
        entidadId:       String(id),
        datosAnteriores: JSON.stringify(anterior),
      },
    })

    revalidatePath('/comprobantes')
    return { ok: true }
  } catch (e) {
    console.error('[eliminarFactura]', e)
    return { ok: false, error: 'Error al eliminar la factura' }
  }
}

export async function crearNotaCredito(
  facturaId: number,
  data: { serie: string; numero: string; monto: number; descripcion: string; fecha: string },
): Promise<{ ok: true } | Err> {
  const userId = await getSessionUserId()
  if (!userId) return { ok: false, error: 'No autenticado' }

  try {
    const nota = await prisma.notaCredito.create({
      data: {
        facturaId,
        serie:       data.serie.trim(),
        numero:      data.numero.trim(),
        monto:       data.monto,
        descripcion: data.descripcion.trim() || null,
        fecha:       new Date(data.fecha),
      },
    })

    await prisma.auditLog.create({
      data: {
        userId,
        modulo:      'COMPROBANTES',
        accion:      'CREAR',
        entidadId:   String(facturaId),
        datosNuevos: JSON.stringify({ tipo: 'NOTA_CREDITO', notaId: nota.id, ...data }),
      },
    })

    revalidatePath(`/comprobantes/${facturaId}`)
    return { ok: true }
  } catch (e) {
    console.error('[crearNotaCredito]', e)
    return { ok: false, error: 'Error al crear la nota de crédito' }
  }
}

export async function crearNotaDebito(
  facturaId: number,
  data: { serie: string; numero: string; monto: number; descripcion: string; fecha: string },
): Promise<{ ok: true } | Err> {
  const userId = await getSessionUserId()
  if (!userId) return { ok: false, error: 'No autenticado' }

  try {
    const nota = await prisma.notaDebito.create({
      data: {
        facturaId,
        serie:       data.serie.trim(),
        numero:      data.numero.trim(),
        monto:       data.monto,
        descripcion: data.descripcion.trim() || null,
        fecha:       new Date(data.fecha),
      },
    })

    await prisma.auditLog.create({
      data: {
        userId,
        modulo:      'COMPROBANTES',
        accion:      'CREAR',
        entidadId:   String(facturaId),
        datosNuevos: JSON.stringify({ tipo: 'NOTA_DEBITO', notaId: nota.id, ...data }),
      },
    })

    revalidatePath(`/comprobantes/${facturaId}`)
    return { ok: true }
  } catch (e) {
    console.error('[crearNotaDebito]', e)
    return { ok: false, error: 'Error al crear la nota de débito' }
  }
}

export async function toggleRegistroContable(
  id: number,
  registrado: boolean,
): Promise<{ ok: true } | Err> {
  const userId = await getSessionUserId()
  if (!userId) return { ok: false, error: 'No autenticado' }

  try {
    await prisma.factura.update({
      where: { id },
      data: {
        registradoContable:    registrado,
        fechaRegistroContable: registrado ? new Date() : null,
      },
    })

    await prisma.auditLog.create({
      data: {
        userId,
        modulo:      'COMPROBANTES',
        accion:      'REGISTRO_CONTABLE',
        entidadId:   String(id),
        datosNuevos: JSON.stringify({ registradoContable: registrado }),
      },
    })

    revalidatePath('/comprobantes')
    return { ok: true }
  } catch (e) {
    console.error('[toggleRegistroContable]', e)
    return { ok: false, error: 'Error al actualizar registro contable' }
  }
}
