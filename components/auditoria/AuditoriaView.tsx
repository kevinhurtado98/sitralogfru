'use client'

import { useState, useMemo } from 'react'
import { format } from 'date-fns'
import { IconCircleCheck, IconUpload, IconPencil, IconPlus, IconTrash, IconMail, IconSearch } from '@tabler/icons-react'
import type { Modulo } from '@prisma/client'

interface AuditLog {
  id: string; modulo: Modulo; accion: string; entidadId: string
  datosAnteriores: unknown; datosNuevos: unknown
  createdAt: Date | string
  user: { nombre: string; email: string }
}

const MODULO_STYLE: Record<string, { bg: string; color: string; icon: React.ReactNode; badgeCls: string; label: string }> = {
  COMPROBANTES:   { bg: 'var(--blue-bg)',  color: 'var(--blue)',  icon: <IconUpload size={14} />,       badgeCls: 'badge-blue',  label: 'Comprobantes' },
  REQUERIMIENTOS: { bg: 'var(--ora-bg)',   color: 'var(--ora)',   icon: <IconPencil size={14} />,       badgeCls: 'badge-ora',   label: 'Requerimientos' },
  USUARIOS:       { bg: 'var(--bg2)',      color: 'var(--t2)',    icon: <IconPlus size={14} />,         badgeCls: 'badge-slate', label: 'Usuarios' },
  AUTH:           { bg: 'var(--green-bg)', color: 'var(--green)', icon: <IconCircleCheck size={14} />,  badgeCls: 'badge-green', label: 'Auth' },
}

const ACCION_ICON: Record<string, React.ReactNode> = {
  IMPORTAR_XML:    <IconUpload size={14} />,
  CREAR:           <IconPlus size={14} />,
  EDITAR:          <IconPencil size={14} />,
  ELIMINAR:        <IconTrash size={14} />,
  NOTIFICACION:    <IconMail size={14} />,
  REGISTRO_CONTABLE: <IconCircleCheck size={14} />,
}

export function AuditoriaView({ logs }: { logs: AuditLog[] }) {
  const [busqueda, setBusqueda] = useState('')
  const [filtroModulo, setFiltroModulo] = useState('')

  const filtrados = useMemo(() => {
    let r = logs
    if (busqueda) {
      const q = busqueda.toLowerCase()
      r = r.filter((l) => l.user.nombre.toLowerCase().includes(q) || l.accion.toLowerCase().includes(q))
    }
    if (filtroModulo) r = r.filter((l) => l.modulo === filtroModulo)
    return r
  }, [logs, busqueda, filtroModulo])

  return (
    <>
      {/* Filtros */}
      <div className="fc">
        <div style={{ display: 'flex', gap: 9, flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div className="fg"><label>Módulo</label>
            <select value={filtroModulo} onChange={(e) => setFiltroModulo(e.target.value)}>
              <option value="">Todos</option>
              <option value="COMPROBANTES">Comprobantes</option>
              <option value="REQUERIMIENTOS">Requerimientos</option>
              <option value="AUTH">Auth</option>
            </select>
          </div>
          <div className="fg"><label>Usuario</label>
            <input type="text" placeholder="Nombre o correo..." value={busqueda} onChange={(e) => setBusqueda(e.target.value)} />
          </div>
          <div className="fg" style={{ maxWidth: 140 }}><label>Tipo acción</label>
            <select><option>Todas</option><option>Creación</option><option>Edición</option><option>Eliminación</option><option>Importación</option><option>Notificación</option></select>
          </div>
          <div className="fg" style={{ maxWidth: 130 }}><label>Desde</label><input type="date" /></div>
          <div className="fg" style={{ maxWidth: 130 }}><label>Hasta</label><input type="date" /></div>
          <button className="btn btn-p"><IconSearch size={13} /> Filtrar</button>
        </div>
      </div>

      {/* Lista */}
      <div className="tc">
        <div style={{ padding: '11px 15px', borderBottom: '1px solid var(--bl)' }}>
          <span style={{ fontSize: 13, fontWeight: 600 }}>Trazabilidad de movimientos</span>
        </div>
        <div>
          {filtrados.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--t3)', fontSize: 13 }}>
              Sin registros de auditoría
            </div>
          ) : filtrados.map((log) => {
            const s = MODULO_STYLE[log.modulo] ?? MODULO_STYLE['AUTH']
            const actionIcon = ACCION_ICON[log.accion] ?? <IconPencil size={14} />

            return (
              <div key={log.id} className="ar">
                <div style={{
                  width: 32, height: 32, borderRadius: '50%',
                  background: s.bg, color: s.color,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0,
                }}>
                  {actionIcon}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 2 }}>
                    {log.accion.replace(/_/g, ' ')} · {log.entidadId.slice(0, 8)}...
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--t3)', display: 'flex', gap: 10 }}>
                    <span>{log.user.nombre}</span>
                    <span>{log.user.email}</span>
                    <span>{s.label}</span>
                    <span>{format(new Date(log.createdAt), 'dd/MM/yyyy HH:mm')}</span>
                  </div>
                </div>
                <span className={`badge ${s.badgeCls}`} style={{ alignSelf: 'center' }}>
                  {log.accion.replace(/_/g, ' ')}
                </span>
              </div>
            )
          })}
        </div>
      </div>
    </>
  )
}
