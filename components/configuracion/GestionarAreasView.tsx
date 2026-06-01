'use client'

import { useState, useTransition } from 'react'
import { IconArrowLeft, IconPlus, IconPencil, IconCheck, IconBan, IconRotate, IconX, IconTrash } from '@tabler/icons-react'
import Link from 'next/link'
import { toast } from 'sonner'
import { crearArea, editarArea, toggleArea } from '@/lib/actions/areas'
import { crearResponsable, eliminarResponsable } from '@/lib/actions/responsables'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'

type AreaRow = { id: number; nombre: string; color: string; tc: string; activo: boolean }
type ResponsableRow = {
  id: number; nombres: string; apellidos: string; correo: string
  areaId: number; areaNombre: string; areaColor: string; areaTc: string
}

const PALETA = [
  { color: '#E1F5EE', tc: '#0F6E56' },
  { color: '#EAF3DE', tc: '#27500A' },
  { color: '#E6F1FB', tc: '#0C447C' },
  { color: '#FAEEDA', tc: '#633806' },
  { color: '#FAECE7', tc: '#712B13' },
  { color: '#FBEAF0', tc: '#72243E' },
  { color: '#FCEBEB', tc: '#791F1F' },
  { color: '#F0EDE8', tc: '#6B6B65' },
]

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function ini(texto: string) {
  return texto.split(' ').map(p => p[0] ?? '').slice(0, 2).join('').toUpperCase()
}

function Avatar({ color, tc, nombre }: { color: string; tc: string; nombre: string }) {
  return (
    <div style={{ width: 28, height: 28, borderRadius: '50%', background: color, color: tc, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, flexShrink: 0 }}>
      {ini(nombre || '?')}
    </div>
  )
}

function ColorPicker({ value, onChange }: { value: string; onChange: (c: string, tc: string) => void }) {
  return (
    <div style={{ display: 'flex', gap: 5 }}>
      {PALETA.map(p => (
        <button key={p.color} type="button" onClick={() => onChange(p.color, p.tc)}
          style={{ width: 18, height: 18, borderRadius: '50%', background: p.color, border: value === p.color ? `2px solid ${p.tc}` : '2px solid transparent', cursor: 'pointer', flexShrink: 0 }}
        />
      ))}
    </div>
  )
}

