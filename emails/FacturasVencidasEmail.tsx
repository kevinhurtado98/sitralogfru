import { Tailwind } from '@react-email/tailwind'
import {
  Html, Head, Body, Container, Section,
  Text, Heading, Hr, Row, Column, Font,
} from '@react-email/components'
import { format } from 'date-fns'

export interface FacturaEmailItem {
  id:                 number
  proveedor:          string
  serie:              string
  numero:             string
  fechaVencimiento:   Date
  moneda:             string
  montoNeto:          number
  formaPago:          string | null
  registradoContable: boolean
  diasVencida:        number
}

interface Props {
  facturas: FacturaEmailItem[]
  appUrl?:  string
}

const MONEDA_PRE: Record<string, string> = { SOLES: 'S/', DOLARES: '$', EUROS: '€' }
const FORMA_LABEL: Record<string, string> = {
  CREDITO: 'Crédito', FACTORING: 'Factoring',
  FACTURA_NEGOCIABLE: 'Factura negociable', LETRA: 'Letra',
}

export function FacturasVencidasEmail({ facturas, appUrl = 'http://localhost:3000' }: Props) {
  const total = facturas.length

  return (
    <Tailwind>
      <Html lang="es">
        <Head>
          <Font
            fontFamily="DM Sans"
            fallbackFontFamily="Arial"
            webFont={{ url: 'https://fonts.gstatic.com/s/dmsans/v15/rP2Hp2ywxg089UriCZOIHQ.woff2', format: 'woff2' }}
            fontWeight={400}
            fontStyle="normal"
          />
        </Head>

        <Body className="bg-[#f0ede8] m-0 py-8 font-sans">
          <Container className="max-w-[580px] mx-auto bg-white rounded-xl overflow-hidden border border-black/8">

            {/* Header — ámbar de advertencia */}
            <Section className="bg-amber-700 px-8 py-5">
              <Text className="text-white text-[13px] font-bold tracking-[1.5px] m-0">
                SITRALOGFRU
              </Text>
            </Section>

            {/* Content */}
            <Section className="px-8 pt-8 pb-6">
              <Heading className="text-[#1a1a18] text-[20px] font-bold tracking-tight m-0 mb-3">
                Facturas Vencidas sin pago Generado
              </Heading>
              <Text className="text-[#6b6b65] text-sm leading-relaxed m-0 mb-5">
                Aviso de atención y revisión inmediata de{' '}
                <strong>{total} factura{total !== 1 ? 's' : ''}</strong>{' '}
                pendiente{total !== 1 ? 's' : ''} de registro contable o pagos por realizar.
              </Text>

              {/* Lista de facturas */}
              {facturas.map((f, i) => (
                <Section
                  key={f.id}
                  className={`py-4 ${i > 0 ? 'border-t border-black/8' : ''}`}
                >
                  {/* N° factura + días vencida */}
                  <Row className="mb-2">
                    <Column>
                      <Text className="text-[13px] font-bold text-[#1a1a18] font-mono m-0">
                        {f.serie}-{f.numero}
                      </Text>
                    </Column>
                    <Column className="text-right">
                      <Text className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-1 rounded m-0">
                        {f.diasVencida} día{f.diasVencida !== 1 ? 's' : ''} vencida
                      </Text>
                    </Column>
                  </Row>

                  {/* Proveedor + Vencimiento */}
                  <Row className="mb-2">
                    <Column>
                      <Text className="text-[10px] font-semibold text-[#9e9e96] uppercase tracking-[0.6px] m-0 mb-0.5">
                        Proveedor
                      </Text>
                      <Text className="text-[13px] text-[#1a1a18] m-0">
                        {f.proveedor}
                      </Text>
                    </Column>
                    <Column>
                      <Text className="text-[10px] font-semibold text-[#9e9e96] uppercase tracking-[0.6px] m-0 mb-0.5">
                        Fecha vencimiento
                      </Text>
                      <Text className="text-[13px] font-semibold text-amber-700 m-0">
                        {format(new Date(f.fechaVencimiento), 'dd/MM/yyyy')}
                      </Text>
                    </Column>
                  </Row>

                  {/* Monto + Forma pago */}
                  <Row className="mb-2">
                    <Column>
                      <Text className="text-[10px] font-semibold text-[#9e9e96] uppercase tracking-[0.6px] m-0 mb-0.5">
                        Monto a pagar
                      </Text>
                      <Text className="text-[14px] font-bold text-[#1a1a18] m-0">
                        {MONEDA_PRE[f.moneda] ?? ''}{' '}
                        {f.montoNeto.toLocaleString('es-PE', { minimumFractionDigits: 2 })}
                      </Text>
                    </Column>
                    <Column>
                      <Text className="text-[10px] font-semibold text-[#9e9e96] uppercase tracking-[0.6px] m-0 mb-0.5">
                        Forma de pago
                      </Text>
                      <Text className="text-[13px] text-[#1a1a18] m-0">
                        {f.formaPago ? FORMA_LABEL[f.formaPago] : '— Sin asignar'}
                      </Text>
                    </Column>
                  </Row>

                  {/* Registro contable */}
                  <Row>
                    <Column>
                      <Text className="text-[10px] font-semibold text-[#9e9e96] uppercase tracking-[0.6px] m-0 mb-0.5">
                        Registro contable
                      </Text>
                      <Text
                        className={`text-[12px] font-semibold m-0 ${
                          f.registradoContable ? 'text-green-600' : 'text-red-600'
                        }`}
                      >
                        {f.registradoContable ? '✓ Registrado' : '✗ Pendiente de registro'}
                      </Text>
                    </Column>
                  </Row>
                </Section>
              ))}

              <Hr className="border-black/8 mt-1 mb-5" />

              <Section className="text-center">
                <a
                  href={`${appUrl}/comprobantes`}
                  className="inline-block bg-[#1a1a18] text-white text-[13px] font-semibold px-6 py-3 rounded-md no-underline"
                >
                  Ver comprobantes en el sistema
                </a>
              </Section>
            </Section>

            {/* Footer */}
            <Section className="bg-[#f7f7f5] px-8 py-4 border-t border-black/6">
              <Text className="text-[11px] text-[#9e9e96] leading-snug m-0 text-center">
                Este correo fue generado automáticamente por SITRALOGFRU.
                Por favor no responda a este mensaje.
              </Text>
            </Section>

          </Container>
        </Body>
      </Html>
    </Tailwind>
  )
}
