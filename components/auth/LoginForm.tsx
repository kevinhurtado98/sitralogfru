'use client'

import { useActionState } from 'react'
import { login } from '@/lib/actions/auth'
import { AlertCircle, Loader2 } from 'lucide-react'

export function LoginForm() {
  const [state, action, isPending] = useActionState(login, undefined)

  return (
    <form action={action} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Email */}
      <div className="fi">
        <label style={{ textTransform: 'none', fontSize: 13, letterSpacing: 0, fontWeight: 500, color: 'var(--t2)' }}>
          Correo electrónico
        </label>
        <input
          name="email"
          type="email"
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
          <AlertCircle size={14} style={{ flexShrink: 0 }} />
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
          <><Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} /> Ingresando…</>
        ) : (
          'Ingresar al sistema'
        )}
      </button>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </form>
  )
}
