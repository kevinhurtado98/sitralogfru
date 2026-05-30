'use client'

import { useState, useMemo } from 'react'
import { format } from 'date-fns'
import { IconSearch, IconEye, IconPencil, IconArrowUpRight, IconCheck, IconBold, IconItalic, IconUnderline, IconList, IconListNumbers, IconEraser } from '@tabler/icons-react'
import { AREAS, type Area } from '@/lib/areas'
import type { EstadoRequerimiento, Prioridad, TipoRequerimiento } from '@prisma/client'

// ─── Types ───────────────────────────────────────────────────────────────────

export interface ReqRow {
  id: string
  fechaSolicitud: Date | string
  area: string
  prioridad: Prioridad
  tipo: TipoRequerimiento
  descripcion: string
  estado: EstadoRequerimiento
  diasRetraso: number
  responsable: { nombre: string }
  creadoPor: { nombre: string }
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function estadoBadge(e: EstadoRequerimiento) {
  const map: Record<EstadoRequerimiento, [string, string]> = {
    ATENDIDO_TOTAL:   ['badge-green', 'Atendido total'],
    ATENDIDO_PARCIAL: ['badge-ora',   'Atendido parcial'],
    PENDIENTE:        ['badge-red',   'Pendiente'],
    NO_ATENDIDO:      ['badge-red',   'No atendido'],
  }
  const [cls, label] = map[e] ?? ['badge-slate', e]
  return <span className={`badge ${cls}`}>{label}</span>
}

function prioridadBadge(p: Prioridad) {
  return p === 'ALTA'
    ? <span className="badge badge-red">Alta</span>
    : <span className="badge badge-amber">Media</span>
}

function todayStr() {
  return format(new Date(), 'dd/MM/yyyy')
}

function TabBar({ tabs, active, onChange }: { tabs: string[]; active: string; onChange: (t: string) => void }) {
  return (
    <div style={{ display: 'flex', marginBottom: 16, borderBottom: '1px solid var(--bl)' }}>
      {tabs.map((t) => (
        <button key={t} onClick={() => onChange(t)} style={{
          padding: '8px 16px', fontSize: 13, cursor: 'pointer',
          color: active === t ? 'var(--t1)' : 'var(--t2)',
          borderBottom: `2px solid ${active === t ? 'var(--t1)' : 'transparent'}`,
          marginBottom: -1, background: 'none', border: 'none',
          borderBottomWidth: 2, borderBottomStyle: 'solid',
          fontWeight: active === t ? 500 : 400, fontFamily: 'var(--f)',
        }}>{t}</button>
      ))}
    </div>
  )
}

// ─── Nueva forma de requerimiento ────────────────────────────────────────────

function NuevoRequerimiento({ onGuardar, onCancelar }: {
  onGuardar: (r: ReqRow) => void
  onCancelar: () => void
}) {
  const [area, setArea] = useState('')
  const [responsable, setResponsable] = useState('')
  const [correoHint, setCorreoHint] = useState('')
  const [prioridad, setPrioridad] = useState<Prioridad>('ALTA')
  const [tipo, setTipo] = useState<TipoRequerimiento>('COMPRA')
  const [desc, setDesc] = useState('')

  const responsablesDelArea: Area[] = useMemo(
    () => AREAS.filter((a) => a.area === area),
    [area]
  )

  function quickFill(a: Area) {
    setArea(a.area)
    setResponsable(a.resp)
    setCorreoHint(a.correo)
    const el = document.getElementById('req-area-select')
    el?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
  }

  function onAreaChange(val: string) {
    setArea(val)
    setResponsable('')
    setCorreoHint('')
    const first = AREAS.find((a) => a.area === val)
    if (first) { setResponsable(first.resp); setCorreoHint(first.correo) }
  }

  function fmtText(cmd: 'bold' | 'italic' | 'underline' | 'bullet' | 'number') {
    const ta = document.getElementById('req-textarea') as HTMLTextAreaElement | null
    if (!ta) return
    const s = ta.selectionStart, e = ta.selectionEnd
    const sel = ta.value.substring(s, e)
    const rep =
      cmd === 'bold'      ? `**${sel}**` :
      cmd === 'italic'    ? `_${sel}_` :
      cmd === 'underline' ? `__${sel}__` :
      cmd === 'bullet'    ? sel.split('\n').map((l) => `• ${l}`).join('\n') :
                            sel.split('\n').map((l, i) => `${i + 1}. ${l}`).join('\n')
    const next = ta.value.substring(0, s) + rep + ta.value.substring(e)
    setDesc(next)
    setTimeout(() => { ta.selectionStart = s; ta.selectionEnd = s + rep.length; ta.focus() }, 0)
  }

  function guardar() {
    if (!area || !responsable || !desc.trim()) return
    onGuardar({
      id: Math.random().toString(36).slice(2),
      fechaSolicitud: new Date(),
      area, prioridad, tipo,
      descripcion: desc.trim(),
      estado: 'PENDIENTE',
      diasRetraso: 0,
      responsable: { nombre: responsable },
      creadoPor: { nombre: 'Usuario' },
    })
  }

  return (
    <>
      {/* Quick cards */}
      <div className="dc">
        <div className="ss">Acceso rápido · seleccionar responsable</div>
        <p style={{ fontSize: 12, color: 'var(--t2)', marginBottom: 12 }}>
          Haz clic en una persona para cargar automáticamente su área y nombre en el formulario
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(190px,1fr))', gap: 9 }}>
          {AREAS.map((a) => (
            <div key={a.area} className="qcard" onClick={() => quickFill(a)}>
              <div style={{
                width: 32, height: 32, borderRadius: '50%',
                background: a.color, color: a.tc,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 11, fontWeight: 600, flexShrink: 0,
              }}>{a.ini}</div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 500 }}>{a.resp}</div>
                <div style={{ fontSize: 11, color: 'var(--t3)' }}>{a.area}</div>
              </div>
              <IconArrowUpRight size={14} style={{ marginLeft: 'auto', color: 'var(--t3)' }} />
            </div>
          ))}
        </div>
      </div>

      {/* Formulario */}
      <div className="dc">
        <div className="ss">Datos del requerimiento</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
          <div className="fi"><label>Fecha de solicitud</label>
            <input type="date" defaultValue={format(new Date(), 'yyyy-MM-dd')} />
          </div>
          <div className="fi" id="req-area-select"><label>Área responsable</label>
            <select value={area} onChange={(e) => onAreaChange(e.target.value)}>
              <option value="">← Seleccionar área ←</option>
              {AREAS.map((a) => <option key={a.area} value={a.area}>{a.area}</option>)}
            </select>
          </div>
          <div className="fi"><label>Responsable</label>
            <select value={responsable} onChange={(e) => { setResponsable(e.target.value); const a = AREAS.find((x) => x.resp === e.target.value); if (a) setCorreoHint(a.correo) }}
              disabled={!area}>
              <option value="">{area ? '← Seleccionar ←' : '← Primero seleccione un área ←'}</option>
              {responsablesDelArea.map((a) => <option key={a.resp} value={a.resp}>{a.resp}</option>)}
            </select>
            {correoHint && <span style={{ fontSize: 11, color: 'var(--t3)' }}>{correoHint}</span>}
          </div>
          <div className="fi"><label>Prioridad</label>
            <select value={prioridad} onChange={(e) => setPrioridad(e.target.value as Prioridad)}>
              <option value="ALTA">Alta · atender el mismo día</option>
              <option value="MEDIA">Media · procedimiento normal</option>
            </select>
          </div>
          <div className="fi"><label>Tipo de solicitud</label>
            <select value={tipo} onChange={(e) => setTipo(e.target.value as TipoRequerimiento)}>
              <option value="COMPRA">Compra</option>
              <option value="SERVICIO">Servicio</option>
            </select>
          </div>
        </div>

        {/* Textarea con toolbar */}
        <div className="fi" style={{ marginBottom: 14 }}>
          <label>
            Descripción del requerimiento{' '}
            <span style={{ color: 'var(--t3)', fontWeight: 400, textTransform: 'none' }}>(máx. 1000 caracteres)</span>
          </label>
          <div style={{ border: '1px solid var(--bm)', borderRadius: 'var(--rm)', overflow: 'hidden', background: 'var(--bg)', marginTop: 4 }}>
            {/* Toolbar */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '6px 10px', borderBottom: '1px solid var(--bl)', background: 'var(--bg2)' }}>
              {([
                ['bold',      <IconBold size={13} key="b" />],
                ['italic',    <IconItalic size={13} key="i" />],
                ['underline', <IconUnderline size={13} key="u" />],
              ] as const).map(([cmd, icon]) => (
                <button key={cmd}
                  onClick={() => fmtText(cmd as 'bold' | 'italic' | 'underline')}
                  style={{ width: 26, height: 26, border: 'none', borderRadius: 'var(--r)', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--t2)' }}
                >{icon}</button>
              ))}
              <div style={{ width: 1, height: 18, background: 'var(--bl)', margin: '0 3px' }} />
              <button onClick={() => fmtText('bullet')} style={{ width: 26, height: 26, border: 'none', borderRadius: 'var(--r)', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--t2)' }}><IconList size={13} /></button>
              <button onClick={() => fmtText('number')} style={{ width: 26, height: 26, border: 'none', borderRadius: 'var(--r)', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--t2)' }}><IconListNumbers size={13} /></button>
              <div style={{ width: 1, height: 18, background: 'var(--bl)', margin: '0 3px' }} />
              <button onClick={() => setDesc('')} style={{ width: 26, height: 26, border: 'none', borderRadius: 'var(--r)', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--t2)' }}><IconEraser size={13} /></button>
              <span style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--t3)' }}>Escribe o pega el detalle aquí</span>
            </div>
            <textarea
              id="req-textarea"
              value={desc}
              onChange={(e) => setDesc(e.target.value.slice(0, 1000))}
              maxLength={1000}
              placeholder="Describe con detalle el requerimiento: qué se necesita, cantidad, especificaciones, urgencia..."
              style={{
                width: '100%', minHeight: 120, padding: '10px 12px',
                fontSize: 13, fontFamily: 'var(--f)', border: 'none',
                outline: 'none', resize: 'vertical', background: 'var(--bg)',
                color: 'var(--t1)', lineHeight: 1.6,
              }}
            />
            <div style={{ padding: '4px 12px', fontSize: 11, color: 'var(--t3)', background: 'var(--bg)', borderTop: '1px solid var(--bl)', textAlign: 'right' }}>
              {desc.length} / 1000 caracteres
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 9 }}>
          <button className="btn" onClick={onCancelar}>Cancelar</button>
          <button className="btn btn-p" onClick={guardar}><IconCheck size={13} /> Registrar requerimiento</button>
        </div>
      </div>
    </>
  )
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export function RequerimientosView({ requerimientos: initial }: { requerimientos: ReqRow[] }) {
  const [tab, setTab] = useState('Lista de requerimientos')
  const [reqs, setReqs] = useState(initial)
  const [busqueda, setBusqueda] = useState('')

  const filtrados = useMemo(() => {
    const q = busqueda.toLowerCase()
    if (!q) return reqs
    return reqs.filter((r) =>
      r.area.toLowerCase().includes(q) ||
      r.responsable.nombre.toLowerCase().includes(q) ||
      r.descripcion.toLowerCase().includes(q)
    )
  }, [reqs, busqueda])

  function onGuardar(r: ReqRow) {
    setReqs((prev) => [r, ...prev])
    setTab('Lista de requerimientos')
  }

  return (
    <>
      <TabBar tabs={['Lista de requerimientos', 'Nuevo requerimiento']} active={tab} onChange={setTab} />

      {tab === 'Lista de requerimientos' && (
        <>
          <div className="fc">
            <div style={{ display: 'flex', gap: 9, flexWrap: 'wrap', alignItems: 'flex-end' }}>
              <div className="fg"><label>Buscar</label>
                <input type="text" placeholder="Área, responsable..." value={busqueda} onChange={(e) => setBusqueda(e.target.value)} />
              </div>
              <div className="fg" style={{ maxWidth: 130 }}><label>Desde</label><input type="date" /></div>
              <div className="fg" style={{ maxWidth: 130 }}><label>Hasta</label><input type="date" /></div>
              <div className="fg" style={{ maxWidth: 150 }}><label>Área</label>
                <select><option value="">Todas</option>{AREAS.map((a) => <option key={a.area} value={a.area}>{a.area}</option>)}</select>
              </div>
              <div className="fg" style={{ maxWidth: 120 }}><label>Prioridad</label>
                <select><option>Todas</option><option value="ALTA">Alta</option><option value="MEDIA">Media</option></select>
              </div>
              <div className="fg" style={{ maxWidth: 140 }}><label>Estado</label>
                <select><option>Todos</option><option>Pendiente</option><option>Atendido parcial</option><option>Atendido total</option></select>
              </div>
              <button className="btn btn-p"><IconSearch size={13} /> Filtrar</button>
            </div>
          </div>

          <div className="tc">
            <div style={{ padding: '11px 15px', borderBottom: '1px solid var(--bl)' }}>
              <span style={{ fontSize: 13, fontWeight: 600 }}>Requerimientos registrados</span>
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table>
                <thead>
                  <tr>
                    <th>Fecha</th><th>Área</th><th>Responsable</th><th>Tipo</th>
                    <th>Prioridad</th><th>Descripción</th><th>Generado por</th>
                    <th>Días atraso</th><th>Estado</th><th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {filtrados.length === 0 ? (
                    <tr><td colSpan={10} style={{ textAlign: 'center', padding: '32px 0', color: 'var(--t3)' }}>
                      No hay requerimientos registrados
                    </td></tr>
                  ) : filtrados.map((r) => (
                    <tr key={r.id}>
                      <td style={{ whiteSpace: 'nowrap' }}>{format(new Date(r.fechaSolicitud), 'dd/MM/yyyy')}</td>
                      <td style={{ fontWeight: 500 }}>{r.area}</td>
                      <td>{r.responsable.nombre}</td>
                      <td><span className="badge badge-blue">{r.tipo === 'COMPRA' ? 'Compra' : 'Servicio'}</span></td>
                      <td>{prioridadBadge(r.prioridad)}</td>
                      <td style={{ maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'var(--t2)' }}>
                        {r.descripcion}
                      </td>
                      <td style={{ fontSize: 12, color: 'var(--t2)' }}>{r.creadoPor.nombre}</td>
                      <td>
                        {r.diasRetraso > 0
                          ? <span style={{ fontWeight: 600, color: 'var(--red)' }}>{r.diasRetraso} días</span>
                          : <span style={{ color: 'var(--t3)' }}>—</span>}
                      </td>
                      <td>{estadoBadge(r.estado)}</td>
                      <td>
                        <div style={{ display: 'flex', gap: 4 }}>
                          <button className="ib"><IconEye size={13} /></button>
                          <button className="ib"><IconPencil size={13} /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {tab === 'Nuevo requerimiento' && (
        <NuevoRequerimiento
          onGuardar={onGuardar}
          onCancelar={() => setTab('Lista de requerimientos')}
        />
      )}
    </>
  )
}
