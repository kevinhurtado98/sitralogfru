// Módulo de Auditoría: muestra el historial de acciones realizadas en el sistema
'use client'

import { useState, useTransition, useEffect, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { format } from 'date-fns'
import { IconCircleCheck, IconUpload, IconPencil, IconPlus, IconTrash, IconMail, IconSearch, IconSettings, IconCheck, IconBan, IconChevronLeft, IconChevronRight } from '@tabler/icons-react'
import { ENTIDAD_LABELS, CATEGORIA_LABELS } from '@/lib/auditoria-meta'

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
  IMPORTAR_XML:          <IconUpload size={14} />,
  CREAR:                 <IconPlus size={14} />,
  CREAR_REQUERIMIENTO:   <IconPlus size={14} />,
  CREAR_AREA:            <IconPlus size={14} />,
  CREAR_USUARIO:         <IconPlus size={14} />,
  CREAR_RESPONSABLE:     <IconPlus size={14} />,
  CREAR_NOTA_CREDITO:    <IconPlus size={14} />,
  CREAR_NOTA_DEBITO:     <IconPlus size={14} />,
  CREAR_MANUAL:          <IconPlus size={14} />,
  EDITAR:                <IconPencil size={14} />,
  EDITAR_AREA:           <IconPencil size={14} />,
  EDITAR_USUARIO:        <IconPencil size={14} />,
  CAMBIAR_ESTADO:        <IconPencil size={14} />,
  CAMBIAR_PASSWORD:      <IconPencil size={14} />,
  MARCAR_PAGADA:         <IconCircleCheck size={14} />,
  ELIMINAR:              <IconTrash size={14} />,
  ELIMINAR_RESPONSABLE:  <IconTrash size={14} />,
  NOTIFICACION:          <IconMail size={14} />,
  REGISTRO_CONTABLE:     <IconCircleCheck size={14} />,
  ACTIVAR_AREA:          <IconCheck size={14} />,
  DESACTIVAR_AREA:       <IconBan size={14} />,
  ACTIVAR_USUARIO:       <IconCheck size={14} />,
  DESACTIVAR_USUARIO:    <IconBan size={14} />,
  RESET_PASSWORD_USUARIO: <IconPencil size={14} />,
}

