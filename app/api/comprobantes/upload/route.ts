import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { parseFacturaXML, XMLParseError, TIPO_DOC } from '@/lib/xml-parser'
import { calcularSemanaPago } from '@/lib/semana-pago'
import { addDays, differenceInDays } from 'date-fns'

type RespuestaUpload =
  | { estado: 'exitoso'; factura: { id: number; serie: string; numero: string; proveedor: string } }
  | { estado: 'ya_existe'; mensaje: string }
  | { estado: 'error'; mensaje: string }

export async function POST(request: NextRequest): Promise<NextResponse<RespuestaUpload>> {
  // ── Auth ────────────────────────────────────────────────────────────────────
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ estado: 'error', mensaje: 'No autorizado' }, { status: 401 })
  }

  // ── Recibe el archivo ────────────────────────────────────────────────────────
  let formData: FormData
  try {
    formData = await request.formData()
  } catch {
    return NextResponse.json({ estado: 'error', mensaje: 'No se pudo leer el formulario' })
  }

  const archivo = formData.get('archivo') as File | null
  if (!archivo) {
    return NextResponse.json({ estado: 'error', mensaje: 'No se recibió ningún archivo' })
  }

  if (!archivo.name.toLowerCase().endsWith('.xml')) {
    return NextResponse.json({ estado: 'error', mensaje: 'Solo se aceptan archivos .xml' })
  }

  // ── Parsea el XML ────────────────────────────────────────────────────────────
  let datos: ReturnType<typeof parseFacturaXML>
  try {
    const contenido = await archivo.text()
    datos = parseFacturaXML(contenido)
  } catch (e) {
    const msg = e instanceof XMLParseError ? e.message : 'XML inválido o estructura no reconocida'
    return NextResponse.json({ estado: 'error', mensaje: msg })
  }

  // ── Rechaza notas de crédito/débito (se cargan desde el detalle de la factura) ──
  if (datos.tipoDocumento === '07') {
    return NextResponse.json({
      estado: 'error',
      mensaje: 'Es una nota de crédito — cárgala desde el detalle de la factura',
    })
  }
  if (datos.tipoDocumento === '08') {
    return NextResponse.json({
      estado: 'error',
      mensaje: 'Es una nota de débito — cárgala desde el detalle de la factura',
    })
  }

  // ── Verifica duplicado ───────────────────────────────────────────────────────
  const existente = await prisma.factura.findFirst({
    where: { serie: datos.serie, numero: datos.numero },
    select: { id: true },
  })
  if (existente) {
    return NextResponse.json({
      estado: 'ya_existe',
      mensaje: `${datos.serie}-${datos.numero} ya está registrada`,
    })
  }

  // ── Fecha de vencimiento (default 30 días si el XML no la trae) ─────────────
  const fechaVencimiento = datos.fechaVencimiento ?? addDays(datos.fechaEmision, 30)

  // ── Estado según días hasta vencimiento ─────────────────────────────────────
  const diasHasta = differenceInDays(fechaVencimiento, new Date())
  const estado =
    diasHasta < 0 ? 'VENCIDA' : diasHasta <= 7 ? 'POR_VENCER' : ('PENDIENTE' as const)

  // ── Cálculo financiero (tipo COMPRA por defecto) ─────────────────────────────
  // El tipo se puede editar después desde el detalle de la factura
  const tipo = 'COMPRA' as const
  const retencion = parseFloat((datos.monto * 0.03).toFixed(2))
  const detraccion = 0
  const montoNeto = parseFloat((datos.monto - retencion).toFixed(2))

  // ── Semana de pago ───────────────────────────────────────────────────────────
  const { semana: semanaPago, viernesPago } = calcularSemanaPago(fechaVencimiento)

  // ── Guarda en la BD ──────────────────────────────────────────────────────────
  try {
    const factura = await prisma.factura.create({
      data: {
        proveedor: datos.proveedor,
        rucProveedor: datos.rucProveedor || null,
        serie: datos.serie,
        numero: datos.numero,
        fechaEmision: datos.fechaEmision,
        fechaVencimiento,
        moneda: datos.moneda,
        tipo,
        monto: datos.monto,
        retencion,
        detraccion,
        montoNeto,
        estado,
        semanaPago,
        viernesPago,
        creadoPorId: Number(session.user.id),
      },
    })

    await prisma.auditLog.create({
      data: {
        userId: Number(session.user.id),
        modulo: 'COMPROBANTES',
        accion: 'IMPORTAR_XML',
        entidadId: String(factura.id),
        datosNuevos: JSON.stringify({
          serie: datos.serie,
          numero: datos.numero,
          proveedor: datos.proveedor,
          monto: datos.monto,
          archivo: archivo.name,
        }),
      },
    })

    return NextResponse.json({
      estado: 'exitoso',
      factura: {
        id: factura.id,
        serie: datos.serie,
        numero: datos.numero,
        proveedor: datos.proveedor,
      },
    })
  } catch (e) {
    console.error('[upload:db]', e)
    return NextResponse.json({ estado: 'error', mensaje: 'Error al guardar en la base de datos' })
  }
}
