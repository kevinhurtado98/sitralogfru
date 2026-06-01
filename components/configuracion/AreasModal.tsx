'use client'

import { useState, useTransition } from 'react'
import { IconX, IconPencil, IconCheck, IconPlus, IconRotate, IconBan } from '@tabler/icons-react'
import { crearArea, editarArea, toggleArea } from '@/lib/actions/areas'

type Area = { id: number; nombre: string; color: string; tc: string; activo: boolean }

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

function ini(nombre: string) {
  return nombre.split(' ').map(p => p[0] ?? '').slice(0, 2).join('').toUpperCase()
}

function Avatar({ color, tc, nombre }: { color: string; tc: string; nombre: string }) {
  return (
    <div style={{
      width: 30, height: 30, borderRadius: '50%', background: color, color: tc,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: 10, fontWeight: 700, flexShrink: 0,
    }}>
      {ini(nombre || '?')}
    </div>
  )
}

function ColorPicker({ value, onChange }: { value: string; onChange: (color: string, tc: string) => void }) {
  return (
    <div style={{ display: 'flex', gap: 5 }}>
      {PALETA.map(p => (
        <button
          key={p.color}
          type="button"
          onClick={() => onChange(p.color, p.tc)}
          style={{
            width: 18, height: 18, borderRadius: '50%', background: p.color,
            border: value === p.color ? `2px solid ${p.tc}` : '2px solid transparent',
            cursor: 'pointer', flexShrink: 0,
          }}
        />
      ))}
    </div>
  )
}

