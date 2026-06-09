import { Tailwind } from '@react-email/tailwind'
import {
  Html, Head, Body, Container, Section,
  Text, Heading, Hr, Row, Column, Font,
} from '@react-email/components'
import { format } from 'date-fns'

export interface RequerimientoEmailItem {
  id:             number
  area:           string
  responsable:    string
  prioridad:      string
  diasRetraso:    number
  descripcion:    string
  fechaSolicitud: Date
}

interface Props {
  requerimientos: RequerimientoEmailItem[]
  appUrl?:        string
}

export function RequerimientosPendientesEmail({ requerimientos, appUrl = 'http://localhost:3000' }: Props) {
  const total = requerimientos.length

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
          <Container className="max-w-[560px] mx-auto bg-white rounded-xl overflow-hidden border border-black/8">

            {/* Header — rojo de alerta */}
            <Section className="bg-red-600 px-8 py-5">
              <Text className="text-white text-[13px] font-bold tracking-[1.5px] m-0">
                SITRALOGFRU
              </Text>
            </Section>

            {/* Content */}
            <Section className="px-8 pt-8 pb-6">
              <Heading className="text-[#1a1a18] text-[20px] font-bold tracking-tight m-0 mb-3">
                Requerimientos Pendientes de Atención
              </Heading>
              <Text className="text-[#6b6b65] text-sm leading-relaxed m-0 mb-5">
                Se han detectado{' '}
                <strong>{total} requerimiento{total !== 1 ? 's' : ''}</strong>{' '}
                que no {total !== 1 ? 'han sido atendidos' : 'ha sido atendido'} en{' '}
                {total !== 1 ? 'sus fechas estimadas' : 'su fecha estimada'} de atención.
                Se requiere <strong>atención y revisión inmediata.</strong>
              </Text>

              {/* Lista de requerimientos */}
              {requerimientos.map((r, i) => (
                <Section
                  key={r.id}
                  className={`py-4 ${i > 0 ? 'border-t border-black/8' : ''}`}
                >
                  {/* ID + badge prioridad */}
                  <Row className="mb-2">
                    <Column>
                      <Text className="text-[12px] font-bold text-[#1a1a18] font-mono m-0">
                        REQ-{String(r.id).padStart(4, '0')}
                      </Text>
                    </Column>
                    <Column className="text-right">
                      <Text
                        className={`text-[10px] font-bold px-2 py-1 rounded m-0 ${
                          r.prioridad === 'ALTA'
                            ? 'text-red-600 bg-red-50'
                            : 'text-orange-500 bg-orange-50'
                        }`}
                      >
                        {r.prioridad === 'ALTA' ? '⚠ ALTA' : 'MEDIA'}
                      </Text>
                    </Column>
                  </Row>

                  {/* Área + Responsable */}
                  <Row className="mb-2">
                    <Column>
                      <Text className="text-[10px] font-semibold text-[#9e9e96] uppercase tracking-[0.6px] m-0 mb-0.5">
                        Área
                      </Text>
                      <Text className="text-[13px] text-[#1a1a18] m-0">
                        {r.area}
                      </Text>
                    </Column>
                    <Column>
                      <Text className="text-[10px] font-semibold text-[#9e9e96] uppercase tracking-[0.6px] m-0 mb-0.5">
                        Responsable
                      </Text>
                      <Text className="text-[13px] text-[#1a1a18] m-0">
                        {r.responsable}
                      </Text>
                    </Column>
                  </Row>

                  {/* Días retraso + Fecha solicitud */}
                  <Row className="mb-2">
                    <Column>
                      <Text className="text-[10px] font-semibold text-[#9e9e96] uppercase tracking-[0.6px] m-0 mb-0.5">
                        Días de retraso
                      </Text>
                      <Text className="text-[13px] font-bold text-red-600 m-0">
                        {r.diasRetraso} día{r.diasRetraso !== 1 ? 's' : ''}
                      </Text>
                    </Column>
                    <Column>
                      <Text className="text-[10px] font-semibold text-[#9e9e96] uppercase tracking-[0.6px] m-0 mb-0.5">
                        Fecha solicitud
                      </Text>
                      <Text className="text-[13px] text-[#1a1a18] m-0">
                        {format(new Date(r.fechaSolicitud), 'dd/MM/yyyy')}
                      </Text>
                    </Column>
                  </Row>

                  {/* Descripción */}
                  <Row>
                    <Column>
                      <Text className="text-[10px] font-semibold text-[#9e9e96] uppercase tracking-[0.6px] m-0 mb-0.5">
                        Descripción
                      </Text>
                      <Text className="text-[12px] text-[#6b6b65] italic leading-relaxed m-0">
                        {r.descripcion.length > 200
                          ? `${r.descripcion.slice(0, 200)}...`
                          : r.descripcion}
                      </Text>
                    </Column>
                  </Row>
                </Section>
              ))}

              <Hr className="border-black/8 mt-1 mb-5" />

              <Section className="text-center">
                <a
                  href={`${appUrl}/requerimientos`}
                  className="inline-block bg-[#1a1a18] text-white text-[13px] font-semibold px-6 py-3 rounded-md no-underline"
                >
                  Ver requerimientos en el sistema
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
