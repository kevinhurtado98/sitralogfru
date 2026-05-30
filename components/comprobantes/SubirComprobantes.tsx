'use client'

import { useRef, useState } from 'react'
import Link from 'next/link'
import {
  ArrowLeft,
  Upload,
  FileText,
  X,
  CheckCircle2,
  AlertCircle,
  Loader2,
  RefreshCw,
  Clock,
  Ban,
} from 'lucide-react'
import { Button } from '@/components/ui/button'

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

function uid(): string {
  return Math.random().toString(36).slice(2)
}

// ─── Estado badge ─────────────────────────────────────────────────────────────

const estadoConfig: Record<
  Estado,
  { label: string; icon: React.ReactNode; className: string }
> = {
  pendiente: {
    label: 'Pendiente',
    icon: <Clock className="h-3.5 w-3.5" />,
    className: 'bg-yellow-50 text-yellow-700 border-yellow-200',
  },
  subiendo: {
    label: 'Subiendo...',
    icon: <Loader2 className="h-3.5 w-3.5 animate-spin" />,
    className: 'bg-blue-50 text-blue-700 border-blue-200',
  },
  exitoso: {
    label: 'Registrado',
    icon: <CheckCircle2 className="h-3.5 w-3.5" />,
    className: 'bg-green-50 text-green-700 border-green-200',
  },
  ya_existe: {
    label: 'Ya existe',
    icon: <Ban className="h-3.5 w-3.5" />,
    className: 'bg-slate-100 text-slate-600 border-slate-200',
  },
  error: {
    label: 'Error',
    icon: <AlertCircle className="h-3.5 w-3.5" />,
    className: 'bg-red-50 text-red-700 border-red-200',
  },
}

