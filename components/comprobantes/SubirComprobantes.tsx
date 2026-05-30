'use client'

import { useRef, useState } from 'react'
import Link from 'next/link'
import {
  IconArrowLeft, IconUpload, IconFileText, IconX,
  IconCircleCheck, IconAlertCircle, IconLoader2,
  IconRefresh, IconClock, IconBan,
} from '@tabler/icons-react'

// ─── Types ───────────────────────────────────────────────────────────────────

type Estado = 'pendiente' | 'subiendo' | 'exitoso' | 'ya_existe' | 'error'

interface ArchivoXML {
  uid: string
  file: File
  nombre: string
  peso: string
  estado: Estado
  mensaje?: string
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatPeso(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function uid() { return Math.random().toString(36).slice(2) }

// ─── Estado config ────────────────────────────────────────────────────────────

type EstadoCfg = { label: string; icon: React.ReactNode; bg: string; color: string }

const ESTADO_CFG: Record<Estado, EstadoCfg> = {
  pendiente:  { label: 'Pendiente',   icon: <IconClock      size={12} />, bg: 'var(--amber-bg)', color: 'var(--amber)' },
  subiendo:   { label: 'Procesando…', icon: <IconLoader2    size={12} className="spin" />, bg: 'var(--blue-bg)',  color: 'var(--blue)' },
  exitoso:    { label: 'Registrado',  icon: <IconCircleCheck size={12} />, bg: 'var(--green-bg)', color: 'var(--green)' },
  ya_existe:  { label: 'Ya existe',   icon: <IconBan        size={12} />, bg: 'var(--bg2)',      color: 'var(--t2)' },
  error:      { label: 'Error',       icon: <IconAlertCircle size={12} />, bg: 'var(--red-bg)',   color: 'var(--red)' },
}

// ─── Fila de archivo ──────────────────────────────────────────────────────────

function FilaArchivo({ archivo, onEliminar }: { archivo: ArchivoXML; onEliminar: (uid: string) => void }) {
  const cfg = ESTADO_CFG[archivo.estado]
  const eliminable = archivo.estado === 'pendiente'

  return (
    <tr>
      <td style={{ padding: '9px 14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
          <div style={{
            width: 30, height: 30, borderRadius: 'var(--rm)',
            background: 'var(--blue-bg)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
          }}>
            <IconFileText size={14} style={{ color: 'var(--blue)' }} />
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 280 }}>
              {archivo.nombre}
            </div>
            {archivo.mensaje && (
              <div style={{ fontSize: 11, color: 'var(--red)', marginTop: 1 }}>{archivo.mensaje}</div>
            )}
          </div>
        </div>
      </td>
      <td style={{ padding: '9px 14px', fontSize: 12, color: 'var(--t3)', whiteSpace: 'nowrap' }}>
        {archivo.peso}
      </td>
      <td style={{ padding: '9px 14px' }}>
        <span style={{
          display: 'inline-flex', alignItems: 'center', gap: 5,
          padding: '3px 9px', borderRadius: 20,
          fontSize: 11, fontWeight: 500,
          background: cfg.bg, color: cfg.color,
        }}>
          {cfg.icon} {cfg.label}
        </span>
      </td>
      <td style={{ padding: '9px 14px', textAlign: 'right' }}>
        {eliminable && (
          <button
            className="ib ib-danger"
            onClick={() => onEliminar(archivo.uid)}
            title="Quitar"
          >
            <IconX size={12} />
          </button>
        )}
      </td>
    </tr>
  )
}

// ─── Resumen ──────────────────────────────────────────────────────────────────

function Resumen({ archivos }: { archivos: ArchivoXML[] }) {
  const exitosos  = archivos.filter((a) => a.estado === 'exitoso').length
  const yaExisten = archivos.filter((a) => a.estado === 'ya_existe').length
  const errores   = archivos.filter((a) => a.estado === 'error').length
  if (!exitosos && !yaExisten && !errores) return null

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 16,
      padding: '10px 14px',
      borderTop: '1px solid var(--bl)',
      background: 'var(--bg2)',
      fontSize: 12,
    }}>
      {exitosos  > 0 && <span style={{ color: 'var(--green-t)', fontWeight: 500 }}><IconCircleCheck size={13} style={{ display: 'inline', marginRight: 4, verticalAlign: 'middle' }} />{exitosos} registrado{exitosos > 1 ? 's' : ''}</span>}
      {yaExisten > 0 && <span style={{ color: 'var(--t2)',      fontWeight: 500 }}><IconBan size={13} style={{ display: 'inline', marginRight: 4, verticalAlign: 'middle' }} />{yaExisten} ya existía{yaExisten > 1 ? 'n' : ''}</span>}
      {errores   > 0 && <span style={{ color: 'var(--red)',     fontWeight: 500 }}><IconAlertCircle size={13} style={{ display: 'inline', marginRight: 4, verticalAlign: 'middle' }} />{errores} con error</span>}
    </div>
  )
}

