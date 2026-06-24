'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { IconAlertCircle, IconLoader2, IconArrowLeft, IconEye, IconEyeOff } from '@tabler/icons-react'
import { solicitarRecuperacion, verificarCodigo, restablecerPassword } from '@/lib/actions/recuperacion'

type Paso = 'email' | 'codigo' | 'password'

function ErrorBox({ message }: { message: string }) {
  return (
    <div
      style={{
        display: 'flex', alignItems: 'center', gap: 8,
        padding: '10px 12px',
        background: 'var(--red-bg)',
        border: '1px solid #F7C1C1',
        borderRadius: 'var(--rm)',
        fontSize: 13, color: 'var(--red-t)',
      }}
    >
      <IconAlertCircle size={14} style={{ flexShrink: 0 }} />
      {message}
    </div>
  )
}

function SubmitButton({ pending, label, pendingLabel }: { pending: boolean; label: string; pendingLabel: string }) {
  return (
    <button
      type="submit"
      disabled={pending}
      style={{
        height: 40,
        background: pending ? 'var(--bm)' : '#1a1a18',
        border: 'none',
        borderRadius: 'var(--rm)',
        color: '#fff',
        fontSize: 14,
        fontWeight: 500,
        cursor: pending ? 'not-allowed' : 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 7,
        fontFamily: 'var(--f)',
        marginTop: 4,
      }}
    >
      {pending ? (
        <><IconLoader2 size={15} style={{ animation: 'spin 1s linear infinite' }} /> {pendingLabel}</>
      ) : (
        label
      )}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </button>
  )
}

function PasswordField({ value, onChange, label, autoComplete }: {
  value: string; onChange: (v: string) => void; label: string; autoComplete: string
}) {
  const [show, setShow] = useState(false)
  return (
    <div className="fi">
      <label style={{ textTransform: 'none', fontSize: 13, letterSpacing: 0, fontWeight: 500, color: 'var(--t2)' }}>
        {label}
      </label>
      <div style={{ position: 'relative' }}>
        <input
          type={show ? 'text' : 'password'}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          autoComplete={autoComplete}
          required
          style={{ height: 40, fontSize: 14, paddingRight: 36 }}
        />
        <button
          type="button"
          onClick={() => setShow((s) => !s)}
          style={{ position: 'absolute', right: 9, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--t3)', padding: 0, display: 'flex' }}
        >
          {show ? <IconEyeOff size={14} /> : <IconEye size={14} />}
        </button>
      </div>
    </div>
  )
}

export function ForgotPasswordFlow() {
  const router = useRouter()
  const [paso, setPaso] = useState<Paso>('email')
  const [email, setEmail] = useState('')
  const [codigo, setCodigo] = useState('')
  const [nueva, setNueva] = useState('')
  const [confirmar, setConfirmar] = useState('')
  const [error, setError] = useState('')
  const [pending, startTransition] = useTransition()

  function handleSolicitar(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    startTransition(async () => {
      const res = await solicitarRecuperacion({ email })
      if (!res.ok) {
        setError(res.error)
        return
      }
      toast.success('Si el correo está registrado, te enviamos un código')
      setPaso('codigo')
    })
  }

  function handleVerificar(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    startTransition(async () => {
      const res = await verificarCodigo({ email, codigo })
      if (!res.ok) {
        setError(res.error)
        return
      }
      setPaso('password')
    })
  }

  function handleRestablecer(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (nueva !== confirmar) {
      setError('Las contraseñas no coinciden')
      return
    }
    startTransition(async () => {
      const res = await restablecerPassword({ email, codigo, nueva, confirmar })
      if (!res.ok) {
        setError(res.error)
        return
      }
      toast.success('Contraseña actualizada correctamente')
      router.push('/login')
    })
  }

  if (paso === 'email') {
    return (
      <>
        <div style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 22, fontWeight: 700, color: 'var(--t1)', letterSpacing: '-0.4px', marginBottom: 6 }}>
            Recuperar contraseña
          </h2>
          <p style={{ fontSize: 13, color: 'var(--t3)' }}>
            Ingresa tu correo y te enviaremos un código de verificación
          </p>
        </div>

        <form onSubmit={handleSolicitar} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="fi">
            <label style={{ textTransform: 'none', fontSize: 13, letterSpacing: 0, fontWeight: 500, color: 'var(--t2)' }}>
              Correo electrónico
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="usuario@fruchincha.pe"
              autoComplete="email"
              required
              style={{ height: 40, fontSize: 14 }}
            />
          </div>

          {error && <ErrorBox message={error} />}

          <SubmitButton pending={pending} label="Enviar código" pendingLabel="Enviando…" />
        </form>

        <p style={{ marginTop: 24, textAlign: 'center' }}>
          <Link href="/login" style={{ fontSize: 12, color: 'var(--t3)', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 5 }}>
            <IconArrowLeft size={13} /> Volver a iniciar sesión
          </Link>
        </p>
      </>
    )
  }

  if (paso === 'codigo') {
    return (
      <>
        <div style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 22, fontWeight: 700, color: 'var(--t1)', letterSpacing: '-0.4px', marginBottom: 6 }}>
            Ingresa el código
          </h2>
          <p style={{ fontSize: 13, color: 'var(--t3)' }}>
            Enviamos un código de 6 dígitos a <strong>{email}</strong>. Vence en 15 minutos.
          </p>
        </div>

        <form onSubmit={handleVerificar} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="fi">
            <label style={{ textTransform: 'none', fontSize: 13, letterSpacing: 0, fontWeight: 500, color: 'var(--t2)' }}>
              Código de verificación
            </label>
            <input
              type="text"
              inputMode="numeric"
              maxLength={6}
              value={codigo}
              onChange={(e) => setCodigo(e.target.value.replace(/\D/g, ''))}
              placeholder="000000"
              required
              style={{ height: 40, fontSize: 18, textAlign: 'center', letterSpacing: 6, fontFamily: 'var(--fm)' }}
            />
          </div>

          {error && <ErrorBox message={error} />}

          <SubmitButton pending={pending} label="Verificar código" pendingLabel="Verificando…" />
        </form>

        <p style={{ marginTop: 24, display: 'flex', justifyContent: 'space-between' }}>
          <button
            type="button"
            onClick={() => { setPaso('email'); setCodigo(''); setError('') }}
            style={{ fontSize: 12, color: 'var(--t3)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
          >
            Solicitar otro código
          </button>
          <Link href="/login" style={{ fontSize: 12, color: 'var(--t3)', textDecoration: 'none' }}>
            Cancelar
          </Link>
        </p>
      </>
    )
  }

  return (
    <>
      <div style={{ marginBottom: 32 }}>
        <h2 style={{ fontSize: 22, fontWeight: 700, color: 'var(--t1)', letterSpacing: '-0.4px', marginBottom: 6 }}>
          Nueva contraseña
        </h2>
        <p style={{ fontSize: 13, color: 'var(--t3)' }}>
          Mínimo 8 caracteres, con al menos una mayúscula o un número
        </p>
      </div>

      <form onSubmit={handleRestablecer} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <PasswordField label="Nueva contraseña" value={nueva} onChange={setNueva} autoComplete="new-password" />
        <PasswordField label="Confirmar contraseña" value={confirmar} onChange={setConfirmar} autoComplete="new-password" />

        {error && <ErrorBox message={error} />}

        <SubmitButton pending={pending} label="Cambiar contraseña" pendingLabel="Guardando…" />
      </form>
    </>
  )
}
