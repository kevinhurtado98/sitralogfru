'use client'

import { useState } from 'react'
import { Trash2, Pencil, Plus, Save } from 'lucide-react'
import { AREAS as INITIAL_AREAS, type Area } from '@/lib/areas'

interface UserRow {
  id: string; nombre: string; email: string; rol: string
}

export function ConfiguracionView({ usuarios }: { usuarios: UserRow[] }) {
  const [areas, setAreas]     = useState<Area[]>(INITIAL_AREAS)
  const [newArea, setNewArea]  = useState('')
  const [newResp, setNewResp]  = useState('')
  const [newEmail, setNewEmail] = useState('')

  function agregarArea() {
    if (!newArea.trim() || !newResp.trim()) return
    const ini = newResp.split(' ').map((p) => p[0] ?? '').slice(0, 2).join('').toUpperCase()
    setAreas((prev) => [...prev, { area: newArea.trim(), resp: newResp.trim(), correo: newEmail.trim(), color: 'var(--bg2)', tc: 'var(--t1)', ini }])
    setNewArea(''); setNewResp(''); setNewEmail('')
  }

  function eliminarArea(idx: number) {
    setAreas((prev) => prev.filter((_, i) => i !== idx))
  }

  return (
    <>
      {/* Áreas y responsables */}
      <div className="dc">
        <div className="ss">Áreas y responsables predeterminados</div>
        <div style={{ overflowX: 'auto', marginBottom: 13 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, minWidth: 480 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--bl)', background: 'var(--bg2)' }}>
                {['Área','Responsable','Correo','Acciones'].map((h) => (
                  <th key={h} style={{ padding: '8px 11px', textAlign: 'left', color: 'var(--t2)', fontWeight: 500, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.4px' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {areas.map((a, idx) => (
                <tr key={idx} style={{ borderBottom: '1px solid var(--bl)' }}>
                  <td style={{ padding: '8px 11px', fontWeight: 500 }}>{a.area}</td>
                  <td style={{ padding: '8px 11px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                      <div style={{ width: 24, height: 24, borderRadius: '50%', background: a.color, color: a.tc, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 600 }}>{a.ini}</div>
                      {a.resp}
                    </div>
                  </td>
                  <td style={{ padding: '8px 11px', fontSize: 12, fontFamily: 'var(--fm)', color: 'var(--t2)' }}>{a.correo}</td>
                  <td style={{ padding: '8px 11px' }}>
                    <button className="ib ib-danger" onClick={() => eliminarArea(idx)} title="Eliminar"><Trash2 size={13} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Agregar área */}
        <div style={{ background: 'var(--bg2)', border: '1px solid var(--bl)', borderRadius: 'var(--rm)', padding: '13px 15px' }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--t2)', marginBottom: 11, textTransform: 'uppercase', letterSpacing: '0.4px' }}>Agregar nueva área</div>
          <div style={{ display: 'flex', gap: 9, flexWrap: 'wrap', alignItems: 'flex-end' }}>
            <div className="fg" style={{ minWidth: 130 }}><label>Área</label>
              <input type="text" placeholder="Ej: Contabilidad" value={newArea} onChange={(e) => setNewArea(e.target.value)} />
            </div>
            <div className="fg" style={{ minWidth: 150 }}><label>Responsable</label>
              <input type="text" placeholder="Nombre completo" value={newResp} onChange={(e) => setNewResp(e.target.value)} />
            </div>
            <div className="fg" style={{ minWidth: 200 }}><label>Correo</label>
              <input type="text" placeholder="usuario@fruchincha.com.pe" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} />
            </div>
            <button className="btn btn-p" onClick={agregarArea}><Plus size={13} /> Agregar</button>
          </div>
        </div>
      </div>

      {/* Usuarios del sistema */}
      <div className="dc">
        <div className="ss">Gestión de usuarios del sistema</div>
        <div style={{ overflowX: 'auto', marginBottom: 13 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, minWidth: 400 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--bl)', background: 'var(--bg2)' }}>
                {['Usuario','Correo','Rol','Notificaciones',''].map((h, i) => (
                  <th key={i} style={{ padding: '8px 11px', textAlign: 'left', color: 'var(--t2)', fontWeight: 500, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.4px' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {usuarios.map((u) => (
                <tr key={u.id} style={{ borderBottom: '1px solid var(--bl)' }}>
                  <td style={{ padding: '8px 11px' }}>{u.nombre}</td>
                  <td style={{ padding: '8px 11px', fontSize: 12, fontFamily: 'var(--fm)', color: 'var(--t2)' }}>{u.email}</td>
                  <td style={{ padding: '8px 11px' }}>
                    <span className={`badge ${u.rol === 'ADMIN' ? 'badge-blue' : 'badge-slate'}`}>
                      {u.rol === 'ADMIN' ? 'Admin' : 'Usuario'}
                    </span>
                  </td>
                  <td style={{ padding: '8px 11px' }}>
                    <span className="badge badge-green">✓ Activas</span>
                  </td>
                  <td style={{ padding: '8px 11px' }}>
                    <button className="ib"><Pencil size={13} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <button className="btn btn-p btn-sm"><Plus size={13} /> Agregar usuario</button>
      </div>

      {/* Parámetros de pagos */}
      <div className="dc">
        <div className="ss">Parámetros de programación de pagos</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          <div className="fi"><label>Día de programación</label>
            <select><option>Lunes</option><option>Martes</option></select>
          </div>
          <div className="fi"><label>Día de pago (abono)</label>
            <select><option>Viernes</option><option>Jueves</option></select>
          </div>
        </div>
        <div style={{ marginTop: 13, display: 'flex', justifyContent: 'flex-end' }}>
          <button className="btn btn-p"><Save size={13} /> Guardar</button>
        </div>
      </div>
    </>
  )
}
