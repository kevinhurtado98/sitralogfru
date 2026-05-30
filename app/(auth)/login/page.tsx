import { LoginForm } from '@/components/auth/LoginForm'
import { IconTruck, IconShieldCheck, IconFileText, IconClipboardList } from '@tabler/icons-react'

export default function LoginPage() {
  return (
    <>
      {/* Panel izquierdo — branding oscuro */}
      <div style={{
        width: '44%',
        background: '#1a1a18',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: '48px 52px',
        flexShrink: 0,
      }}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 40, height: 40,
            background: 'var(--blue)',
            borderRadius: 10,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <IconTruck size={20} color="#fff" />
          </div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#fff', letterSpacing: '-0.3px' }}>
              SITRALOGFRU
            </div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 1 }}>
              Fruchincha S.A.C.
            </div>
          </div>
        </div>

        {/* Texto central */}
        <div>
          <h1 style={{
            fontSize: 32, fontWeight: 700, color: '#fff',
            letterSpacing: '-1px', lineHeight: 1.25, marginBottom: 16,
          }}>
            Sistema de Gestión<br />Logística y Contable
          </h1>
          <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.45)', lineHeight: 1.7, maxWidth: 380 }}>
            Gestión de comprobantes, requerimientos y auditoría centralizada para las operaciones de Fruchincha.
          </p>

          {/* Feature list */}
          <div style={{ marginTop: 36, display: 'flex', flexDirection: 'column', gap: 14 }}>
            {[
              { icon: IconFileText,      label: 'Importación masiva de facturas XML SUNAT' },
              { icon: IconClipboardList, label: 'Gestión de requerimientos por área' },
              { icon: IconShieldCheck,   label: 'Trazabilidad completa con auditoría' },
            ].map(({ icon: Icon, label }) => (
              <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
                <div style={{
                  width: 30, height: 30, borderRadius: 8,
                  background: 'rgba(255,255,255,0.07)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0,
                }}>
                  <Icon size={14} color="rgba(255,255,255,0.6)" />
                </div>
                <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.55)' }}>{label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.2)' }}>
            © 2026 Fruchincha S.A.C. · Uso interno
          </span>
          <span style={{
            fontSize: 10, fontFamily: 'var(--fm)',
            color: 'rgba(255,255,255,0.25)',
            background: 'rgba(255,255,255,0.06)',
            padding: '3px 8px', borderRadius: 4,
          }}>
            v{process.env.NEXT_PUBLIC_APP_VERSION}
          </span>
        </div>
      </div>

      {/* Panel derecho — formulario */}
      <div style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#f0ede8',
        padding: '48px 52px',
      }}>
        <div style={{ width: '100%', maxWidth: 400 }}>
          <div style={{ marginBottom: 32 }}>
            <h2 style={{ fontSize: 22, fontWeight: 700, color: 'var(--t1)', letterSpacing: '-0.4px', marginBottom: 6 }}>
              Iniciar sesión
            </h2>
            <p style={{ fontSize: 13, color: 'var(--t3)' }}>
              Ingresa tus credenciales para acceder al sistema
            </p>
          </div>

          <LoginForm />

          <p style={{ marginTop: 24, fontSize: 12, color: 'var(--t3)', textAlign: 'center' }}>
            ¿Problemas para ingresar? Contacta al administrador del sistema.
          </p>
        </div>
      </div>
    </>
  )
}