export function AreasModal({ areas: inicial, onClose }: { areas: Area[]; onClose: () => void }) {
  const [areas, setAreas]           = useState<Area[]>(inicial)
  const [tab, setTab]               = useState<'activas' | 'inactivas'>('activas')
  const [editId, setEditId]         = useState<number | null>(null)
  const [editNombre, setEditNombre] = useState('')
  const [editColor, setEditColor]   = useState(PALETA[0].color)
  const [editTc, setEditTc]         = useState(PALETA[0].tc)
  const [newNombre, setNewNombre]   = useState('')
  const [newColor, setNewColor]     = useState(PALETA[0].color)
  const [newTc, setNewTc]           = useState(PALETA[0].tc)
  const [error, setError]           = useState('')
  const [pending, startTransition]  = useTransition()

  const activas   = areas.filter(a => a.activo)
  const inactivas = areas.filter(a => !a.activo)
  const lista     = tab === 'activas' ? activas : inactivas

  function startEdit(a: Area) {
    setEditId(a.id)
    setEditNombre(a.nombre)
    setEditColor(a.color)
    setEditTc(a.tc)
    setError('')
  }

  function handleEditar() {
    if (!editNombre.trim() || !editId) return
    setError('')
    startTransition(async () => {
      const res = await editarArea(editId, { nombre: editNombre.trim(), color: editColor, tc: editTc })
      if (!res.ok) { setError(res.error); return }
      setAreas(prev => prev.map(a => a.id === editId ? res.area : a))
      setEditId(null)
    })
  }

  function handleToggle(id: number, activo: boolean) {
    setError('')
    startTransition(async () => {
      const res = await toggleArea(id, activo)
      if (!res.ok) { setError(res.error); return }
      setAreas(prev => prev.map(a => a.id === id ? { ...a, activo } : a))
    })
  }

  function handleCrear() {
    if (!newNombre.trim()) return
    setError('')
    startTransition(async () => {
      const res = await crearArea({ nombre: newNombre.trim(), color: newColor, tc: newTc })
      if (!res.ok) { setError(res.error); return }
      setAreas(prev => [...prev, res.area])
      setNewNombre('')
      setNewColor(PALETA[0].color)
      setNewTc(PALETA[0].tc)
      setTab('activas')
    })
  }

  return (
    <div
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.35)',
        zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div style={{
        background: 'var(--bg)', borderRadius: 'var(--rl)', boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
        width: 500, maxHeight: '80vh', display: 'flex', flexDirection: 'column',
      }}>
        {/* Header */}
        <div style={{ padding: '16px 18px', borderBottom: '1px solid var(--bl)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
          <span style={{ fontWeight: 600, fontSize: 14 }}>Gestionar áreas</span>
          <button className="ib" onClick={onClose}><IconX size={14} /></button>
        </div>

        {/* Tabs */}
        <div style={{ padding: '10px 18px 0', display: 'flex', gap: 0, borderBottom: '1px solid var(--bl)', flexShrink: 0 }}>
          {(['activas', 'inactivas'] as const).map(t => (
            <button
              key={t}
              onClick={() => { setTab(t); setEditId(null); setError('') }}
              style={{
                padding: '6px 14px', fontSize: 12, fontWeight: 500, cursor: 'pointer',
                background: 'none', border: 'none', fontFamily: 'var(--f)',
                color: tab === t ? 'var(--t1)' : 'var(--t3)',
                borderBottom: tab === t ? '2px solid var(--t1)' : '2px solid transparent',
                marginBottom: -1, textTransform: 'capitalize',
              }}
            >
              {t === 'activas' ? `Activas (${activas.length})` : `Inactivas (${inactivas.length})`}
            </button>
          ))}
        </div>

        {/* Lista */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '8px 0' }}>
          {lista.length === 0 && (
            <div style={{ padding: '24px 18px', textAlign: 'center', color: 'var(--t3)', fontSize: 13 }}>
              {tab === 'activas' ? 'No hay áreas activas' : 'No hay áreas inactivas'}
            </div>
          )}

          {lista.map(a => (
            <div key={a.id} style={{ padding: '8px 18px', borderBottom: '1px solid var(--bl)', display: 'flex', alignItems: 'center', gap: 10 }}>
              {editId === a.id ? (
                /* Fila en modo edición */
                <>
                  <Avatar color={editColor} tc={editTc} nombre={editNombre} />
                  <input
                    autoFocus
                    className="fg"
                    value={editNombre}
                    onChange={e => setEditNombre(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') handleEditar(); if (e.key === 'Escape') setEditId(null) }}
                    style={{ flex: 1, height: 30, fontSize: 13, padding: '0 8px', border: '1px solid var(--bm)', borderRadius: 'var(--r)', fontFamily: 'var(--f)', outline: 'none' }}
                  />
                  <ColorPicker value={editColor} onChange={(c, tc) => { setEditColor(c); setEditTc(tc) }} />
                  <button className="ib" onClick={handleEditar} disabled={pending} title="Guardar"><IconCheck size={13} /></button>
                  <button className="ib" onClick={() => setEditId(null)} title="Cancelar"><IconX size={13} /></button>
                </>
              ) : (
                /* Fila normal */
                <>
                  <Avatar color={a.color} tc={a.tc} nombre={a.nombre} />
                  <span style={{ flex: 1, fontSize: 13, fontWeight: 500 }}>{a.nombre}</span>
                  {tab === 'activas' ? (
                    <>
                      <button className="ib" onClick={() => startEdit(a)} title="Editar"><IconPencil size={13} /></button>
                      <button className="ib ib-danger" onClick={() => handleToggle(a.id, false)} disabled={pending} title="Desactivar"><IconBan size={13} /></button>
                    </>
                  ) : (
                    <button className="ib" onClick={() => handleToggle(a.id, true)} disabled={pending} title="Reactivar" style={{ gap: 4, width: 'auto', padding: '0 9px' }}>
                      <IconRotate size={12} /> Reactivar
                    </button>
                  )}
                </>
              )}
            </div>
          ))}
        </div>

        {/* Nueva área */}
        <div style={{ borderTop: '1px solid var(--bl)', padding: '13px 18px', flexShrink: 0, background: 'var(--bg2)' }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--t2)', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.4px' }}>Nueva área</div>
          {error && <div style={{ fontSize: 12, color: 'var(--red)', marginBottom: 8 }}>{error}</div>}
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <Avatar color={newColor} tc={newTc} nombre={newNombre} />
            <input
              placeholder="Nombre del área"
              value={newNombre}
              onChange={e => setNewNombre(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleCrear() }}
              style={{ flex: 1, height: 30, fontSize: 13, padding: '0 8px', border: '1px solid var(--bm)', borderRadius: 'var(--r)', fontFamily: 'var(--f)', outline: 'none', background: 'var(--bg)' }}
            />
            <ColorPicker value={newColor} onChange={(c, tc) => { setNewColor(c); setNewTc(tc) }} />
            <button className="btn btn-p btn-sm" onClick={handleCrear} disabled={pending || !newNombre.trim()}>
              <IconPlus size={12} /> Agregar
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
