'use client'

import { useState } from 'react'
import { getMonth, getYear } from 'date-fns'

const MESES = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic']

interface FacturaKpi {
  id: number
  estado: string
  formaPago: string | null
  montoNeto: number | string
  registradoContable: boolean
  fechaEmision: Date | string
}
interface ReqKpi {
  id: number; estado: string; prioridad: string
  diasRetraso: number; createdAt: Date | string
}

function fmtS(n: number) {
  return 'S/ ' + n.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

// ─── KPI card ────────────────────────────────────────────────────────────────

function KpiCard({
  label, count, monto, color,
}: { label: string; count: number; monto?: number; color: 'r' | 'a' | 'b' | 'g' | 't' }) {
  return (
    <div className="mc">
      <div className="mc-label">{label}</div>
      <div className={`mc-value ${color}`}>{count}</div>
      {monto !== undefined && (
        <div style={{
          fontSize: 11, color: 'var(--t3)', marginTop: 2,
          fontVariantNumeric: 'tabular-nums',
        }}>
          {fmtS(monto)}
        </div>
      )}
    </div>
  )
}

// ─── Main ────────────────────────────────────────────────────────────────────

export function IndicadoresView({
  facturas, requerimientos,
}: { facturas: FacturaKpi[]; requerimientos: ReqKpi[] }) {
  const [periodo, setPeriodo] = useState<6 | 12>(6)

  const now        = new Date()
  const añoActual  = getYear(now)
  const mesActual  = getMonth(now)

  // Convierte Decimal de Prisma a número
  const monto = (f: FacturaKpi) => Number(f.montoNeto)

  // ── Filtros ──────────────────────────────────────────────────────────────
  const vencidas   = facturas.filter((f) => f.estado === 'VENCIDA')
  const porVencer  = facturas.filter((f) => f.estado === 'POR_VENCER')
  const sinRegistro= facturas.filter((f) => !f.registradoContable && f.estado !== 'PAGADA')
  const credPend   = facturas.filter((f) => f.formaPago === 'CREDITO'             && f.estado !== 'PAGADA')
  const factPend   = facturas.filter((f) => f.formaPago === 'FACTORING'           && f.estado !== 'PAGADA')
  const negPend    = facturas.filter((f) => f.formaPago === 'FACTURA_NEGOCIABLE'  && f.estado !== 'PAGADA')
  const letraPend  = facturas.filter((f) => f.formaPago === 'LETRA'               && f.estado !== 'PAGADA')

  const reqPend      = requerimientos.filter((r) => r.estado === 'PENDIENTE' || r.estado === 'NO_ATENDIDO')
  const reqAlta      = reqPend.filter((r) => r.prioridad === 'ALTA')
  const reqAtTotal   = requerimientos.filter((r) => r.estado === 'ATENDIDO_TOTAL')
  const reqAtParcial = requerimientos.filter((r) => r.estado === 'ATENDIDO_PARCIAL')

  const sum = (arr: FacturaKpi[]) => arr.reduce((acc, f) => acc + monto(f), 0)

  // ── Chart data (respeta periodo seleccionado) ────────────────────────────
  const chartData = Array.from({ length: periodo }, (_, i) => {
    const offset  = (mesActual - (periodo - 1) + i + 24) % 12
    const año     = offset > mesActual ? añoActual - 1 : añoActual
    const fMes    = facturas.filter((f) => {
      const d = new Date(f.fechaEmision)
      return getMonth(d) === offset && getYear(d) === año
    })
    const rMes = requerimientos.filter((r) => {
      const d = new Date(r.createdAt)
      return getMonth(d) === offset && getYear(d) === año
    })
    return {
      mes:       MESES[offset],
      sinReg:    fMes.filter((f) => !f.registradoContable).length,
      reqs:      rMes.filter((r) => r.estado === 'PENDIENTE').length,
      isCurrent: offset === mesActual,
    }
  })

  const maxSinReg = Math.max(...chartData.map((d) => d.sinReg), 1)
  const maxReqs   = Math.max(...chartData.map((d) => d.reqs), 1)

  const byFormaPago = [
    { label: 'Crédito',            color: 'var(--blue)',  count: credPend.length,  total: sum(credPend) },
    { label: 'Factoring',          color: 'var(--amber)', count: factPend.length,  total: sum(factPend) },
    { label: 'Factura negociable', color: 'var(--ora)',   count: negPend.length,   total: sum(negPend) },
    { label: 'Letra',              color: 'var(--t3)',    count: letraPend.length, total: sum(letraPend) },
  ]

  return (
    <div>

      {/* ── KPIs ─────────────────────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(130px,1fr))', gap: 11, marginBottom: 16 }}>
        <KpiCard label="Facturas vencidas"           count={vencidas.length}    monto={sum(vencidas)}   color="r" />
        <KpiCard label="Por vencer (7 días)"         count={porVencer.length}   monto={sum(porVencer)}  color="a" />
        <KpiCard label="Sin registro contable"       count={sinRegistro.length}                         color="a" />
        <KpiCard label="Crédito por pagar"           count={credPend.length}    monto={sum(credPend)}   color="b" />
        <KpiCard label="Factoring"                   count={factPend.length}    monto={sum(factPend)}   color="a" />
        <KpiCard label="Negociables"                 count={negPend.length}     monto={sum(negPend)}    color="a" />
        <KpiCard label="Req. urgentes (Alta)"        count={reqAlta.length}                             color="r" />
        <KpiCard label="Req. pendientes total"       count={reqPend.length}                             color="a" />
      </div>

      {/* ── Gráfica facturas sin registro ────────────────────────────────── */}
      <div style={{ background: 'var(--bg)', border: '1px solid var(--bl)', borderRadius: 'var(--rl)', padding: 16, marginBottom: 14, boxShadow: 'var(--sh)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <span style={{ fontSize: 13, fontWeight: 600 }}>Facturas pendientes de registro contable · por mes</span>
          <select
            value={periodo}
            onChange={(e) => setPeriodo(Number(e.target.value) as 6 | 12)}
            style={{ height: 27, fontSize: 12, padding: '0 8px', border: '1px solid var(--bm)', borderRadius: 'var(--r)', background: 'var(--bg)', fontFamily: 'var(--f)' }}
          >
            <option value={6}>Últimos 6 meses</option>
            <option value={12}>Últimos 12 meses</option>
          </select>
        </div>
        <div className="bars">
          {chartData.map((d, i) => (
            <div key={i} className="bar-col">
              <div className="bar-fill"
                style={{
                  height: `${Math.max((d.sinReg / maxSinReg) * 100, 4)}%`,
                  background: d.isCurrent ? 'var(--red)' : 'var(--blue)',
                }}
              >
                {d.sinReg > 0 ? d.sinReg : ''}
              </div>
              <div className="bar-label" style={{ color: d.isCurrent ? 'var(--red)' : undefined, fontWeight: d.isCurrent ? 600 : undefined }}>
                {d.mes}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Grid de cards ────────────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>

        {/* Reqs por estado */}
        <div style={{ background: 'var(--bg)', border: '1px solid var(--bl)', borderRadius: 'var(--rl)', padding: 14, boxShadow: 'var(--sh)' }}>
          <div className="ss">Requerimientos por estado</div>
          {([
            ['var(--red)',    'Pendiente / No atendido', reqPend.length],
            ['var(--ora)',    'Atendido parcial',         reqAtParcial.length],
            ['var(--green)',  'Atendido total',           reqAtTotal.length],
          ] as [string, string, number][]).map(([color, label, val]) => (
            <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 13, marginBottom: 7 }}>
              <div style={{ width: 9, height: 9, borderRadius: '50%', background: color, flexShrink: 0 }} />
              <span>{label}</span>
              <span style={{ marginLeft: 'auto', fontWeight: 600 }}>{val}</span>
            </div>
          ))}
        </div>

        {/* Reqs por prioridad */}
        <div style={{ background: 'var(--bg)', border: '1px solid var(--bl)', borderRadius: 'var(--rl)', padding: 14, boxShadow: 'var(--sh)' }}>
          <div className="ss">Requerimientos por prioridad</div>
          {([
            ['var(--red)',   'Alta · urgentes',  reqAlta.length],
            ['var(--amber)', 'Media · normal',   reqPend.filter((r) => r.prioridad === 'MEDIA').length],
          ] as [string, string, number][]).map(([color, label, val]) => (
            <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 13, marginBottom: 7 }}>
              <div style={{ width: 9, height: 9, borderRadius: '50%', background: color, flexShrink: 0 }} />
              <span>{label}</span>
              <span style={{ marginLeft: 'auto', fontWeight: 600 }}>{val}</span>
            </div>
          ))}
        </div>

        {/* Facturas por forma de pago — con montos */}
        <div style={{ background: 'var(--bg)', border: '1px solid var(--bl)', borderRadius: 'var(--rl)', padding: 14, boxShadow: 'var(--sh)' }}>
          <div className="ss">Facturas por forma de pago · pendientes</div>
          {byFormaPago.map(({ label, color, count, total }) => (
            <div key={label} style={{ marginBottom: 9 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 13 }}>
                <div style={{ width: 9, height: 9, borderRadius: '50%', background: color, flexShrink: 0 }} />
                <span>{label}</span>
                <span style={{ marginLeft: 'auto', fontWeight: 600 }}>{count}</span>
              </div>
              {count > 0 && (
                <div style={{ fontSize: 11, color: 'var(--t3)', paddingLeft: 16, marginTop: 1 }}>
                  {fmtS(total)}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Urgentes + gráfica reqs */}
        <div style={{ background: 'var(--bg)', border: '1px solid var(--bl)', borderRadius: 'var(--rl)', padding: 14, boxShadow: 'var(--sh)' }}>
          <div className="ss">Pedidos urgentes sin atender</div>
          <div style={{ background: 'var(--red-bg)', borderRadius: 'var(--rm)', padding: 13, textAlign: 'center' }}>
            <div style={{ fontSize: 34, fontWeight: 600, color: 'var(--red)', letterSpacing: -2 }}>{reqAlta.length}</div>
            <div style={{ fontSize: 12, color: 'var(--red-t)' }}>pedidos urgentes pendientes</div>
          </div>
          <div style={{ marginTop: 16 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--t2)', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Reqs pendientes por mes
            </div>
            <div className="bars" style={{ height: 80 }}>
              {chartData.map((d, i) => (
                <div key={i} className="bar-col">
                  <div className="bar-fill"
                    style={{
                      height: `${Math.max((d.reqs / maxReqs) * 100, 4)}%`,
                      background: d.isCurrent ? 'var(--red)' : 'var(--amber)',
                    }}
                  >
                    {d.reqs > 0 ? d.reqs : ''}
                  </div>
                  <div className="bar-label">{d.mes}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>

      {/* ── Resumen financiero facturas vencidas ─────────────────────────── */}
      {vencidas.length > 0 && (
        <div style={{
          background: 'var(--red-bg)', border: '1px solid var(--red)', borderRadius: 'var(--rl)',
          padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12,
        }}>
          <div style={{ width: 10, height: 10, borderRadius: '50%', background: 'var(--red)', flexShrink: 0 }} />
          <span style={{ fontSize: 13, color: 'var(--red)', fontWeight: 500 }}>
            {vencidas.length} factura{vencidas.length !== 1 ? 's' : ''} vencida{vencidas.length !== 1 ? 's' : ''} sin pago —
            total: <strong>{fmtS(sum(vencidas))}</strong>
          </span>
        </div>
      )}

    </div>
  )
}
