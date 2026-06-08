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
            <Heading style={h1}>Requerimientos Pendientes de Atención</Heading>
            <Text style={intro}>
              Se han detectado <strong>{total} requerimiento{total !== 1 ? 's' : ''}</strong> que no
              {total !== 1 ? ' han sido atendidos' : ' ha sido atendido'} en{' '}
              {total !== 1 ? 'sus fechas estimadas' : 'su fecha estimada'} de atención.
              Se requiere <strong>atención y revisión inmediata.</strong>
            </Text>

            {requerimientos.map((r, i) => (
              <Section key={r.id} style={{ ...reqCard, borderTop: i > 0 ? '1px solid rgba(0,0,0,0.08)' : 'none' }}>
                <Row>
                  <Column>
                    <Text style={reqId}>REQ-{String(r.id).padStart(4, '0')}</Text>
                  </Column>
                  <Column style={{ textAlign: 'right' as const }}>
                    <Text style={r.prioridad === 'ALTA' ? badgeAlta : badgeMedia}>
                      {r.prioridad === 'ALTA' ? '⚠ ALTA' : 'MEDIA'}
                    </Text>
                  </Column>
                </Row>
                <Row>
                  <Column>
                    <Text style={reqLabel}>Área</Text>
                    <Text style={reqValue}>{r.area}</Text>
                  </Column>
                  <Column>
                    <Text style={reqLabel}>Responsable</Text>
                    <Text style={reqValue}>{r.responsable}</Text>
                  </Column>
                </Row>
                <Row>
                  <Column>
                    <Text style={reqLabel}>Días de retraso</Text>
                    <Text style={{ ...reqValue, color: '#dc2626', fontWeight: 700 as const }}>
                      {r.diasRetraso} día{r.diasRetraso !== 1 ? 's' : ''}
                    </Text>
                  </Column>
                  <Column>
                    <Text style={reqLabel}>Fecha de solicitud</Text>
                    <Text style={reqValue}>{format(new Date(r.fechaSolicitud), 'dd/MM/yyyy')}</Text>
                  </Column>
                </Row>
                <Row>
                  <Column>
                    <Text style={reqLabel}>Descripción</Text>
                    <Text style={reqDesc}>
                      {r.descripcion.length > 200 ? `${r.descripcion.slice(0, 200)}...` : r.descripcion}
                    </Text>
                  </Column>
                </Row>
              </Section>
            ))}

            <Hr style={divider} />

            <Section style={{ textAlign: 'center' as const, marginTop: 20 }}>
              <a href={`${appUrl}/requerimientos`} style={button}>Ver requerimientos en el sistema</a>
            </Section>
          </Section>

          {/* Footer */}
          <Section style={footer}>
            <Text style={footerText}>
              Este correo fue generado automáticamente por SITRALOGFRU.
              Por favor no responda a este mensaje.
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
  maxWidth: 560,
  margin: '0 auto',
  backgroundColor: '#ffffff',
  borderRadius: 12,
  overflow: 'hidden',
  border: '1px solid rgba(0,0,0,0.08)',
}

const header: React.CSSProperties = {
  backgroundColor: '#dc2626',
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
  fontSize: 20,
  fontWeight: 700,
  color: '#1a1a18',
  margin: '0 0 12px',
  letterSpacing: '-0.3px',
}

const intro: React.CSSProperties = {
  fontSize: 14,
  color: '#6b6b65',
  lineHeight: '1.6',
  margin: '0 0 20px',
}

const reqCard: React.CSSProperties = {
  padding: '14px 0',
}

const divider: React.CSSProperties = {
  borderColor: 'rgba(0,0,0,0.08)',
  margin: '4px 0 0',
}

const reqId: React.CSSProperties = {
  fontSize: 12,
  fontWeight: 700,
  color: '#1a1a18',
  fontFamily: "'DM Mono', 'Courier New', monospace",
  margin: '0 0 8px',
}

const reqLabel: React.CSSProperties = {
  fontSize: 10,
  fontWeight: 600,
  color: '#9e9e96',
  textTransform: 'uppercase' as const,
  letterSpacing: '0.6px',
  margin: '0 0 2px',
}

const reqValue: React.CSSProperties = {
  fontSize: 13,
  color: '#1a1a18',
  margin: '0 0 8px',
}

const reqDesc: React.CSSProperties = {
  fontSize: 12,
  color: '#6b6b65',
  lineHeight: '1.5',
  fontStyle: 'italic',
  margin: 0,
}

const badgeAlta: React.CSSProperties = {
  display: 'inline-block',
  fontSize: 10,
  fontWeight: 700,
  color: '#dc2626',
  backgroundColor: '#fef2f2',
  padding: '2px 8px',
  borderRadius: 4,
  margin: '0 0 8px',
}

const badgeMedia: React.CSSProperties = {
  display: 'inline-block',
  fontSize: 10,
  fontWeight: 700,
  color: '#ea7316',
  backgroundColor: '#fff7ed',
  padding: '2px 8px',
  borderRadius: 4,
  margin: '0 0 8px',
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
