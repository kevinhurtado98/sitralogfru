import { Tailwind } from '@react-email/tailwind'
import {
  Html, Head, Body, Container, Section,
  Text, Heading, Hr, Row, Column, Font,
} from '@react-email/components'

interface Props {
  nombres:    string
  apellidos:  string
  correo:     string
  contrasena: string
  appUrl:     string
}

export function BienvenidaEmail({ nombres, apellidos, correo, contrasena, appUrl }: Props) {
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
          <Container className="max-w-[520px] mx-auto bg-white rounded-xl overflow-hidden border border-black/8">

            {/* Header */}
            <Section className="bg-[#1a1a18] px-8 py-5">
              <Text className="text-white text-[13px] font-bold tracking-[1.5px] m-0">
                SITRALOGFRU
              </Text>
            </Section>

            {/* Content */}
            <Section className="px-8 pt-8 pb-6">
              <Heading className="text-[#1a1a18] text-[22px] font-bold tracking-tight m-0 mb-3">
                Bienvenido al sistema
              </Heading>
              <Text className="text-[#6b6b65] text-sm leading-relaxed m-0 mb-6">
                Hola <strong>{nombres} {apellidos}</strong>, tu cuenta ha sido creada en SITRALOGFRU.
                A continuación encontrarás tus credenciales de acceso.
              </Text>

              {/* Credentials card */}
              <Section className="bg-[#f7f7f5] rounded-lg border border-black/8 px-5 py-4 mb-5">
                <Row>
                  <Column>
                    <Text className="text-[10px] font-semibold text-[#9e9e96] uppercase tracking-[0.6px] m-0 mb-1">
                      Correo
                    </Text>
                    <Text className="text-sm font-medium text-[#1a1a18] m-0">
                      {correo}
                    </Text>
                  </Column>
                </Row>
                <Hr className="border-black/8 my-3" />
                <Row>
                  <Column>
                    <Text className="text-[10px] font-semibold text-[#9e9e96] uppercase tracking-[0.6px] m-0 mb-1">
                      Contraseña temporal
                    </Text>
                    <Text className="text-[16px] font-semibold text-[#1a1a18] tracking-widest font-mono m-0">
                      {contrasena}
                    </Text>
                  </Column>
                </Row>
              </Section>

              <Text className="text-[12px] text-[#9e9e96] leading-relaxed m-0 mb-6">
                Por seguridad, te recomendamos cambiar tu contraseña la próxima vez que ingreses al sistema.
              </Text>

              <Section className="text-center mt-6">
                <a
                  href={appUrl}
                  className="inline-block bg-[#1a1a18] text-white text-[13px] font-semibold px-6 py-3 rounded-md no-underline"
                >
                  Ingresar al sistema
                </a>
              </Section>
            </Section>

            {/* Footer */}
            <Section className="bg-[#f7f7f5] px-8 py-4 border-t border-black/6">
              <Text className="text-[11px] text-[#9e9e96] leading-snug m-0 text-center">
                Este correo fue generado automáticamente por SITRALOGFRU.
                Si no esperabas este mensaje, puedes ignorarlo.
              </Text>
            </Section>

          </Container>
        </Body>
      </Html>
    </Tailwind>
  )
}
