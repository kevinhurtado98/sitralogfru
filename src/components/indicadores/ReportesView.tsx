'use client'

import { useState } from 'react'
import {
  BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer,
} from 'recharts'
import { IconFileDownload, IconLoader2 } from '@tabler/icons-react'
import { REPORTES, type ReporteResultado } from '@/lib/reportes-catalogo'

type Vista = 'tabla' | 'barras' | 'pastel'

const COLORES = ['var(--blue)', 'var(--amber)', 'var(--green)', 'var(--red)', 'var(--ora)', 'var(--t3)']

export function ReportesView() {
  const [tipo,      setTipo]      = useState(REPORTES[0].id)
  const [desde,     setDesde]     = useState('')
  const [hasta,     setHasta]     = useState('')
  const [vista,     setVista]     = useState<Vista>('tabla')
  const [resultado, setResultado] = useState<ReporteResultado | null>(null)
  const [cargando,  setCargando]  = useState(false)
  const [exportando,setExportando]= useState(false)
  const [error,     setError]     = useState('')

  const reporteActual = REPORTES.find((r) => r.id === tipo)!

  async function generar() {
    setCargando(true); setError(''); setResultado(null)
    try {
      const params = new URLSearchParams()
      if (desde) params.set('desde', desde)
      if (hasta) params.set('hasta', hasta)
      const res = await fetch(`/api/reportes/${tipo}?${params.toString()}`)
      if (!res.ok) {
        setError('No se pudo generar el reporte.')
        return
      }
      setResultado(await res.json())
    } catch {
      setError('Error de conexión al generar el reporte.')
    } finally {
      setCargando(false)
    }
  }

  function rangoTexto() {
    if (desde && hasta) return `Del ${desde} al ${hasta}`
    if (desde) return `Desde ${desde}`
    if (hasta) return `Hasta ${hasta}`
    return 'Todos los registros'
  }

  async function exportarPDF() {
    if (!resultado) return
    setExportando(true)
    try {
      const res = await fetch('/api/reportes/exportar-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          titulo: reporteActual.label,
          columnas: resultado.columnas,
          filas: resultado.filas,
          rango: rangoTexto(),
        }),
      })
      if (!res.ok) { setError('No se pudo generar el PDF.'); return }
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${tipo}.pdf`
      a.click()
      URL.revokeObjectURL(url)
    } finally {
      setExportando(false)
    }
  }

  return (
    <div>
      {/* Formulario */}
      <div className="dc">
        <div className="ss">Generar reporte</div>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div className="fg" style={{ minWidth: 230 }}>
            <label>Tipo de reporte</label>
            <select value={tipo} onChange={(e) => setTipo(e.target.value)}>
              {REPORTES.map((r) => <option key={r.id} value={r.id}>{r.label}</option>)}
            </select>
          </div>
          <div className="fg" style={{ maxWidth: 150 }}>
            <label>Desde</label>
            <input type="date" value={desde} onChange={(e) => setDesde(e.target.value)} />
          </div>
          <div className="fg" style={{ maxWidth: 150 }}>
            <label>Hasta</label>
            <input type="date" value={hasta} onChange={(e) => setHasta(e.target.value)} />
          </div>
          <div className="fg" style={{ maxWidth: 160 }}>
            <label>Vista</label>
            <select value={vista} onChange={(e) => setVista(e.target.value as Vista)}>
              <option value="tabla">Tabla</option>
              <option value="barras">Gráfico de barras</option>
              <option value="pastel">Gráfico de pastel</option>
            </select>
          </div>
          <button className="btn btn-p" onClick={generar} disabled={cargando}>
            {cargando ? <><IconLoader2 size={13} className="spin" /> Generando...</> : 'Generar reporte'}
          </button>
        </div>
        {error && (
          <div style={{ marginTop: 10, fontSize: 12, color: 'var(--red)' }}>{error}</div>
        )}
      </div>

      {/* Resultado */}
      {resultado && (
        <div className="dc">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <div>
              <div className="ss" style={{ marginBottom: 2 }}>{reporteActual.label}</div>
              <span style={{ fontSize: 12, color: 'var(--t3)' }}>{rangoTexto()} · {resultado.filas.length} registro{resultado.filas.length !== 1 ? 's' : ''}</span>
            </div>
            <button className="btn btn-sm" onClick={exportarPDF} disabled={exportando}>
              <IconFileDownload size={13} /> {exportando ? 'Generando PDF...' : 'Exportar PDF'}
            </button>
          </div>

          {resultado.filas.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--t3)', fontSize: 13 }}>
              No hay datos para este reporte en el rango seleccionado.
            </div>
          ) : vista === 'tabla' ? (
            <div style={{ overflowX: 'auto' }}>
              <table>
                <thead>
                  <tr>{resultado.columnas.map((c, i) => <th key={i}>{c}</th>)}</tr>
                </thead>
                <tbody>
                  {resultado.filas.map((fila, i) => (
                    <tr key={i}>
                      {fila.map((valor, j) => <td key={j}>{valor}</td>)}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : vista === 'barras' ? (
            <div style={{ width: '100%', height: 340 }}>
              <ResponsiveContainer>
                <BarChart data={resultado.agregado}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--bl)" />
                  <XAxis dataKey="categoria" fontSize={11} />
                  <YAxis fontSize={11} />
                  <Tooltip />
                  <Bar dataKey="valor" fill="var(--blue)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div style={{ width: '100%', height: 340 }}>
              <ResponsiveContainer>
                <PieChart>
                  <Pie
                    data={resultado.agregado}
                    dataKey="valor"
                    nameKey="categoria"
                    cx="50%" cy="50%"
                    outerRadius={120}
                    label={(d) => d.name}
                  >
                    {resultado.agregado.map((_, i) => (
                      <Cell key={i} fill={COLORES[i % COLORES.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
