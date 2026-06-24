import { Tailwind } from "@react-email/tailwind";
import {
  Html,
  Head,
  Body,
  Container,
  Section,
  Text,
  Heading,
  Font,
} from "@react-email/components";

interface Props {
  nombres: string;
  apellidos: string;
  codigo: string;
}

export function CodigoRecuperacionEmail({ nombres, apellidos, codigo }: Props) {
  return (
    <Tailwind>
      <Html lang="es">
        <Head>
          <Font
            fontFamily="DM Sans"
            fallbackFontFamily="Arial"
            webFont={{
              url: "https://fonts.gstatic.com/s/dmsans/v15/rP2Hp2ywxg089UriCZOIHQ.woff2",
              format: "woff2",
            }}
            fontWeight={400}
            fontStyle="normal"
          />
        </Head>

        <Body className="bg-[#f0ede8] m-0 py-8 font-sans">
          <Container className="max-w-130 mx-auto bg-white rounded-xl overflow-hidden border border-black/8">
            {/* Header */}
            <Section className="bg-[#1a1a18] px-8 py-5">
              <Text className="text-white text-[13px] font-bold tracking-[1.5px] m-0">
                SITRALOGFRU
              </Text>
            </Section>

            {/* Content */}
            <Section className="px-8 pt-8 pb-6">
              <Heading className="text-[#1a1a18] text-[22px] font-bold tracking-tight m-0 mb-3">
                Recupera tu contraseña
              </Heading>
              <Text className="text-[#6b6b65] text-sm leading-relaxed m-0 mb-6">
                Hola{" "}
                <strong>
                  {nombres} {apellidos}
                </strong>
                , recibimos una solicitud para restablecer tu contraseña. Usa el
                siguiente código para continuar:
              </Text>

              {/* Code card */}
              <Section className="bg-[#f7f7f5] rounded-lg border border-black/8 px-5 py-5 mb-4 text-center">
                <Text className="text-[32px] font-bold text-[#1a1a18] tracking-[8px] font-mono m-0">
                  {codigo}
                </Text>
              </Section>

              {/* Alert box */}
              <Section className="bg-[#FAEEDA] rounded-lg border border-[#FAC775] px-4 py-3 mb-4">
                <Text className="text-[12px] text-[#633806] leading-relaxed m-0">
                  Este código vence en 15 minutos. Si no solicitaste este cambio,
                  ignora este correo: tu contraseña actual seguirá funcionando.
                </Text>
              </Section>
            </Section>

            {/* Footer */}
            <Section className="bg-[#f7f7f5] px-8 py-4 border-t border-black/6">
              <Text className="text-[11px] text-[#9e9e96] leading-snug m-0 text-center">
                Este correo fue generado automáticamente por SITRALOGFRU. Si no
                esperabas este mensaje, puedes ignorarlo.
              </Text>
            </Section>
          </Container>
        </Body>
      </Html>
    </Tailwind>
  );
}
