// Módulo de Auditoría: muestra el historial de acciones realizadas en el sistema
'use client'

import { useState, useMemo } from 'react'
import { format } from 'date-fns'
import { IconCircleCheck, IconUpload, IconPencil, IconPlus, IconTrash, IconMail, IconSearch, IconSettings, IconCheck, IconBan } from '@tabler/icons-react'

interface AuditLog {
  id: number; modulo: string; accion: string; entidadId: string
  datosAnteriores: unknown; datosNuevos: unknown
  createdAt: Date | string
  user: { nombre: string; email: string }
}

// Estilos visuales por módulo: color e ícono según el origen del log
const MODULO_STYLE: Record<string, { bg: string; color: string; icon: React.ReactNode; badgeCls: string; label: string }> = {
  COMPROBANTES:   { bg: 'var(--blue-bg)',  color: 'var(--blue)',  icon: <IconUpload size={14} />,       badgeCls: 'badge-blue',  label: 'Comprobantes' },
  REQUERIMIENTOS: { bg: 'var(--ora-bg)',   color: 'var(--ora)',   icon: <IconPencil size={14} />,       badgeCls: 'badge-ora',   label: 'Requerimientos' },
  USUARIOS:       { bg: 'var(--bg2)',      color: 'var(--t2)',    icon: <IconPlus size={14} />,         badgeCls: 'badge-slate', label: 'Usuarios' },
  AUTH:           { bg: 'var(--green-bg)', color: 'var(--green)', icon: <IconCircleCheck size={14} />,  badgeCls: 'badge-green', label: 'Auth' },
  CONFIGURACION:  { bg: 'var(--amber-bg)', color: 'var(--amber)', icon: <IconSettings size={14} />,     badgeCls: 'badge-amber', label: 'Configuración' },
}

// Íconos asignados a cada tipo de acción registrada en auditoría
const ACCION_ICON: Record<string, React.ReactNode> = {
  IMPORTAR_XML:      <IconUpload size={14} />,
  CREAR:             <IconPlus size={14} />,
  CREAR_REQUERIMIENTO: <IconPlus size={14} />,
  CREAR_AREA:        <IconPlus size={14} />,
  EDITAR:            <IconPencil size={14} />,
  EDITAR_AREA:       <IconPencil size={14} />,
  CAMBIAR_ESTADO:    <IconPencil size={14} />,
  MARCAR_PAGADA:     <IconCircleCheck size={14} />,
  ELIMINAR:          <IconTrash size={14} />,
  NOTIFICACION:      <IconMail size={14} />,
  REGISTRO_CONTABLE: <IconCircleCheck size={14} />,
  ACTIVAR_AREA:      <IconCheck size={14} />,
  DESACTIVAR_AREA:   <IconBan size={14} />,
}

// Agrupa las acciones en categorías para el filtro de tipo de acción
const CATEGORIA_ACCION: Record<string, string> = {
  CREAR: 'creacion', CREAR_REQUERIMIENTO: 'creacion', CREAR_AREA: 'creacion',
  EDITAR: 'edicion', EDITAR_AREA: 'edicion', CAMBIAR_ESTADO: 'edicion',
  ACTIVAR_AREA: 'edicion', DESACTIVAR_AREA: 'edicion',
  REGISTRO_CONTABLE: 'edicion', MARCAR_PAGADA: 'edicion',
  ELIMINAR: 'eliminacion',
  IMPORTAR_XML: 'importacion',
  NOTIFICACION: 'notificacion',
}

// Componente principal: muestra los logs con filtros por módulo, usuario, tipo y fecha
export function AuditoriaView({ logs }: { logs: AuditLog[] }) {
  const [busqueda,     setBusqueda]     = useState('')
  const [filtroModulo, setFiltroModulo] = useState('')
  const [filtroAccion, setFiltroAccion] = useState('')
  const [filtroDesde,  setFiltroDesde]  = useState('')
  const [filtroHasta,  setFiltroHasta]  = useState('')

  // Filtra los logs aplicando todos los criterios seleccionados por el usuario
  const filtrados = useMemo(() => {
    let r = logs

    if (busqueda) {
      const q = busqueda.toLowerCase()
      r = r.filter((l) => l.user.nombre.toLowerCase().includes(q) || l.user.email.toLowerCase().includes(q))
    }
    if (filtroModulo) r = r.filter((l) => l.modulo === filtroModulo)
    if (filtroAccion) r = r.filter((l) => CATEGORIA_ACCION[l.accion] === filtroAccion)
    if (filtroDesde)  r = r.filter((l) => new Date(l.createdAt) >= new Date(filtroDesde))
    if (filtroHasta) {
      const hasta = new Date(filtroHasta)
      hasta.setHours(23, 59, 59, 999)
      r = r.filter((l) => new Date(l.createdAt) <= hasta)
    }

    return r
  }, [logs, busqueda, filtroModulo, filtroAccion, filtroDesde, filtroHasta])

  // Resetea todos los filtros activos al estado inicial
  function limpiar() {
    setBusqueda(''); setFiltroModulo(''); setFiltroAccion('')
    setFiltroDesde(''); setFiltroHasta('')
  }

  return (
    <>
      {/* Filtros */}
      <div className="fc">
        <div style={{ display: 'flex', gap: 9, flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div className="fg">
            <label>Módulo</label>
            <select value={filtroModulo} onChange={(e) => setFiltroModulo(e.target.value)}>
              <option value="">Todos</option>
              <option value="COMPROBANTES">Comprobantes</option>
              <option value="REQUERIMIENTOS">Requerimientos</option>
              <option value="CONFIGURACION">Configuración</option>
              <option value="AUTH">Auth</option>
            </select>
          </div>
          <div className="fg">
            <label>Usuario</label>
            <input type="text" placeholder="Nombre o correo..." value={busqueda} onChange={(e) => setBusqueda(e.target.value)} />
          </div>
          <div className="fg" style={{ maxWidth: 150 }}>
            <label>Tipo acción</label>
            <select value={filtroAccion} onChange={(e) => setFiltroAccion(e.target.value)}>
              <option value="">Todas</option>
              <option value="creacion">Creación</option>
              <option value="edicion">Edición</option>
              <option value="eliminacion">Eliminación</option>
              <option value="importacion">Importación</option>
              <option value="notificacion">Notificación</option>
            </select>
          </div>
          <div className="fg" style={{ maxWidth: 130 }}>
            <label>Desde</label>
            <input type="date" value={filtroDesde} onChange={(e) => setFiltroDesde(e.target.value)} />
          </div>
          <div className="fg" style={{ maxWidth: 130 }}>
            <label>Hasta</label>
            <input type="date" value={filtroHasta} onChange={(e) => setFiltroHasta(e.target.value)} />
          </div>
          {(busqueda || filtroModulo || filtroAccion || filtroDesde || filtroHasta) && (
            <button className="btn" onClick={limpiar}>
              <IconSearch size={13} /> Limpiar
            </button>
          )}
        </div>
        {filtrados.length !== logs.length && (
          <div style={{ fontSize: 12, color: 'var(--t3)', marginTop: 8 }}>
            Mostrando {filtrados.length} de {logs.length} registros
          </div>
        )}
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
                    {log.accion.replace(/_/g, ' ')} · #{log.entidadId}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--t3)', display: 'flex', gap: 10, flexWrap: 'wrap' }}>
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
