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

export function ResetPasswordEmail({ nombres, apellidos, correo, contrasena, appUrl }: Props) {
  return (
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
      <Body style={body}>
        <Container style={container}>

          {/* Header */}
          <Section style={header}>
            <Text style={headerLabel}>SITRALOGFRU</Text>
          </Section>

          {/* Body */}
          <Section style={content}>
            <Heading style={h1}>Contraseña restablecida</Heading>
            <Text style={greeting}>
              Hola <strong>{nombres} {apellidos}</strong>, un administrador ha restablecido
              tu contraseña de acceso al sistema. A continuación tus nuevas credenciales.
            </Text>

            {/* Credentials card */}
            <Section style={credCard}>
              <Row>
                <Column>
                  <Text style={credLabel}>Correo</Text>
                  <Text style={credValue}>{correo}</Text>
                </Column>
              </Row>
              <Hr style={credDivider} />
              <Row>
                <Column>
                  <Text style={credLabel}>Nueva contraseña temporal</Text>
                  <Text style={credValueMono}>{contrasena}</Text>
                </Column>
              </Row>
            </Section>

            <Section style={alertBox}>
              <Text style={alertText}>
                Si no solicitaste este cambio o crees que es un error, comunícate
                inmediatamente con el administrador del sistema.
              </Text>
            </Section>

            <Text style={note}>
              Por seguridad, te recomendamos cambiar tu contraseña después de ingresar.
            </Text>

            <Section style={{ textAlign: 'center' as const, marginTop: 24 }}>
              <a href={appUrl} style={button}>Ingresar al sistema</a>
            </Section>
          </Section>

          {/* Footer */}
          <Section style={footer}>
            <Text style={footerText}>
              Este correo fue generado automáticamente por SITRALOGFRU.
              Si no esperabas este mensaje, puedes ignorarlo.
            </Text>
          </Section>

        </Container>
      </Body>
    </Html>
  )
}

// ─── Estilos ─────────────────────────────────────────────────────────────────

const body: React.CSSProperties = {
  backgroundColor: '#f0ede8',
  fontFamily: "'DM Sans', Arial, sans-serif",
  margin: 0,
  padding: '32px 0',
}

const container: React.CSSProperties = {
  maxWidth: 520,
  margin: '0 auto',
  backgroundColor: '#ffffff',
  borderRadius: 12,
  overflow: 'hidden',
  border: '1px solid rgba(0,0,0,0.08)',
}

const header: React.CSSProperties = {
  backgroundColor: '#1a1a18',
  padding: '20px 32px',
}

const headerLabel: React.CSSProperties = {
  color: '#ffffff',
  fontSize: 13,
  fontWeight: 700,
  letterSpacing: '1.5px',
  margin: 0,
}

const content: React.CSSProperties = {
  padding: '32px 32px 24px',
}

const h1: React.CSSProperties = {
  fontSize: 22,
  fontWeight: 700,
  color: '#1a1a18',
  margin: '0 0 12px',
  letterSpacing: '-0.3px',
}

const greeting: React.CSSProperties = {
  fontSize: 14,
  color: '#6b6b65',
  lineHeight: '1.6',
  margin: '0 0 24px',
}

const credCard: React.CSSProperties = {
  backgroundColor: '#f7f7f5',
  border: '1px solid rgba(0,0,0,0.08)',
  borderRadius: 8,
  padding: '16px 20px',
  marginBottom: 16,
}

const credLabel: React.CSSProperties = {
  fontSize: 10,
  fontWeight: 600,
  color: '#9e9e96',
  textTransform: 'uppercase' as const,
  letterSpacing: '0.6px',
  margin: '0 0 3px',
}

const credValue: React.CSSProperties = {
  fontSize: 14,
  color: '#1a1a18',
  fontWeight: 500,
  margin: 0,
}

const credValueMono: React.CSSProperties = {
  ...credValue,
  fontFamily: "'DM Mono', 'Courier New', monospace",
  fontSize: 16,
  fontWeight: 600,
  letterSpacing: '1px',
}

const credDivider: React.CSSProperties = {
  borderColor: 'rgba(0,0,0,0.08)',
  margin: '12px 0',
}

const alertBox: React.CSSProperties = {
  backgroundColor: '#FAEEDA',
  border: '1px solid #FAC775',
  borderRadius: 8,
  padding: '10px 14px',
  marginBottom: 16,
}

const alertText: React.CSSProperties = {
  fontSize: 12,
  color: '#633806',
  lineHeight: '1.6',
  margin: 0,
}

const note: React.CSSProperties = {
  fontSize: 12,
  color: '#9e9e96',
  lineHeight: '1.6',
  margin: '0 0 4px',
}

const button: React.CSSProperties = {
  display: 'inline-block',
  backgroundColor: '#1a1a18',
  color: '#ffffff',
  fontSize: 13,
  fontWeight: 600,
  padding: '11px 24px',
  borderRadius: 6,
  textDecoration: 'none',
  letterSpacing: '0.1px',
}

const footer: React.CSSProperties = {
  backgroundColor: '#f7f7f5',
  padding: '16px 32px',
  borderTop: '1px solid rgba(0,0,0,0.06)',
}

const footerText: React.CSSProperties = {
  fontSize: 11,
  color: '#9e9e96',
  lineHeight: '1.5',
  margin: 0,
  textAlign: 'center' as const,
}
