'use client'

import { usePathname } from 'next/navigation'
import { IconBell } from '@tabler/icons-react'

const TITLES: Record<string, string> = {
  '/indicadores':    'Dashboard · Indicadores',
  '/comprobantes':   'Módulo de Comprobantes',
  '/requerimientos': 'Módulo de Requerimientos',
  '/auditoria':      'Módulo de Auditorías',
  '/configuracion':  'Configuración del Sistema',
}

interface TopbarProps {
  user: { name: string; initials: string }
  hasNotif?: boolean
}

export function Topbar({ user, hasNotif = false }: TopbarProps) {
  const pathname = usePathname()
  const base = '/' + (pathname.split('/')[1] ?? '')
  const title = TITLES[base] ?? 'SITRALOGFRU'

  return (
    <div className="topbar">
      <span style={{ fontSize: 15, fontWeight: 600, flex: 1, letterSpacing: '-0.2px' }}>
        {title}
      </span>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ position: 'relative' }}>
          <IconBell size={18} style={{ color: 'var(--t2)', cursor: 'pointer' }} />
          {hasNotif && (
            <span
              style={{
                position: 'absolute', top: 1, right: 0,
                width: 7, height: 7,
                background: 'var(--red)',
                borderRadius: '50%',
                border: '1.5px solid var(--bg)',
              }}
            />
          )}
        </div>
        <div
          style={{
            width: 30, height: 30, borderRadius: '50%',
            background: 'var(--blue-bg)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 11, fontWeight: 600, color: 'var(--blue-t)',
            flexShrink: 0,
          }}
        >
          {user.initials}
        </div>
      </div>
    </div>
  )
}