function EstadoBadge({ estado }: { estado: Estado }) {
  const cfg = estadoConfig[estado]
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${cfg.className}`}
    >
      {cfg.icon}
      {cfg.label}
    </span>
  )
}

// ─── Fila de archivo ──────────────────────────────────────────────────────────

function FilaArchivo({
  archivo,
  onEliminar,
}: {
  archivo: ArchivoXML
  onEliminar: (uid: string) => void
}) {
  const eliminable = archivo.estado === 'pendiente'

  return (
    <div className="flex items-center gap-4 px-4 py-3 border-b border-gray-100 last:border-0 hover:bg-gray-50/60 transition-colors">
      {/* Icono */}
      <div className="shrink-0 w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
        <FileText className="h-4 w-4 text-blue-500" />
      </div>

      {/* Nombre + peso */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-800 truncate">{archivo.nombre}</p>
        <p className="text-xs text-gray-400 mt-0.5">{archivo.peso}</p>
        {archivo.mensaje && (
          <p className="text-xs text-red-500 mt-0.5">{archivo.mensaje}</p>
        )}
      </div>

      {/* Estado */}
      <div className="shrink-0">
        <EstadoBadge estado={archivo.estado} />
      </div>

      {/* Eliminar — solo cuando está pendiente */}
      <button
        onClick={() => onEliminar(archivo.uid)}
        disabled={!eliminable}
        className="shrink-0 p-1 rounded-md text-gray-300 hover:text-red-500 hover:bg-red-50 transition-colors disabled:opacity-0 disabled:pointer-events-none"
        title="Quitar archivo"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  )
}

// ─── Resumen post-procesamiento ───────────────────────────────────────────────

function ResumenProceso({ archivos }: { archivos: ArchivoXML[] }) {
  const exitosos = archivos.filter((a) => a.estado === 'exitoso').length
  const yaExisten = archivos.filter((a) => a.estado === 'ya_existe').length
  const errores = archivos.filter((a) => a.estado === 'error').length

  if (exitosos === 0 && yaExisten === 0 && errores === 0) return null

  return (
    <div className="flex items-center gap-4 px-4 py-3 bg-gray-50 border-t border-gray-100 text-xs rounded-b-xl">
      {exitosos > 0 && (
        <span className="flex items-center gap-1 text-green-700 font-medium">
          <CheckCircle2 className="h-3.5 w-3.5" />
          {exitosos} registrado{exitosos > 1 ? 's' : ''}
        </span>
      )}
      {yaExisten > 0 && (
        <span className="flex items-center gap-1 text-slate-500 font-medium">
          <Ban className="h-3.5 w-3.5" />
          {yaExisten} ya existía{yaExisten > 1 ? 'n' : ''}
        </span>
      )}
      {errores > 0 && (
        <span className="flex items-center gap-1 text-red-600 font-medium">
          <AlertCircle className="h-3.5 w-3.5" />
          {errores} con error
        </span>
      )}
    </div>
  )
}

// ─── Componente principal ─────────────────────────────────────────────────────

export function SubirComprobantes() {
  const inputRef = useRef<HTMLInputElement>(null)
  const [archivos, setArchivos] = useState<ArchivoXML[]>([])

  const procesando = archivos.some((a) => a.estado === 'subiendo')
  const pendientes = archivos.filter((a) => a.estado === 'pendiente')
  const hayResultados = archivos.some(
    (a) => a.estado === 'exitoso' || a.estado === 'ya_existe' || a.estado === 'error'
  )

  function handleSeleccionar(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? [])
    const nuevos: ArchivoXML[] = files.map((f) => ({
      uid: uid(),
      file: f,
      nombre: f.name,
      peso: formatPeso(f.size),
      estado: 'pendiente',
    }))
    setArchivos((prev) => [...prev, ...nuevos])
    // Reset input para poder seleccionar los mismos archivos de nuevo
    e.target.value = ''
  }

  function handleEliminar(uid: string) {
    setArchivos((prev) => prev.filter((a) => a.uid !== uid))
  }

  function handleLimpiar() {
    setArchivos([])
  }

  async function handleProcesar() {
    if (pendientes.length === 0) return

    // Marca todos los pendientes como "subiendo"
    setArchivos((prev) =>
      prev.map((a) => (a.estado === 'pendiente' ? { ...a, estado: 'subiendo' } : a))
    )

    // Cada archivo se sube de forma independiente
    await Promise.allSettled(
      pendientes.map(async (archivo) => {
        const body = new FormData()
        body.append('archivo', archivo.file)

        let nuevoEstado: Estado = 'error'
        let mensaje: string | undefined

        try {
          const res = await fetch('/api/comprobantes/upload', {
            method: 'POST',
            body,
          })

          // Si el servidor devuelve 401 lo manejamos sin romper los otros
          if (res.status === 401) {
            nuevoEstado = 'error'
            mensaje = 'Sesión expirada, recarga la página'
          } else {
            const data = (await res.json()) as {
              estado: Estado
              mensaje?: string
            }
            nuevoEstado = data.estado
            mensaje = data.mensaje
          }
        } catch {
          nuevoEstado = 'error'
          mensaje = 'Error de conexión con el servidor'
        }

        setArchivos((prev) =>
          prev.map((a) =>
            a.uid === archivo.uid ? { ...a, estado: nuevoEstado, mensaje } : a
          )
        )
      })
    )
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          href="/comprobantes"
          className="p-2 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-gray-900">Subir comprobantes</h1>
          <p className="text-sm text-gray-500">Selecciona uno o varios archivos XML (SUNAT UBL 2.1)</p>
        </div>
      </div>

      {/* Zona de carga */}
      <div className="rounded-xl border-2 border-dashed border-gray-200 bg-white px-6 py-10 text-center">
        <div className="mx-auto w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center mb-4">
          <Upload className="h-6 w-6 text-blue-500" />
        </div>
        <p className="text-sm text-gray-600 mb-1 font-medium">
          Haz clic para seleccionar archivos XML
        </p>
        <p className="text-xs text-gray-400 mb-5">Puedes seleccionar múltiples archivos a la vez</p>

        <input
          ref={inputRef}
          type="file"
          accept=".xml"
          multiple
          className="hidden"
          onChange={handleSeleccionar}
        />
        <Button
          variant="outline"
          onClick={() => inputRef.current?.click()}
          disabled={procesando}
        >
          <Upload className="h-4 w-4" />
          Seleccionar archivos XML
        </Button>
      </div>

      {/* Lista de archivos */}
      {archivos.length > 0 && (
        <div className="rounded-xl border border-gray-200 bg-white overflow-hidden shadow-sm">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-gray-50">
            <p className="text-sm font-medium text-gray-700">
              {archivos.length} archivo{archivos.length > 1 ? 's' : ''}
            </p>
            {hayResultados && !procesando && (
              <button
                onClick={handleLimpiar}
                className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-600 transition-colors"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                Limpiar lista
              </button>
            )}
          </div>

          <div>
            {archivos.map((archivo) => (
              <FilaArchivo
                key={archivo.uid}
                archivo={archivo}
                onEliminar={handleEliminar}
              />
            ))}
          </div>

          <ResumenProceso archivos={archivos} />
        </div>
      )}

      {/* Acciones */}
      {archivos.length > 0 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-400">
            {pendientes.length > 0
              ? `${pendientes.length} archivo${pendientes.length > 1 ? 's' : ''} pendiente${pendientes.length > 1 ? 's' : ''}`
              : procesando
              ? 'Procesando...'
              : 'Todos los archivos procesados'}
          </p>
          <div className="flex gap-2">
            {hayResultados && !procesando && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => inputRef.current?.click()}
              >
                <Upload className="h-4 w-4" />
                Subir más
              </Button>
            )}
            {pendientes.length > 0 && (
              <Button
                variant="primary"
                size="sm"
                onClick={handleProcesar}
                disabled={procesando}
              >
                {procesando ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Procesando...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4" />
                    Procesar {pendientes.length} archivo{pendientes.length > 1 ? 's' : ''}
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
