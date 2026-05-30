'use client'

import { useState, useTransition } from 'react'
import { IconKey, IconEye, IconEyeOff } from '@tabler/icons-react'
import { toast } from 'sonner'
import { cambiarPassword } from '@/lib/actions/perfil'

function ini(name: string) {
  return name.split(' ').map(p => p[0] ?? '').slice(0, 2).join('').toUpperCase()
}

function PasswordInput({ label, value, onChange, error }: {
  label: string; value: string; onChange: (v: string) => void; error?: string
}) {
  const [show, setShow] = useState(false)
  return (
    <div className="fi" style={{ position: 'relative' }}>
      <label>{label}</label>
      <div style={{ position: 'relative' }}>
        <input
          type={show ? 'text' : 'password'}
          value={value}
          onChange={e => onChange(e.target.value)}
          style={{ paddingRight: 36, ...(error ? { borderColor: 'var(--red)' } : {}) }}
        />
        <button
          type="button"
          onClick={() => setShow(s => !s)}
          style={{ position: 'absolute', right: 9, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--t3)', padding: 0, display: 'flex' }}
        >
          {show ? <IconEyeOff size={14} /> : <IconEye size={14} />}
        </button>
      </div>
      {error && <span style={{ fontSize: 11, color: 'var(--red)', marginTop: 2 }}>{error}</span>}
    </div>
  )
}

export function PerfilView({ name, email }: { name: string; email: string }) {
  const [actual, setActual]         = useState('')
  const [nueva, setNueva]           = useState('')
  const [confirmar, setConfirmar]   = useState('')
  const [errors, setErrors]         = useState<Record<string, string>>({})
  const [pending, startTransition]  = useTransition()

  const nuevaValida    = nueva.length === 0 || nueva.length >= 8
  const coinciden      = confirmar.length === 0 || nueva === confirmar
  const puedeGuardar   = !pending && !!actual && nueva.length >= 8 && nueva === confirmar

  function handleSubmit() {
    if (!puedeGuardar) return
    setErrors({})
    startTransition(async () => {
      const res = await cambiarPassword({ actual, nueva, confirmar })
      if (!res.ok) {
        setErrors({ [res.field ?? 'actual']: res.error })
        return
      }
      toast.success('Contraseña actualizada correctamente')
      setActual(''); setNueva(''); setConfirmar(''); setErrors({})
    })
  }

  return (
    <div style={{ maxWidth: 480 }}>
      {/* Tarjeta de info */}
      <div className="dc" style={{ marginBottom: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'var(--blue-bg)', color: 'var(--blue-t)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 700, flexShrink: 0 }}>
            {ini(name)}
          </div>
          <div>
            <div style={{ fontWeight: 600, fontSize: 15 }}>{name}</div>
            <div style={{ fontSize: 12, color: 'var(--t2)', fontFamily: 'var(--fm)', marginTop: 2 }}>{email}</div>
          </div>
        </div>
      </div>

      {/* Formulario cambiar contraseña */}
      <div className="dc">
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 18, paddingBottom: 10, borderBottom: '1px solid var(--bl)' }}>
          <IconKey size={14} style={{ color: 'var(--t2)' }} />
          <span className="ss" style={{ margin: 0, padding: 0, border: 'none' }}>Cambiar contraseña</span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <PasswordInput
            label="Contraseña actual"
            value={actual}
            onChange={v => { setActual(v); setErrors(e => ({ ...e, actual: '' })) }}
            error={errors.actual}
          />
          <PasswordInput
            label="Nueva contraseña"
            value={nueva}
            onChange={v => { setNueva(v); setErrors(e => ({ ...e, nueva: '' })) }}
            error={!nuevaValida ? 'Mínimo 8 caracteres' : errors.nueva}
          />
          <PasswordInput
            label="Confirmar nueva contraseña"
            value={confirmar}
            onChange={v => { setConfirmar(v); setErrors(e => ({ ...e, confirmar: '' })) }}
            error={!coinciden ? 'Las contraseñas no coinciden' : errors.confirmar}
          />

          <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: 4 }}>
            <button
              className="btn btn-p"
              onClick={handleSubmit}
              disabled={!puedeGuardar}
              style={{ opacity: puedeGuardar ? 1 : 0.38, cursor: puedeGuardar ? 'pointer' : 'not-allowed' }}
            >
              <IconKey size={13} /> Cambiar contraseña
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
