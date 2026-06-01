'use client'

import { useState, useTransition } from 'react'
import { IconX, IconPlus, IconPencil, IconCheck, IconKey, IconBan, IconRotate } from '@tabler/icons-react'
import { crearUsuario, editarUsuario, toggleUsuarioActivo, resetPassword } from '@/lib/actions/usuarios'

type Rol = 'ADMIN' | 'ASISTENTE'

export type UsuarioRow = {
  id: string; nombres: string; apellidos: string; email: string
  rol: string; activo: boolean; notificaciones: boolean
}

type Mode = 'list' | 'crear' | 'editar'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function RolBadge({ rol }: { rol: string }) {
  return (
    <span className={`badge ${rol === 'ADMIN' ? 'badge-blue' : 'badge-slate'}`}>
      {rol === 'ADMIN' ? 'Admin' : 'Asistente'}
    </span>
  )
}

export function UsuariosModal({ usuarios: inicial, onClose }: { usuarios: UsuarioRow[]; onClose: () => void }) {
  const [usuarios, setUsuarios]       = useState<UsuarioRow[]>(inicial)
  const [mode, setMode]               = useState<Mode>('list')
  const [editTarget, setEditTarget]   = useState<UsuarioRow | null>(null)
  const [nombres, setNombres]         = useState('')
  const [apellidos, setApellidos]     = useState('')
  const [email, setEmail]             = useState('')
  const [rol, setRol]                 = useState<Rol>('ASISTENTE')
  const [emailError, setEmailError]   = useState('')
  const [resetOk, setResetOk]         = useState<string | null>(null)
  const [pending, startTransition]    = useTransition()

  const emailValido   = EMAIL_RE.test(email.trim())
  const puedeGuardar  = !pending && !!nombres.trim() && !!apellidos.trim() && emailValido

  function abrirCrear() {
    setNombres(''); setApellidos(''); setEmail(''); setRol('ASISTENTE')
    setEmailError(''); setEditTarget(null); setMode('crear')
  }

  function abrirEditar(u: UsuarioRow) {
    setNombres(u.nombres); setApellidos(u.apellidos); setEmail(u.email); setRol(u.rol as Rol)
    setEmailError(''); setEditTarget(u); setResetOk(null); setMode('editar')
  }

  function handleEmailChange(v: string) {
    setEmail(v); setEmailError('')
    if (v.trim() && !EMAIL_RE.test(v.trim())) setEmailError('Correo inválido')
  }

  function handleGuardar() {
    if (!puedeGuardar) return
    setEmailError('')
    startTransition(async () => {
      if (mode === 'crear') {
        const res = await crearUsuario({ nombres: nombres.trim(), apellidos: apellidos.trim(), email: email.trim(), rol })
        if (!res.ok) { setEmailError(res.error); return }
        setUsuarios(prev => [...prev, res.usuario])
      } else if (mode === 'editar' && editTarget) {
        const res = await editarUsuario(editTarget.id, { nombres: nombres.trim(), apellidos: apellidos.trim(), email: email.trim(), rol })
        if (!res.ok) { setEmailError(res.error); return }
        setUsuarios(prev => prev.map(u => u.id === editTarget.id ? res.usuario : u))
      }
      setMode('list')
    })
  }

  function handleToggle(id: string, activo: boolean) {
    startTransition(async () => {
      const res = await toggleUsuarioActivo(id, activo)
      if (!res.ok) return
      setUsuarios(prev => prev.map(u => u.id === id ? { ...u, activo } : u))
    })
  }

  function handleReset() {
    if (!editTarget) return
    setResetOk(null)
    startTransition(async () => {
      const res = await resetPassword(editTarget.id)
      if (res.ok) setResetOk('Contraseña reseteada a 12345678')
    })
  }

  const activos   = usuarios.filter(u => u.activo)
  const inactivos = usuarios.filter(u => !u.activo)

  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.35)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div style={{ background: 'var(--bg)', borderRadius: 'var(--rl)', boxShadow: '0 8px 32px rgba(0,0,0,0.18)', width: 560, maxHeight: '85vh', display: 'flex', flexDirection: 'column' }}>

        {/* Header */}
        <div style={{ padding: '16px 18px', borderBottom: '1px solid var(--bl)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {mode !== 'list' && (
              <button className="ib" onClick={() => setMode('list')}><IconX size={13} /></button>
            )}
            <span style={{ fontWeight: 600, fontSize: 14 }}>
              {mode === 'list' ? 'Gestionar usuarios' : mode === 'crear' ? 'Nuevo usuario' : 'Editar usuario'}
            </span>
          </div>
          <div style={{ display: 'flex', gap: 7 }}>
            {mode === 'list' && (
              <button className="btn btn-p btn-sm" onClick={abrirCrear}><IconPlus size={12} /> Nuevo usuario</button>
            )}
            <button className="ib" onClick={onClose}><IconX size={14} /></button>
          </div>
        </div>

        {/* Lista */}
        {mode === 'list' && (
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {activos.length === 0 && inactivos.length === 0 && (
              <div style={{ padding: '24px 18px', textAlign: 'center', color: 'var(--t3)', fontSize: 13 }}>No hay usuarios registrados.</div>
            )}

            {activos.map(u => (
              <div key={u.id} style={{ padding: '10px 18px', borderBottom: '1px solid var(--bl)', display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 500, fontSize: 13 }}>{u.nombres} {u.apellidos}</div>
                  <div style={{ fontSize: 11, color: 'var(--t2)', fontFamily: 'var(--fm)', marginTop: 1 }}>{u.email}</div>
                </div>
                <RolBadge rol={u.rol} />
                <button className="ib" onClick={() => abrirEditar(u)} title="Editar"><IconPencil size={13} /></button>
                <button className="ib ib-danger" onClick={() => handleToggle(u.id, false)} disabled={pending} title="Desactivar"><IconBan size={13} /></button>
              </div>
            ))}

            {inactivos.length > 0 && (
              <>
                <div style={{ padding: '8px 18px', fontSize: 11, fontWeight: 600, color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: '0.4px', borderBottom: '1px solid var(--bl)', background: 'var(--bg2)' }}>
                  Inactivos ({inactivos.length})
                </div>
                {inactivos.map(u => (
                  <div key={u.id} style={{ padding: '10px 18px', borderBottom: '1px solid var(--bl)', display: 'flex', alignItems: 'center', gap: 10, opacity: 0.6 }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 500, fontSize: 13 }}>{u.nombres} {u.apellidos}</div>
                      <div style={{ fontSize: 11, color: 'var(--t2)', fontFamily: 'var(--fm)', marginTop: 1 }}>{u.email}</div>
                    </div>
                    <RolBadge rol={u.rol} />
                    <button className="ib" onClick={() => handleToggle(u.id, true)} disabled={pending} style={{ width: 'auto', padding: '0 9px', gap: 4 }}>
                      <IconRotate size={12} /> Reactivar
                    </button>
                  </div>
                ))}
              </>
            )}
          </div>
        )}

        {/* Formulario crear / editar */}
        {(mode === 'crear' || mode === 'editar') && (
          <div style={{ flex: 1, overflowY: 'auto', padding: 18 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div className="fi">
                  <label>Nombres</label>
                  <input type="text" placeholder="Ej: María Elena" value={nombres} onChange={e => setNombres(e.target.value)} />
                </div>
                <div className="fi">
                  <label>Apellidos</label>
                  <input type="text" placeholder="Ej: Ríos Torres" value={apellidos} onChange={e => setApellidos(e.target.value)} />
                </div>
              </div>

              <div style={{ position: 'relative' }}>
                <div className="fi">
                  <label>Correo (se usa para iniciar sesión)</label>
                  <input
                    type="email"
                    placeholder="usuario@empresa.com"
                    value={email}
                    onChange={e => handleEmailChange(e.target.value)}
                    style={emailError ? { borderColor: 'var(--red)' } : {}}
                  />
                </div>
                {emailError && (
                  <span style={{ position: 'absolute', bottom: -16, left: 0, fontSize: 11, color: 'var(--red)', whiteSpace: 'nowrap' }}>{emailError}</span>
                )}
              </div>

              <div className="fi" style={{ marginTop: emailError ? 6 : 0 }}>
                <label>Rol</label>
                <select value={rol} onChange={e => setRol(e.target.value as Rol)}>
                  <option value="ASISTENTE">Asistente</option>
                  <option value="ADMIN">Admin</option>
                </select>
              </div>

              {mode === 'crear' && (
                <div style={{ background: 'var(--bg2)', border: '1px solid var(--bl)', borderRadius: 'var(--rm)', padding: '10px 13px', fontSize: 12, color: 'var(--t2)' }}>
                  La contraseña por defecto será <strong style={{ fontFamily: 'var(--fm)', color: 'var(--t1)' }}>12345678</strong>. El usuario deberá cambiarla en su primer ingreso.
                </div>
              )}

              {mode === 'editar' && (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--bg2)', border: '1px solid var(--bl)', borderRadius: 'var(--rm)', padding: '10px 13px' }}>
                  <span style={{ fontSize: 12, color: 'var(--t2)' }}>Resetear contraseña a <strong style={{ fontFamily: 'var(--fm)', color: 'var(--t1)' }}>12345678</strong></span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    {resetOk && <span style={{ fontSize: 11, color: 'var(--green)' }}><IconCheck size={11} style={{ display: 'inline', marginRight: 3 }} />{resetOk}</span>}
                    <button className="btn btn-sm" onClick={handleReset} disabled={pending}>
                      <IconKey size={12} /> Resetear
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Footer con botón guardar */}
        {(mode === 'crear' || mode === 'editar') && (
          <div style={{ padding: '13px 18px', borderTop: '1px solid var(--bl)', display: 'flex', justifyContent: 'flex-end', gap: 8, flexShrink: 0 }}>
            <button className="btn" onClick={() => setMode('list')} disabled={pending}>Cancelar</button>
            <button
              className="btn btn-p"
              onClick={handleGuardar}
              disabled={!puedeGuardar}
              style={{ opacity: puedeGuardar ? 1 : 0.38, cursor: puedeGuardar ? 'pointer' : 'not-allowed' }}
            >
              {mode === 'crear' ? <><IconPlus size={13} /> Crear usuario</> : <><IconCheck size={13} /> Guardar cambios</>}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
