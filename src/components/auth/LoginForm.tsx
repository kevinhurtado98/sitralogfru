'use client'

import { useActionState, useState } from 'react'
import { login } from '@/lib/actions/auth'
import { IconAlertCircle, IconLoader2 } from '@tabler/icons-react'

const REMEMBER_KEY = 'sitralogfru:remembered-email'

function leerCorreoRecordado() {
  return typeof window !== 'undefined' ? localStorage.getItem(REMEMBER_KEY) ?? '' : ''
}

export function LoginForm() {
  const [state, action, isPending] = useActionState(login, undefined)
  const [email, setEmail] = useState(leerCorreoRecordado)
  const [recordar, setRecordar] = useState(true)

  function handleSubmit() {
    if (recordar && email) {
      localStorage.setItem(REMEMBER_KEY, email)
    } else {
      localStorage.removeItem(REMEMBER_KEY)
    }
  }

  return (
    <form action={action} onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Email */}
      <div className="fi">
        <label style={{ textTransform: 'none', fontSize: 13, letterSpacing: 0, fontWeight: 500, color: 'var(--t2)' }}>
          Correo electrónico
        </label>
        <input
          name="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="usuario@fruchincha.pe"
          autoComplete="email"
          required
          style={{ height: 40, fontSize: 14 }}
        />
        {state?.errors?.email && (
          <span style={{ fontSize: 11, color: 'var(--red)' }}>{state.errors.email[0]}</span>
        )}
      </div>

      {/* Contraseña */}
      <div className="fi">
        <label style={{ textTransform: 'none', fontSize: 13, letterSpacing: 0, fontWeight: 500, color: 'var(--t2)' }}>
          Contraseña
        </label>
        <input
          name="password"
          type="password"
          placeholder="••••••••"
          autoComplete="current-password"
          required
          style={{ height: 40, fontSize: 14 }}
        />
        {state?.errors?.password && (
          <span style={{ fontSize: 11, color: 'var(--red)' }}>{state.errors.password[0]}</span>
        )}
      </div>

      {/* Recordar usuario */}
      <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', userSelect: 'none' }}>
        <input
          type="checkbox"
          checked={recordar}
          onChange={(e) => setRecordar(e.target.checked)}
          style={{ width: 14, height: 14, cursor: 'pointer', accentColor: '#1a1a18' }}
        />
        <span style={{ fontSize: 12, color: 'var(--t2)' }}>Recordar mi usuario</span>
      </label>

      {/* Error general */}
      {state?.message && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          padding: '10px 12px',
          background: 'var(--red-bg)',
          border: '1px solid #F7C1C1',
          borderRadius: 'var(--rm)',
          fontSize: 13, color: 'var(--red-t)',
        }}>
          <IconAlertCircle size={14} style={{ flexShrink: 0 }} />
          {state.message}
        </div>
      )}

      {/* Submit */}
      <button
        type="submit"
        disabled={isPending}
        style={{
          height: 40,
          background: isPending ? 'var(--bm)' : '#1a1a18',
          border: 'none',
          borderRadius: 'var(--rm)',
          color: '#fff',
          fontSize: 14,
          fontWeight: 500,
          cursor: isPending ? 'not-allowed' : 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 7,
          fontFamily: 'var(--f)',
          transition: 'background 0.12s',
          marginTop: 4,
        }}
        onMouseEnter={(e) => { if (!isPending) e.currentTarget.style.background = '#2d2d2b' }}
        onMouseLeave={(e) => { if (!isPending) e.currentTarget.style.background = '#1a1a18' }}
      >
        {isPending ? (
          <><IconLoader2 size={15} style={{ animation: 'spin 1s linear infinite' }} /> Ingresando…</>
        ) : (
          'Ingresar al sistema'
        )}
      </button>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </form>
  )
}
