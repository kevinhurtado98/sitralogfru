'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { format } from 'date-fns'
import {
  IconArrowLeft, IconCheck, IconArrowUpRight,
  IconBold, IconItalic, IconUnderline, IconList, IconListNumbers, IconEraser,
} from '@tabler/icons-react'
import { crearRequerimiento } from '@/lib/actions/requerimientos'
import type { Prioridad, TipoRequerimiento } from '@/lib/types'
import type { AreaConResponsables } from './RequerimientosView'

export interface TarjetaRapida {
  id:        string
  nombres:   string
  apellidos: string
  correo:    string
  area:      { id: string; nombre: string; color: string; tc: string }
}

// ─── Tarjetas rápidas ────────────────────────────────────────────────────────

function TarjetasRapidas({
  tarjetas,
  onSeleccionar,
}: {
  tarjetas:      TarjetaRapida[]
  onSeleccionar: (areaId: string, responsableId: string, correo: string) => void
}) {
  if (tarjetas.length === 0) return null

  return (
    <div className="dc">
      <div className="ss">Acceso rápido · seleccionar responsable</div>
      <p style={{ fontSize: 12, color: 'var(--t2)', marginBottom: 12 }}>
        Haz clic en una persona para cargar automáticamente su área y nombre en el formulario
      </p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(190px,1fr))', gap: 9 }}>
        {tarjetas.map((t) => {
          const ini = ((t.nombres[0] ?? '') + (t.apellidos[0] ?? '')).toUpperCase()
          return (
            <div
              key={t.id}
              className="qcard"
              onClick={() => onSeleccionar(t.area.id, t.id, t.correo)}
            >
              <div style={{
                width: 32, height: 32, borderRadius: '50%',
                background: t.area.color, color: t.area.tc,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 11, fontWeight: 600, flexShrink: 0,
              }}>{ini}</div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 500 }}>{t.nombres} {t.apellidos}</div>
                <div style={{ fontSize: 11, color: 'var(--t3)' }}>{t.area.nombre}</div>
              </div>
              <IconArrowUpRight size={14} style={{ marginLeft: 'auto', color: 'var(--t3)' }} />
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── Formulario de datos ─────────────────────────────────────────────────────

function FormularioDatos({
  areas, areaId, onAreaChange,
  responsableId, onResponsableChange, correoHint,
  prioridad, setPrioridad,
  tipo, setTipo,
  fecha, setFecha,
  desc, setDesc,
  error, isPending,
  onGuardar,
}: {
  areas:               AreaConResponsables[]
  areaId:              string
  onAreaChange:        (id: string) => void
  responsableId:       string
  onResponsableChange: (id: string) => void
  correoHint:          string
  prioridad:           Prioridad
  setPrioridad:        (v: Prioridad) => void
  tipo:                TipoRequerimiento
  setTipo:             (v: TipoRequerimiento) => void
  fecha:               string
  setFecha:            (v: string) => void
  desc:                string
  setDesc:             (v: string) => void
  error:               string
  isPending:           boolean
  onGuardar:           () => void
}) {
  const responsablesDelArea = areas.find((a) => a.id === areaId)?.responsables ?? []

  function fmtText(cmd: 'bold' | 'italic' | 'underline' | 'bullet' | 'number') {
    const ta = document.getElementById('req-textarea') as HTMLTextAreaElement | null
    if (!ta) return
    const s = ta.selectionStart, e = ta.selectionEnd
    const sel = ta.value.substring(s, e)
    const rep =
      cmd === 'bold'      ? `**${sel}**` :
      cmd === 'italic'    ? `_${sel}_`   :
      cmd === 'underline' ? `__${sel}__` :
      cmd === 'bullet'    ? sel.split('\n').map((l) => `• ${l}`).join('\n') :
                            sel.split('\n').map((l, i) => `${i + 1}. ${l}`).join('\n')
    const next = ta.value.substring(0, s) + rep + ta.value.substring(e)
    setDesc(next)
    setTimeout(() => { ta.selectionStart = s; ta.selectionEnd = s + rep.length; ta.focus() }, 0)
  }

  return (
    <div className="dc">
      <div className="ss">Datos del requerimiento</div>

      {error && (
        <div style={{ padding: '8px 12px', background: '#fef2f2', color: 'var(--red)', borderRadius: 'var(--r)', fontSize: 13, marginBottom: 12 }}>
          {error}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
        <div className="fi">
          <label>Fecha de solicitud</label>
          <input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} />
        </div>

        <div className="fi" id="req-area-select">
          <label>Área responsable</label>
          <select value={areaId} onChange={(e) => onAreaChange(e.target.value)}>
            <option value="">← Seleccionar área ←</option>
            {areas.map((a) => <option key={a.id} value={a.id}>{a.nombre}</option>)}
          </select>
        </div>

        <div className="fi">
          <label>Responsable</label>
          <select value={responsableId} onChange={(e) => onResponsableChange(e.target.value)} disabled={!areaId}>
            <option value="">{areaId ? '← Seleccionar ←' : '← Primero seleccione un área ←'}</option>
            {responsablesDelArea.map((r) => (
              <option key={r.id} value={r.id}>{r.nombres} {r.apellidos}</option>
            ))}
          </select>
          {correoHint && <span style={{ fontSize: 11, color: 'var(--t3)' }}>{correoHint}</span>}
        </div>

        <div className="fi">
          <label>Prioridad</label>
          <select value={prioridad} onChange={(e) => setPrioridad(e.target.value as Prioridad)}>
            <option value="ALTA">Alta · atender el mismo día</option>
            <option value="MEDIA">Media · procedimiento normal</option>
          </select>
        </div>

        <div className="fi">
          <label>Tipo de solicitud</label>
          <select value={tipo} onChange={(e) => setTipo(e.target.value as TipoRequerimiento)}>
            <option value="COMPRA">Compra</option>
            <option value="SERVICIO">Servicio</option>
          </select>
        </div>
      </div>

      <div className="fi" style={{ marginBottom: 14 }}>
        <label>
          Descripción del requerimiento{' '}
          <span style={{ color: 'var(--t3)', fontWeight: 400, textTransform: 'none' }}>(máx. 1000 caracteres)</span>
        </label>
        <div style={{ border: '1px solid var(--bm)', borderRadius: 'var(--rm)', overflow: 'hidden', background: 'var(--bg)', marginTop: 4 }}>
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
              width: '100%', minHeight: 140, padding: '10px 12px',
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
        <a href="/requerimientos" className="btn" style={{ textDecoration: 'none' }}>Cancelar</a>
        <button className="btn btn-p" onClick={onGuardar} disabled={isPending}>
          <IconCheck size={13} /> {isPending ? 'Guardando...' : 'Registrar requerimiento'}
        </button>
      </div>
    </div>
  )
}

// ─── Vista principal ──────────────────────────────────────────────────────────

export function NuevoRequerimientoView({ areas, tarjetasRapidas }: { areas: AreaConResponsables[]; tarjetasRapidas: TarjetaRapida[] }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const [areaId,        setAreaId]        = useState('')
  const [responsableId, setResponsableId] = useState('')
  const [correoHint,    setCorreoHint]    = useState('')
  const [prioridad,     setPrioridad]     = useState<Prioridad>('ALTA')
  const [tipo,          setTipo]          = useState<TipoRequerimiento>('COMPRA')
  const [desc,          setDesc]          = useState('')
  const [fecha,         setFecha]         = useState(format(new Date(), 'yyyy-MM-dd'))
  const [error,         setError]         = useState('')

  function onSeleccionar(newAreaId: string, newResponsableId: string, correo: string) {
    setAreaId(newAreaId)
    setResponsableId(newResponsableId)
    setCorreoHint(correo)
    document.getElementById('req-area-select')?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
  }

  function onAreaChange(id: string) {
    setAreaId(id)
    setResponsableId('')
    setCorreoHint('')
    const primera = areas.find((a) => a.id === id)?.responsables[0]
    if (primera) { setResponsableId(primera.id); setCorreoHint(primera.correo) }
  }

  function onResponsableChange(id: string) {
    setResponsableId(id)
    const r = areas.find((a) => a.id === areaId)?.responsables.find((x) => x.id === id)
    setCorreoHint(r?.correo ?? '')
  }

  function guardar() {
    if (!areaId || !responsableId || !desc.trim()) {
      setError('Completa área, responsable y descripción.')
      return
    }
    setError('')
    startTransition(async () => {
      const res = await crearRequerimiento({ fechaSolicitud: fecha, areaId, responsableId, prioridad, tipo, descripcion: desc.trim() })
      if (!res.ok) { setError(res.error); return }
      router.push('/requerimientos')
      router.refresh()
    })
  }

  return (
    <>
      <div style={{ marginBottom: 16 }}>
        <a href="/requerimientos" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--t2)', textDecoration: 'none' }}>
          <IconArrowLeft size={14} /> Volver a requerimientos
        </a>
      </div>

      <TarjetasRapidas tarjetas={tarjetasRapidas} onSeleccionar={onSeleccionar} />

      <FormularioDatos
        areas={areas}
        areaId={areaId}               onAreaChange={onAreaChange}
        responsableId={responsableId} onResponsableChange={onResponsableChange}
        correoHint={correoHint}
        prioridad={prioridad}         setPrioridad={setPrioridad}
        tipo={tipo}                   setTipo={setTipo}
        fecha={fecha}                 setFecha={setFecha}
        desc={desc}                   setDesc={setDesc}
        error={error}
        isPending={isPending}
        onGuardar={guardar}
      />
    </>
  )
}