export function GestionarAreasView({ areas: inicial, responsables: inicialResp }: { areas: AreaRow[]; responsables: ResponsableRow[] }) {
  const [areas, setAreas]               = useState<AreaRow[]>(inicial)
  const [responsables, setResponsables] = useState<ResponsableRow[]>(inicialResp)
  const [tabAreas, setTabAreas]         = useState<'activas' | 'inactivas'>('activas')
  const [editId, setEditId]             = useState<number | null>(null)
  const [editNombre, setEditNombre]     = useState('')
  const [editColor, setEditColor]       = useState(PALETA[0].color)
  const [editTc, setEditTc]             = useState(PALETA[0].tc)
  const [newAreaNombre, setNewAreaNombre] = useState('')
  const [newAreaColor, setNewAreaColor] = useState(PALETA[0].color)
  const [newAreaTc, setNewAreaTc]       = useState(PALETA[0].tc)
  const [areaError, setAreaError]       = useState('')
  const [confirmDesactivar, setConfirmDesactivar] = useState<AreaRow | null>(null)
  const [confirmEliminarResp, setConfirmEliminarResp] = useState<ResponsableRow | null>(null)

  const [newNombres, setNewNombres]     = useState('')
  const [newApellidos, setNewApellidos] = useState('')
  const [newCorreo, setNewCorreo]       = useState('')
  const [newAreaId, setNewAreaId]       = useState('')
  const [correoError, setCorreoError]   = useState('')

  const [pending, startTransition]      = useTransition()

  const activas   = areas.filter(a => a.activo)
  const inactivas = areas.filter(a => !a.activo)
  const listaAreas = tabAreas === 'activas' ? activas : inactivas

  const correoValido = EMAIL_RE.test(newCorreo.trim())
  const puedeAgregarResp = !pending && !!newAreaId && !!newNombres.trim() && !!newApellidos.trim() && correoValido

  // ── Áreas ────────────────────────────────────────────────────────────────

  function startEdit(a: AreaRow) {
    setEditId(a.id); setEditNombre(a.nombre); setEditColor(a.color); setEditTc(a.tc); setAreaError('')
  }

  function handleEditarArea() {
    if (!editNombre.trim() || !editId) return
    setAreaError('')
    startTransition(async () => {
      const res = await editarArea(editId, { nombre: editNombre.trim(), color: editColor, tc: editTc })
      if (!res.ok) { setAreaError(res.error); return }
      setAreas(prev => prev.map(a => a.id === editId ? res.area : a))
      setEditId(null)
      toast.success('Área actualizada')
    })
  }

  function handleToggleArea(a: AreaRow, activo: boolean) {
    startTransition(async () => {
      const res = await toggleArea(a.id, activo)
      if (!res.ok) { toast.error(res.error); return }
      setAreas(prev => prev.map(x => x.id === a.id ? { ...x, activo } : x))
      toast.success(activo ? 'Área reactivada' : 'Área desactivada')
    })
  }

  function handleCrearArea() {
    if (!newAreaNombre.trim()) return
    setAreaError('')
    startTransition(async () => {
      const res = await crearArea({ nombre: newAreaNombre.trim(), color: newAreaColor, tc: newAreaTc })
      if (!res.ok) { setAreaError(res.error); return }
      setAreas(prev => [...prev, res.area])
      setNewAreaNombre(''); setNewAreaColor(PALETA[0].color); setNewAreaTc(PALETA[0].tc)
      setTabAreas('activas')
      toast.success('Área creada')
    })
  }

  // ── Responsables ─────────────────────────────────────────────────────────

  function handleCorreoChange(v: string) {
    setNewCorreo(v); setCorreoError('')
    if (v.trim() && !EMAIL_RE.test(v.trim())) setCorreoError('Correo inválido')
  }

  function handleCrearResponsable() {
    if (!puedeAgregarResp) return
    setCorreoError('')
    startTransition(async () => {
      const res = await crearResponsable({ nombres: newNombres.trim(), apellidos: newApellidos.trim(), correo: newCorreo.trim(), areaId: parseInt(newAreaId) })
      if (!res.ok) { setCorreoError(res.error); return }
      setResponsables(prev => [...prev, res.responsable])
      setNewNombres(''); setNewApellidos(''); setNewCorreo(''); setNewAreaId('')
      toast.success('Responsable agregado')
    })
  }

  function handleEliminarResponsable(r: ResponsableRow) {
    startTransition(async () => {
      const res = await eliminarResponsable(r.id)
      if (!res.ok) { toast.error(res.error); return }
      setResponsables(prev => prev.filter(x => x.id !== r.id))
      toast.success('Responsable eliminado')
    })
  }

  return (
    <>
      {/* Header */}
      <div className="fc" style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
        <Link href="/configuracion" className="ib" title="Volver"><IconArrowLeft size={14} /></Link>
        <span style={{ fontWeight: 600, fontSize: 14 }}>Áreas y responsables</span>
      </div>

      {/* ── ÁREAS ── */}
      <div className="dc">
        {/* Tabs */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 0, paddingBottom: 0 }}>
          <div style={{ display: 'flex', gap: 0, borderBottom: '1px solid var(--bl)', flex: 1 }}>
            {(['activas', 'inactivas'] as const).map(t => (
              <button key={t} onClick={() => { setTabAreas(t); setEditId(null); setAreaError('') }}
                style={{ padding: '8px 14px', fontSize: 12, fontWeight: 500, cursor: 'pointer', background: 'none', border: 'none', fontFamily: 'var(--f)', color: tabAreas === t ? 'var(--t1)' : 'var(--t3)', borderBottom: tabAreas === t ? '2px solid var(--t1)' : '2px solid transparent', marginBottom: -1, textTransform: 'capitalize' as const }}>
                {t === 'activas' ? `Activas (${activas.length})` : `Inactivas (${inactivas.length})`}
              </button>
            ))}
          </div>
        </div>

        {/* Lista áreas */}
        <div style={{ marginBottom: 14 }}>
          {listaAreas.length === 0 && (
            <div style={{ padding: '16px 0', color: 'var(--t3)', fontSize: 13 }}>
              {tabAreas === 'activas' ? 'No hay áreas activas.' : 'No hay áreas inactivas.'}
            </div>
          )}
          {listaAreas.map(a => (
            <div key={a.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 0', borderBottom: '1px solid var(--bl)' }}>
              {editId === a.id ? (
                <>
                  <Avatar color={editColor} tc={editTc} nombre={editNombre} />
                  <input autoFocus value={editNombre} onChange={e => setEditNombre(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') handleEditarArea(); if (e.key === 'Escape') setEditId(null) }}
                    style={{ flex: 1, height: 30, fontSize: 13, padding: '0 8px', border: '1px solid var(--bm)', borderRadius: 'var(--r)', fontFamily: 'var(--f)', outline: 'none' }}
                  />
                  <ColorPicker value={editColor} onChange={(c, tc) => { setEditColor(c); setEditTc(tc) }} />
                  <button className="ib" onClick={handleEditarArea} disabled={pending}><IconCheck size={13} /></button>
                  <button className="ib" onClick={() => setEditId(null)}><IconX size={13} /></button>
                </>
              ) : (
                <>
                  <Avatar color={a.color} tc={a.tc} nombre={a.nombre} />
                  <span style={{ flex: 1, fontSize: 13, fontWeight: 500 }}>{a.nombre}</span>
                  {tabAreas === 'activas' ? (
                    <>
                      <button className="ib" onClick={() => startEdit(a)} title="Editar"><IconPencil size={13} /></button>
                      <button className="ib ib-danger" onClick={() => setConfirmDesactivar(a)} title="Desactivar"><IconBan size={13} /></button>
                    </>
                  ) : (
                    <button className="ib" onClick={() => handleToggleArea(a, true)} disabled={pending} style={{ width: 'auto', padding: '0 9px', gap: 4 }}>
                      <IconRotate size={12} /> Reactivar
                    </button>
                  )}
                </>
              )}
            </div>
          ))}
        </div>

        {/* Nueva área */}
        <div style={{ background: 'var(--bg2)', border: '1px solid var(--bl)', borderRadius: 'var(--rm)', padding: '12px 14px' }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--t2)', marginBottom: 10, textTransform: 'uppercase' as const, letterSpacing: '0.4px' }}>Nueva área</div>
          {areaError && <div style={{ fontSize: 12, color: 'var(--red)', marginBottom: 8 }}>{areaError}</div>}
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <Avatar color={newAreaColor} tc={newAreaTc} nombre={newAreaNombre} />
            <input placeholder="Nombre del área" value={newAreaNombre} onChange={e => setNewAreaNombre(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleCrearArea() }}
              style={{ flex: 1, height: 30, fontSize: 13, padding: '0 8px', border: '1px solid var(--bm)', borderRadius: 'var(--r)', fontFamily: 'var(--f)', outline: 'none', background: 'var(--bg)' }}
            />
            <ColorPicker value={newAreaColor} onChange={(c, tc) => { setNewAreaColor(c); setNewAreaTc(tc) }} />
            <button className="btn btn-p btn-sm" onClick={handleCrearArea} disabled={pending || !newAreaNombre.trim()}
              style={{ opacity: newAreaNombre.trim() ? 1 : 0.38 }}>
              <IconPlus size={12} /> Agregar
            </button>
          </div>
        </div>
      </div>

      {/* ── RESPONSABLES ── */}
      <div className="dc">
        <div className="ss">Responsables</div>
        <div style={{ overflowX: 'auto', marginBottom: 14 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, minWidth: 480 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--bl)', background: 'var(--bg2)' }}>
                {['Área', 'Responsable', 'Correo', ''].map((h, i) => (
                  <th key={i} style={{ padding: '8px 11px', textAlign: 'left', color: 'var(--t2)', fontWeight: 500, fontSize: 11, textTransform: 'uppercase' as const, letterSpacing: '0.4px' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {responsables.length === 0 && (
                <tr><td colSpan={4} style={{ padding: '16px 11px', color: 'var(--t3)', fontSize: 13 }}>No hay responsables registrados.</td></tr>
              )}
              {responsables.map(r => (
                <tr key={r.id} style={{ borderBottom: '1px solid var(--bl)' }}>
                  <td style={{ padding: '8px 11px' }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', padding: '2px 8px', borderRadius: 20, background: r.areaColor, color: r.areaTc, fontSize: 12, fontWeight: 500 }}>
                      {r.areaNombre}
                    </span>
                  </td>
                  <td style={{ padding: '8px 11px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                      <div style={{ width: 24, height: 24, borderRadius: '50%', background: r.areaColor, color: r.areaTc, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 600, flexShrink: 0 }}>
                        {ini(`${r.nombres} ${r.apellidos}`)}
                      </div>
                      {r.nombres} {r.apellidos}
                    </div>
                  </td>
                  <td style={{ padding: '8px 11px', fontSize: 12, fontFamily: 'var(--fm)', color: 'var(--t2)' }}>{r.correo}</td>
                  <td style={{ padding: '8px 11px' }}>
                    <button className="ib ib-danger" onClick={() => setConfirmEliminarResp(r)} title="Eliminar">
                      <IconTrash size={13} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Formulario nuevo responsable */}
        <div style={{ background: 'var(--bg2)', border: '1px solid var(--bl)', borderRadius: 'var(--rm)', padding: '13px 15px 26px' }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--t2)', marginBottom: 11, textTransform: 'uppercase' as const, letterSpacing: '0.4px' }}>Agregar nuevo responsable</div>
          <div style={{ display: 'flex', gap: 9, flexWrap: 'wrap' as const, alignItems: 'flex-end' }}>
            <div className="fg" style={{ minWidth: 160 }}>
              <label>Área</label>
              <select value={newAreaId} onChange={e => setNewAreaId(e.target.value)}>
                <option value="">Seleccionar área...</option>
                {activas.map(a => <option key={a.id} value={a.id}>{a.nombre}</option>)}
              </select>
            </div>
            <div className="fg" style={{ minWidth: 140 }}>
              <label>Nombres</label>
              <input type="text" placeholder="Ej: María Elena" value={newNombres} onChange={e => setNewNombres(e.target.value)} />
            </div>
            <div className="fg" style={{ minWidth: 140 }}>
              <label>Apellidos</label>
              <input type="text" placeholder="Ej: Ríos Torres" value={newApellidos} onChange={e => setNewApellidos(e.target.value)} />
            </div>
            <div className="fg" style={{ minWidth: 200, position: 'relative' as const }}>
              <label>Correo</label>
              <input type="email" placeholder="usuario@empresa.com" value={newCorreo}
                onChange={e => handleCorreoChange(e.target.value)}
                style={correoError ? { borderColor: 'var(--red)' } : {}}
              />
              {correoError && (
                <span style={{ position: 'absolute' as const, top: '100%', left: 0, fontSize: 11, color: 'var(--red)', marginTop: 2, whiteSpace: 'nowrap' as const }}>{correoError}</span>
              )}
            </div>
            <button className="btn btn-p" onClick={handleCrearResponsable} disabled={!puedeAgregarResp}
              style={{ opacity: puedeAgregarResp ? 1 : 0.38, cursor: puedeAgregarResp ? 'pointer' : 'not-allowed' }}>
              <IconPlus size={13} /> Agregar
            </button>
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={!!confirmDesactivar}
        onOpenChange={o => { if (!o) setConfirmDesactivar(null) }}
        title="Desactivar área"
        description={`¿Desactivar el área "${confirmDesactivar?.nombre}"? No aparecerá en los selectores hasta que sea reactivada.`}
        confirmLabel="Desactivar"
        variant="danger"
        loading={pending}
        onConfirm={() => { if (confirmDesactivar) { handleToggleArea(confirmDesactivar, false); setConfirmDesactivar(null) } }}
      />

      <ConfirmDialog
        open={!!confirmEliminarResp}
        onOpenChange={o => { if (!o) setConfirmEliminarResp(null) }}
        title="Eliminar responsable"
        description={`¿Eliminar a ${confirmEliminarResp?.nombres} ${confirmEliminarResp?.apellidos}? Esta acción no se puede deshacer.`}
        confirmLabel="Eliminar"
        variant="danger"
        loading={pending}
        onConfirm={() => { if (confirmEliminarResp) { handleEliminarResponsable(confirmEliminarResp); setConfirmEliminarResp(null) } }}
      />
    </>
  )
}