// Componente principal: muestra los logs con filtros por módulo, entidad, usuario, tipo y fecha, y paginación
export function AuditoriaView({ logs, total, page, pageSize }: {
  logs: AuditLog[]; total: number; page: number; pageSize: number
}) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [, startTransition] = useTransition()

  const [busqueda, setBusqueda] = useState(searchParams.get('usuario') ?? '')
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Refleja los params ya enviados al router. useSearchParams() solo se actualiza cuando la
  // navegación anterior termina de resolverse, así que si el usuario cambia dos filtros seguidos
  // (p.ej. dos selects en rápida sucesión) el segundo cambio partiría de un searchParams stale y
  // pisaría al primero. paramsRef se actualiza de forma síncrona en cada cambio que nosotros
  // mismos disparamos; lastPushedRef guarda qué valor le mandamos al router para distinguir
  // "todavía no aterriza nuestra propia navegación" de "el usuario navegó externamente" (atrás/adelante).
  const paramsRef = useRef<URLSearchParams>(new URLSearchParams(searchParams.toString()))
  const lastPushedRef = useRef<string | null>(null)
  useEffect(() => {
    const actual = searchParams.toString()
    if (lastPushedRef.current === null || actual !== lastPushedRef.current) {
      paramsRef.current = new URLSearchParams(actual)
      lastPushedRef.current = actual
    }
  }, [searchParams])

  const filtroModulo  = searchParams.get('modulo')  ?? ''
  const filtroEntidad = searchParams.get('entidad') ?? ''
  const filtroTipo    = searchParams.get('tipo')    ?? ''
  const filtroDesde   = searchParams.get('desde')   ?? ''
  const filtroHasta   = searchParams.get('hasta')   ?? ''

  // Construye la nueva URL a partir de los filtros vigentes, reseteando a la página 1
  function actualizarFiltros(cambios: Record<string, string>) {
    const params = paramsRef.current
    for (const [k, v] of Object.entries(cambios)) {
      if (v) params.set(k, v); else params.delete(k)
    }
    params.delete('page')
    const next = params.toString()
    lastPushedRef.current = next
    startTransition(() => router.push(`/auditoria?${next}`))
  }

  // Debounce de la búsqueda por usuario para no navegar en cada tecla
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      if (busqueda !== (searchParams.get('usuario') ?? '')) actualizarFiltros({ usuario: busqueda })
    }, 300)
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [busqueda])

  function irAPagina(p: number) {
    const params = paramsRef.current
    params.set('page', String(p))
    const next = params.toString()
    lastPushedRef.current = next
    startTransition(() => router.push(`/auditoria?${next}`))
  }

  function limpiar() {
    setBusqueda('')
    startTransition(() => router.push('/auditoria'))
  }

  const hayFiltros = !!(busqueda || filtroModulo || filtroEntidad || filtroTipo || filtroDesde || filtroHasta)
  const totalPaginas = Math.max(1, Math.ceil(total / pageSize))

  return (
    <>
      {/* Filtros */}
      <div className="fc">
        <div style={{ display: 'flex', gap: 9, flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div className="fg">
            <label>Módulo</label>
            <select value={filtroModulo} onChange={(e) => actualizarFiltros({ modulo: e.target.value })}>
              <option value="">Todos</option>
              <option value="COMPROBANTES">Comprobantes</option>
              <option value="REQUERIMIENTOS">Requerimientos</option>
              <option value="USUARIOS">Usuarios</option>
              <option value="CONFIGURACION">Configuración</option>
              <option value="AUTH">Auth</option>
            </select>
          </div>
          <div className="fg" style={{ maxWidth: 160 }}>
            <label>Entidad</label>
            <select value={filtroEntidad} onChange={(e) => actualizarFiltros({ entidad: e.target.value })}>
              <option value="">Todas</option>
              {Object.entries(ENTIDAD_LABELS).map(([valor, label]) => (
                <option key={valor} value={valor}>{label}</option>
              ))}
            </select>
          </div>
          <div className="fg">
            <label>Usuario</label>
            <input type="text" placeholder="Nombre o correo..." value={busqueda} onChange={(e) => setBusqueda(e.target.value)} />
          </div>
          <div className="fg" style={{ maxWidth: 150 }}>
            <label>Tipo acción</label>
            <select value={filtroTipo} onChange={(e) => actualizarFiltros({ tipo: e.target.value })}>
              <option value="">Todas</option>
              {Object.entries(CATEGORIA_LABELS).map(([valor, label]) => (
                <option key={valor} value={valor}>{label}</option>
              ))}
            </select>
          </div>
          <div className="fg" style={{ maxWidth: 130 }}>
            <label>Desde</label>
            <input type="date" value={filtroDesde} onChange={(e) => actualizarFiltros({ desde: e.target.value })} />
          </div>
          <div className="fg" style={{ maxWidth: 130 }}>
            <label>Hasta</label>
            <input type="date" value={filtroHasta} onChange={(e) => actualizarFiltros({ hasta: e.target.value })} />
          </div>
          {hayFiltros && (
            <button className="btn" onClick={limpiar}>
              <IconSearch size={13} /> Limpiar
            </button>
          )}
        </div>
        <div style={{ fontSize: 12, color: 'var(--t3)', marginTop: 8 }}>
          {total} registro{total !== 1 ? 's' : ''} en total
        </div>
      </div>

      {/* Lista */}
      <div className="tc">
        <div style={{ padding: '11px 15px', borderBottom: '1px solid var(--bl)' }}>
          <span style={{ fontSize: 13, fontWeight: 600 }}>Trazabilidad de movimientos</span>
        </div>
        <div>
          {logs.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--t3)', fontSize: 13 }}>
              Sin registros de auditoría
            </div>
          ) : logs.map((log) => {
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

        {/* Paginación */}
        {totalPaginas > 1 && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '11px 15px', borderTop: '1px solid var(--bl)' }}>
            <span style={{ fontSize: 12, color: 'var(--t3)' }}>Página {page} de {totalPaginas}</span>
            <div style={{ display: 'flex', gap: 6 }}>
              <button className="btn" disabled={page <= 1} onClick={() => irAPagina(page - 1)}>
                <IconChevronLeft size={14} /> Anterior
              </button>
              <button className="btn" disabled={page >= totalPaginas} onClick={() => irAPagina(page + 1)}>
                Siguiente <IconChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  )
}
