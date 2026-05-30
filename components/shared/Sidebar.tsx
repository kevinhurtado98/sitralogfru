'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut } from 'next-auth/react'
import {
  IconLayoutDashboard,
  IconFileText,
  IconClipboardList,
  IconChartBar,
  IconShieldCheck,
  IconSettings,
  IconLogout,
  IconTruck,
  IconKey,
} from '@tabler/icons-react'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'

const NAV = [
  { label: 'Principal', items: [
    { href: '/indicadores',    label: 'Dashboard',       icon: IconLayoutDashboard },
  ]},
  { label: 'Módulos', items: [
    { href: '/comprobantes',   label: 'Comprobantes',    icon: IconFileText },
    { href: '/requerimientos', label: 'Requerimientos',  icon: IconClipboardList },
    { href: '/indicadores',    label: 'Indicadores',     icon: IconChartBar },
    { href: '/auditoria',      label: 'Auditorías',      icon: IconShieldCheck },
    { href: '/configuracion',  label: 'Configuración',   icon: IconSettings },
  ]},
]

interface SidebarProps {
  user: { name: string; email: string; initials: string }
}

export function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname()
  const [logoutOpen, setLogoutOpen] = useState(false)

  return (
    <aside
      style={{
        width: 228, minWidth: 228,
        background: 'var(--bg)',
        borderRight: '1px solid var(--bl)',
        display: 'flex', flexDirection: 'column',
        height: '100vh',
      }}
    >
      {/* Logo */}
      <div style={{ padding: '20px 16px 16px', borderBottom: '1px solid var(--bl)' }}>
        <div
          style={{
            width: 34, height: 34,
            background: 'var(--t1)',
            borderRadius: 'var(--rm)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            marginBottom: 9,
          }}
        >
          <IconTruck size={17} color="#fff" />
        </div>
        <div style={{ fontSize: 13, fontWeight: 600, letterSpacing: '-0.3px' }}>SITRALOGFRU</div>
        <div style={{ fontSize: 10, color: 'var(--t3)', marginTop: 2 }}>Sistema de Gestión Logística</div>
      </div>

      {/* Nav */}
      <div style={{ padding: '8px 0', overflowY: 'auto', flex: 1 }}>
        {NAV.map((section) => (
          <div key={section.label}>
            <div
              style={{
                fontSize: 10, fontWeight: 500, color: 'var(--t3)',
                padding: '8px 16px 3px',
                textTransform: 'uppercase', letterSpacing: '0.7px',
              }}
            >
              {section.label}
            </div>
            {section.items.map(({ href, label, icon: Icon }) => {
              const active = pathname.startsWith(href) && href !== '/indicadores'
                ? true
                : pathname === href || (href === '/indicadores' && (pathname === '/indicadores' || pathname === '/'))

              return (
                <Link
                  key={`${href}-${label}`}
                  href={href}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 9,
                    padding: '7px 16px',
                    cursor: 'pointer',
                    borderLeft: `2px solid ${active ? 'var(--blue)' : 'transparent'}`,
                    fontSize: 13,
                    fontWeight: active ? 500 : 400,
                    color: active ? 'var(--blue)' : 'var(--t2)',
                    background: active ? 'var(--blue-bg)' : 'transparent',
                    textDecoration: 'none',
                    transition: 'all 0.12s',
                  }}
                  onMouseEnter={(e) => {
                    if (!active) {
                      e.currentTarget.style.background = 'var(--bg2)'
                      e.currentTarget.style.color = 'var(--t1)'
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!active) {
                      e.currentTarget.style.background = 'transparent'
                      e.currentTarget.style.color = 'var(--t2)'
                    }
                  }}
                >
                  <Icon size={16} style={{ flexShrink: 0 }} />
                  {label}
                </Link>
              )
            })}
          </div>
        ))}
      </div>

      {/* User footer */}
      <div style={{ padding: '12px 16px', borderTop: '1px solid var(--bl)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
          <div
            style={{
              width: 28, height: 28, borderRadius: '50%',
              background: 'var(--blue-bg)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 10, fontWeight: 600, color: 'var(--blue-t)',
              flexShrink: 0,
            }}
          >
            {user.initials}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 12, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {user.name}
            </div>
            <div style={{ fontSize: 10, color: 'var(--t3)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {user.email}
            </div>
          </div>
          <Link href="/perfil" title="Cambiar contraseña" style={{ color: 'var(--t3)', display: 'flex', lineHeight: 1 }}>
            <IconKey size={15} />
          </Link>
          <button
            onClick={() => setLogoutOpen(true)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: 'var(--t3)' }}
            title="Cerrar sesión"
          >
            <IconLogout size={15} />
          </button>

          <ConfirmDialog
            open={logoutOpen}
            onOpenChange={setLogoutOpen}
            title="Cerrar sesión"
            description="¿Estás seguro que deseas cerrar sesión? Tendrás que volver a ingresar tus credenciales para acceder al sistema."
            confirmLabel="Cerrar sesión"
            cancelLabel="Cancelar"
            variant="danger"
            onConfirm={() => signOut({ callbackUrl: '/login' })}
          />
        </div>
      </div>
    </aside>
  )
}