// ─── Principal ────────────────────────────────────────────────────────────────

export function SubirComprobantes() {
  const inputRef = useRef<HTMLInputElement>(null)
  const [archivos, setArchivos] = useState<ArchivoXML[]>([])

  const procesando  = archivos.some((a) => a.estado === 'subiendo')
  const pendientes  = archivos.filter((a) => a.estado === 'pendiente')
  const hayResultados = archivos.some((a) =>
    a.estado === 'exitoso' || a.estado === 'ya_existe' || a.estado === 'error'
  )

  function handleSeleccionar(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? [])
    const nuevos: ArchivoXML[] = files.map((f) => ({
      uid: uid(), file: f, nombre: f.name,
      peso: formatPeso(f.size), estado: 'pendiente',
    }))
    setArchivos((prev) => [...prev, ...nuevos])
    e.target.value = ''
  }

  function handleEliminar(uid: string) {
    setArchivos((prev) => prev.filter((a) => a.uid !== uid))
  }

  async function handleProcesar() {
    if (!pendientes.length) return

    setArchivos((prev) =>
      prev.map((a) => a.estado === 'pendiente' ? { ...a, estado: 'subiendo' } : a)
    )

    await Promise.allSettled(
      pendientes.map(async (archivo) => {
        const body = new FormData()
        body.append('archivo', archivo.file)

        let nuevoEstado: Estado = 'error'
        let mensaje: string | undefined

        try {
          const res = await fetch('/api/comprobantes/upload', { method: 'POST', body })
          if (res.status === 401) {
            mensaje = 'Sesión expirada, recarga la página'
          } else {
            const data = (await res.json()) as { estado: Estado; mensaje?: string }
            nuevoEstado = data.estado
            mensaje = data.mensaje
          }
        } catch {
          mensaje = 'Error de conexión con el servidor'
        }

        setArchivos((prev) =>
          prev.map((a) => a.uid === archivo.uid ? { ...a, estado: nuevoEstado, mensaje } : a)
        )
      })
    )
  }

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        accept=".xml"
        multiple
        style={{ display: 'none' }}
        onChange={handleSeleccionar}
      />

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Link href="/comprobantes">
            <button className="ib" title="Volver"><IconArrowLeft size={15} /></button>
          </Link>
          <div>
            <h1 style={{ fontSize: 15, fontWeight: 600, letterSpacing: '-0.2px' }}>Subir comprobantes</h1>
            <p style={{ fontSize: 12, color: 'var(--t3)', marginTop: 2 }}>
              Factura electrónica SUNAT · Formato XML UBL 2.1
            </p>
          </div>
        </div>
        {archivos.length > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
            <span style={{ fontSize: 12, color: 'var(--t3)' }}>
              {pendientes.length > 0
                ? `${pendientes.length} pendiente${pendientes.length > 1 ? 's' : ''}`
                : procesando ? 'Procesando…'
                : 'Proceso completado'}
            </span>
            {hayResultados && !procesando && (
              <button className="btn btn-sm" onClick={() => setArchivos([])}>
                <IconRefresh size={12} /> Limpiar
              </button>
            )}
            {hayResultados && !procesando && (
              <button className="btn btn-sm" onClick={() => inputRef.current?.click()}>
                <IconUpload size={12} /> Agregar más
              </button>
            )}
            {pendientes.length > 0 && (
              <button
                className={`btn btn-sm ${procesando ? '' : 'btn-p'}`}
                onClick={handleProcesar}
                disabled={procesando}
              >
                {procesando
                  ? <><IconLoader2 size={12} style={{ animation: 'spin 1s linear infinite' }} /> Procesando…</>
                  : <><IconUpload size={12} /> Procesar {pendientes.length} archivo{pendientes.length > 1 ? 's' : ''}</>}
              </button>
            )}
          </div>
        )}
      </div>

      {/* Layout principal */}
      {archivos.length === 0 ? (

        /* ── Estado vacío: zona de carga grande ── */
        <div className="dc">
          <div
            onClick={() => inputRef.current?.click()}
            style={{
              border: '2px dashed var(--bm)',
              borderRadius: 'var(--rl)',
              padding: '60px 24px',
              textAlign: 'center',
              cursor: 'pointer',
              transition: 'border-color 0.15s, background 0.15s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = 'var(--blue)'
              e.currentTarget.style.background = 'var(--blue-bg)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = 'var(--bm)'
              e.currentTarget.style.background = 'transparent'
            }}
          >
            <div style={{
              width: 52, height: 52, borderRadius: 'var(--rl)',
              background: 'var(--blue-bg)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 14px',
            }}>
              <IconUpload size={22} style={{ color: 'var(--blue)' }} />
            </div>
            <p style={{ fontSize: 15, fontWeight: 500, marginBottom: 6 }}>
              Haz clic para seleccionar archivos XML
            </p>
            <p style={{ fontSize: 13, color: 'var(--t3)', marginBottom: 18 }}>
              Puedes seleccionar múltiples archivos a la vez
            </p>
            <button
              className="btn"
              onClick={(e) => { e.stopPropagation(); inputRef.current?.click() }}
            >
              <IconUpload size={13} /> Seleccionar archivos XML
            </button>
          </div>
        </div>

      ) : (

        /* ── Con archivos: zona izquierda + tabla derecha ── */
        <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: 14, alignItems: 'start' }}>

          {/* Columna izquierda — zona de carga compacta */}
          <div className="dc" style={{ position: 'sticky', top: 0 }}>
            <div className="ss">Agregar archivos</div>
            <div
              onClick={() => !procesando && inputRef.current?.click()}
              style={{
                border: '2px dashed var(--bm)',
                borderRadius: 'var(--rm)',
                padding: '28px 16px',
                textAlign: 'center',
                cursor: procesando ? 'default' : 'pointer',
                transition: 'border-color 0.15s, background 0.15s',
                opacity: procesando ? 0.5 : 1,
              }}
              onMouseEnter={(e) => {
                if (!procesando) {
                  e.currentTarget.style.borderColor = 'var(--blue)'
                  e.currentTarget.style.background = 'var(--blue-bg)'
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'var(--bm)'
                e.currentTarget.style.background = 'transparent'
              }}
            >
              <div style={{
                width: 36, height: 36, borderRadius: 'var(--rm)',
                background: 'var(--blue-bg)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 10px',
              }}>
                <IconUpload size={16} style={{ color: 'var(--blue)' }} />
              </div>
              <p style={{ fontSize: 13, fontWeight: 500, marginBottom: 3 }}>
                Seleccionar más XML
              </p>
              <p style={{ fontSize: 11, color: 'var(--t3)' }}>
                Se añaden a la lista
              </p>
            </div>

            {/* Estadísticas */}
            <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 7 }}>
              {[
                { label: 'Total',      v: archivos.length,                                       color: 'var(--t1)' },
                { label: 'Pendientes', v: pendientes.length,                                     color: 'var(--amber)' },
                { label: 'Registrados',v: archivos.filter((a) => a.estado === 'exitoso').length,  color: 'var(--green)' },
                { label: 'Ya existen', v: archivos.filter((a) => a.estado === 'ya_existe').length,color: 'var(--t2)' },
                { label: 'Con error',  v: archivos.filter((a) => a.estado === 'error').length,    color: 'var(--red)' },
              ].map(({ label, v, color }) => v > 0 || label === 'Total' ? (
                <div key={label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                  <span style={{ color: 'var(--t2)' }}>{label}</span>
                  <span style={{ fontWeight: 600, color }}>{v}</span>
                </div>
              ) : null)}
            </div>
          </div>

          {/* Columna derecha — tabla de archivos */}
          <div className="tc" style={{ margin: 0 }}>
            <div style={{ padding: '10px 14px', borderBottom: '1px solid var(--bl)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 13, fontWeight: 600 }}>
                {archivos.length} archivo{archivos.length > 1 ? 's' : ''}
              </span>
            </div>
            <table style={{ minWidth: 'unset' }}>
              <thead>
                <tr>
                  <th>Archivo</th>
                  <th style={{ width: 90 }}>Tamaño</th>
                  <th style={{ width: 160 }}>Estado</th>
                  <th style={{ width: 40 }} />
                </tr>
              </thead>
              <tbody>
                {archivos.map((a) => (
                  <FilaArchivo key={a.uid} archivo={a} onEliminar={handleEliminar} />
                ))}
              </tbody>
            </table>
            <Resumen archivos={archivos} />
          </div>

        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
