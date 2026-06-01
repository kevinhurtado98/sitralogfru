'use client'

import { useState, useTransition } from 'react'
import { IconArrowLeft, IconPlus, IconPencil, IconCheck, IconKey, IconBan, IconRotate, IconX } from '@tabler/icons-react'
import Link from 'next/link'
import { toast } from 'sonner'
import { crearUsuario, editarUsuario, toggleUsuarioActivo, resetPassword } from '@/lib/actions/usuarios'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import type { Rol } from '@/lib/types'

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

export function GestionarUsuariosView({ usuarios: inicial }: { usuarios: UsuarioRow[] }) {
  const [usuarios, setUsuarios]         = useState<UsuarioRow[]>(inicial)
  const [mode, setMode]                 = useState<Mode>('list')
  const [editTarget, setEditTarget]     = useState<UsuarioRow | null>(null)
  const [nombres, setNombres]           = useState('')
  const [apellidos, setApellidos]       = useState('')
  const [email, setEmail]               = useState('')
  const [rol, setRol]                   = useState<Rol>('ASISTENTE')
  const [emailError, setEmailError]     = useState('')
  const [enviarCorreo, setEnviarCorreo] = useState(true)
  const [pending, startTransition]      = useTransition()

  // Confirm dialogs
  const [confirmDeactivate, setConfirmDeactivate] = useState<UsuarioRow | null>(null)
  const [confirmReactivate, setConfirmReactivate] = useState<UsuarioRow | null>(null)
  const [confirmReset, setConfirmReset]           = useState(false)

  const emailValido  = EMAIL_RE.test(email.trim())
  const puedeGuardar = !pending && !!nombres.trim() && !!apellidos.trim() && emailValido

  const activos   = usuarios.filter(u => u.activo)
  const inactivos = usuarios.filter(u => !u.activo)

  function abrirCrear() {
    setNombres(''); setApellidos(''); setEmail(''); setRol('ASISTENTE')
    setEmailError(''); setEditTarget(null); setEnviarCorreo(true); setMode('crear')
  }

  function abrirEditar(u: UsuarioRow) {
    setNombres(u.nombres); setApellidos(u.apellidos); setEmail(u.email); setRol(u.rol as Rol)
    setEmailError(''); setEditTarget(u); setMode('editar')
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
        const res = await crearUsuario({ nombres: nombres.trim(), apellidos: apellidos.trim(), email: email.trim(), rol, enviarCorreo })
        if (!res.ok) { setEmailError(res.error); return }
        setUsuarios(prev => [...prev, res.usuario])
        toast.success('Usuario creado correctamente')
        if (enviarCorreo) {
          res.emailEnviado
            ? toast.success('Correo de bienvenida enviado')
            : toast.error(`No se pudo enviar el correo: ${res.emailError ?? 'error desconocido'}`)
        }
        setMode('list')
        return
      }
      if (mode === 'editar' && editTarget) {
        const res = await editarUsuario(editTarget.id, { nombres: nombres.trim(), apellidos: apellidos.trim(), email: email.trim(), rol })
        if (!res.ok) { setEmailError(res.error); return }
        setUsuarios(prev => prev.map(u => u.id === editTarget.id ? res.usuario : u))
        toast.success('Usuario actualizado')
        setMode('list')
      }
    })
  }

  function handleToggle(u: UsuarioRow, activo: boolean) {
    startTransition(async () => {
      const res = await toggleUsuarioActivo(u.id, activo)
      if (!res.ok) { toast.error(res.error); return }
      setUsuarios(prev => prev.map(x => x.id === u.id ? { ...x, activo } : x))
      toast.success(activo ? 'Usuario reactivado' : 'Usuario desactivado')
    })
  }

  function handleReset() {
    if (!editTarget) return
    startTransition(async () => {
      const res = await resetPassword(editTarget.id)
      res.ok ? toast.success('Contraseña reseteada a 12345678') : toast.error(res.error)
    })
  }

  return (
    <>
      {/* Header */}
      <div className="fc" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Link href="/configuracion" className="ib" title="Volver"><IconArrowLeft size={14} /></Link>
          <span style={{ fontWeight: 600, fontSize: 14 }}>Usuarios del sistema</span>
        </div>
        {mode === 'list' && (
          <button className="btn btn-p btn-sm" onClick={abrirCrear}><IconPlus size={12} /> Nuevo usuario</button>
        )}
      </div>

      {/* Formulario crear / editar */}
      {(mode === 'crear' || mode === 'editar') && (
        <div className="dc" style={{ marginBottom: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, paddingBottom: 9, borderBottom: '1px solid var(--bl)' }}>
            <span className="ss" style={{ margin: 0, padding: 0, border: 'none' }}>
              {mode === 'crear' ? 'Nuevo usuario' : 'Editar usuario'}
            </span>
            <button className="ib" onClick={() => setMode('list')}><IconX size={13} /></button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 600 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <div className="fi">
                <label>Nombres</label>
                <input type="text" placeholder="Ej: María Elena" value={nombres} onChange={e => setNombres(e.target.value)} />
              </div>
              <div className="fi">
                <label>Apellidos</label>
                <input type="text" placeholder="Ej: Ríos Torres" value={apellidos} onChange={e => setApellidos(e.target.value)} />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <div className="fi" style={{ position: 'relative' }}>
                <label>Correo (se usa para iniciar sesión)</label>
                <input type="email" placeholder="usuario@empresa.com" value={email}
                  onChange={e => handleEmailChange(e.target.value)}
                  style={emailError ? { borderColor: 'var(--red)' } : {}}
                />
                {emailError && (
                  <span style={{ position: 'absolute', bottom: -16, left: 0, fontSize: 11, color: 'var(--red)', whiteSpace: 'nowrap' }}>{emailError}</span>
                )}
              </div>
              <div className="fi">
                <label>Rol</label>
                <select value={rol} onChange={e => setRol(e.target.value as Rol)}>
                  <option value="ASISTENTE">Asistente</option>
                  <option value="ADMIN">Admin</option>
                </select>
              </div>
            </div>

            {mode === 'crear' && (
              <div style={{ background: 'var(--bg2)', border: '1px solid var(--bl)', borderRadius: 'var(--rm)', padding: '13px 15px', marginTop: emailError ? 6 : 0 }}>
                <div style={{ fontSize: 12, color: 'var(--t2)', marginBottom: 10 }}>
                  La contraseña por defecto será <strong style={{ fontFamily: 'var(--fm)', color: 'var(--t1)' }}>12345678</strong>
                </div>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', userSelect: 'none' }}>
                  <input type="checkbox" checked={enviarCorreo} onChange={e => setEnviarCorreo(e.target.checked)}
                    style={{ width: 14, height: 14, cursor: 'pointer', accentColor: '#1a1a18' }}
                  />
                  <span style={{ fontSize: 12, color: 'var(--t1)' }}>Enviar correo de bienvenida con las credenciales</span>
                </label>
              </div>
            )}

            {mode === 'editar' && (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--bg2)', border: '1px solid var(--bl)', borderRadius: 'var(--rm)', padding: '10px 13px', marginTop: emailError ? 6 : 0 }}>
                <span style={{ fontSize: 12, color: 'var(--t2)' }}>
                  Resetear contraseña a <strong style={{ fontFamily: 'var(--fm)', color: 'var(--t1)' }}>12345678</strong>
                </span>
                <button className="btn btn-sm" onClick={() => setConfirmReset(true)} disabled={pending}>
                  <IconKey size={12} /> Resetear
                </button>
              </div>
            )}

            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', paddingTop: 4 }}>
              <button className="btn" onClick={() => setMode('list')} disabled={pending}>Cancelar</button>
              <button className="btn btn-p" onClick={handleGuardar} disabled={!puedeGuardar}
                style={{ opacity: puedeGuardar ? 1 : 0.38, cursor: puedeGuardar ? 'pointer' : 'not-allowed' }}>
                {mode === 'crear' ? <><IconPlus size={13} /> Crear usuario</> : <><IconCheck size={13} /> Guardar cambios</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tabla activos */}
      <div className="dc">
        <div className="ss">Activos ({activos.length})</div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--bl)', background: 'var(--bg2)' }}>
                {['Usuario', 'Correo', 'Rol', 'Notificaciones', ''].map((h, i) => (
                  <th key={i} style={{ padding: '8px 11px', textAlign: 'left', color: 'var(--t2)', fontWeight: 500, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.4px' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {activos.length === 0 && (
                <tr><td colSpan={5} style={{ padding: '16px 11px', color: 'var(--t3)', fontSize: 13 }}>No hay usuarios activos.</td></tr>
              )}
              {activos.map(u => (
                <tr key={u.id} style={{ borderBottom: '1px solid var(--bl)' }}>
                  <td style={{ padding: '8px 11px', fontWeight: 500 }}>{u.nombres} {u.apellidos}</td>
                  <td style={{ padding: '8px 11px', fontSize: 12, fontFamily: 'var(--fm)', color: 'var(--t2)' }}>{u.email}</td>
                  <td style={{ padding: '8px 11px' }}><RolBadge rol={u.rol} /></td>
                  <td style={{ padding: '8px 11px' }}>
                    <span className={`badge ${u.notificaciones ? 'badge-green' : 'badge-slate'}`}>
                      {u.notificaciones ? 'Activas' : 'Inactivas'}
                    </span>
                  </td>
                  <td style={{ padding: '8px 11px' }}>
                    <div style={{ display: 'flex', gap: 5 }}>
                      <button className="ib" onClick={() => abrirEditar(u)} title="Editar"><IconPencil size={13} /></button>
                      <button className="ib ib-danger" onClick={() => setConfirmDeactivate(u)} title="Desactivar"><IconBan size={13} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Tabla inactivos */}
      {inactivos.length > 0 && (
        <div className="dc">
          <div className="ss">Inactivos ({inactivos.length})</div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--bl)', background: 'var(--bg2)' }}>
                  {['Usuario', 'Correo', 'Rol', ''].map((h, i) => (
                    <th key={i} style={{ padding: '8px 11px', textAlign: 'left', color: 'var(--t2)', fontWeight: 500, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.4px' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {inactivos.map(u => (
                  <tr key={u.id} style={{ borderBottom: '1px solid var(--bl)', opacity: 0.6 }}>
                    <td style={{ padding: '8px 11px', fontWeight: 500 }}>{u.nombres} {u.apellidos}</td>
                    <td style={{ padding: '8px 11px', fontSize: 12, fontFamily: 'var(--fm)', color: 'var(--t2)' }}>{u.email}</td>
                    <td style={{ padding: '8px 11px' }}><RolBadge rol={u.rol} /></td>
                    <td style={{ padding: '8px 11px' }}>
                      <button className="ib" onClick={() => setConfirmReactivate(u)} disabled={pending}
                        style={{ width: 'auto', padding: '0 9px', gap: 4 }}>
                        <IconRotate size={12} /> Reactivar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Confirm: desactivar */}
      <ConfirmDialog
        open={!!confirmDeactivate}
        onOpenChange={o => { if (!o) setConfirmDeactivate(null) }}
        title="Desactivar usuario"
        description={`¿Desactivar a ${confirmDeactivate?.nombres} ${confirmDeactivate?.apellidos}? No podrá iniciar sesión hasta que sea reactivado.`}
        confirmLabel="Desactivar"
        variant="danger"
        loading={pending}
        onConfirm={() => { if (confirmDeactivate) { handleToggle(confirmDeactivate, false); setConfirmDeactivate(null) } }}
      />

      {/* Confirm: reactivar */}
      <ConfirmDialog
        open={!!confirmReactivate}
        onOpenChange={o => { if (!o) setConfirmReactivate(null) }}
        title="Reactivar usuario"
        description={`¿Reactivar a ${confirmReactivate?.nombres} ${confirmReactivate?.apellidos}? Podrá volver a iniciar sesión.`}
        confirmLabel="Reactivar"
        loading={pending}
        onConfirm={() => { if (confirmReactivate) { handleToggle(confirmReactivate, true); setConfirmReactivate(null) } }}
      />

      {/* Confirm: reset password */}
      <ConfirmDialog
        open={confirmReset}
        onOpenChange={setConfirmReset}
        title="Resetear contraseña"
        description={`La contraseña de ${editTarget?.nombres} ${editTarget?.apellidos} será reseteada a 12345678. Deberá cambiarla en su próximo ingreso.`}
        confirmLabel="Resetear"
        variant="danger"
        loading={pending}
        onConfirm={() => { setConfirmReset(false); handleReset() }}
      />
    </>
  )
}
