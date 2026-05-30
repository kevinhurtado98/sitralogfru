'use client'

import { getMonth, getYear } from 'date-fns'

const MESES = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic']

interface FacturaKpi {
  id: string; estado: string; formaPago: string | null
  registradoContable: boolean; fechaEmision: Date | string
}
interface ReqKpi {
  id: string; estado: string; prioridad: string
  diasRetraso: number; createdAt: Date | string
}

export function IndicadoresView({ facturas, requerimientos }: { facturas: FacturaKpi[]; requerimientos: ReqKpi[] }) {
  const now = new Date()
  const añoActual = getYear(now)
  const mesActual = getMonth(now)

  const sinRegistro   = facturas.filter((f) => !f.registradoContable)
  const credPend      = facturas.filter((f) => f.formaPago === 'CREDITO'           && f.estado !== 'PAGADA')
  const factPend      = facturas.filter((f) => f.formaPago === 'FACTORING'         && f.estado !== 'PAGADA')
  const negPend       = facturas.filter ((f) => f.formaPago === 'FACTURA_NEGOCIABLE' && f.estado !== 'PAGADA')
  const reqPend       = requerimientos.filter((r) => r.estado === 'PENDIENTE' || r.estado === 'NO_ATENDIDO')
  const reqAlta       = reqPend.filter((r) => r.prioridad === 'ALTA')
  const reqAtTotal    = requerimientos.filter((r) => r.estado === 'ATENDIDO_TOTAL')
  const reqAtParcial  = requerimientos.filter((r) => r.estado === 'ATENDIDO_PARCIAL')

  // Últimos 6 meses para la gráfica
  const chartData = Array.from({ length: 6 }, (_, i) => {
    const mesOffset = (mesActual - 5 + i + 12) % 12
    const año = mesOffset > mesActual ? añoActual - 1 : añoActual
    const fMes = facturas.filter((f) => {
      const fd = new Date(f.fechaEmision)
      return getMonth(fd) === mesOffset && getYear(fd) === año
    })
    const rMes = requerimientos.filter((r) => {
      const rd = new Date(r.createdAt)
      return getMonth(rd) === mesOffset && getYear(rd) === año
    })
    return {
      mes: MESES[mesOffset],
      sinReg: fMes.filter((f) => !f.registradoContable).length,
      cred:   fMes.filter((f) => f.formaPago === 'CREDITO' && f.estado !== 'PAGADA').length,
      reqs:   rMes.filter((r) => r.estado === 'PENDIENTE').length,
      isCurrent: mesOffset === mesActual,
    }
  })

  const maxSinReg = Math.max(...chartData.map((d) => d.sinReg), 1)
  const maxReqs   = Math.max(...chartData.map((d) => d.reqs), 1)

  // Totales para pie-stats
  const byFormaPago = [
    { label: 'Crédito',           color: 'var(--blue)',  v: credPend.length },
    { label: 'Factoring',         color: 'var(--amber)', v: factPend.length },
    { label: 'Factura negociable',color: 'var(--ora)',   v: negPend.length },
    { label: 'Letra',             color: 'var(--t3)',    v: facturas.filter((f) => f.formaPago === 'LETRA' && f.estado !== 'PAGADA').length },
  ]

  return (
    <div>
      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(125px,1fr))', gap: 11, marginBottom: 16 }}>
        <div className="mc"><div className="mc-label">Fact. pend. contable (mes)</div><div className="mc-value a">{sinRegistro.length}</div></div>
        <div className="mc"><div className="mc-label">Facturas crédito por pagar</div><div className="mc-value r">{credPend.length}</div></div>
        <div className="mc"><div className="mc-label">Facturas factoring</div><div className="mc-value a">{factPend.length}</div></div>
        <div className="mc"><div className="mc-label">Facturas negociables</div><div className="mc-value a">{negPend.length}</div></div>
        <div className="mc"><div className="mc-label">Req. urgentes (Alta)</div><div className="mc-value r">{reqAlta.length}</div></div>
        <div className="mc"><div className="mc-label">Req. pendientes total</div><div className="mc-value a">{reqPend.length}</div></div>
      </div>

      {/* Gráfica facturas sin registro contable */}
      <div style={{ background: 'var(--bg)', border: '1px solid var(--bl)', borderRadius: 'var(--rl)', padding: 16, marginBottom: 14, boxShadow: 'var(--sh)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <span style={{ fontSize: 13, fontWeight: 600 }}>Facturas pendientes de registro contable · por mes</span>
          <select style={{ height: 27, fontSize: 12, padding: '0 8px', border: '1px solid var(--bm)', borderRadius: 'var(--r)', background: 'var(--bg)', fontFamily: 'var(--f)' }}>
            <option>Últimos 6 meses</option>
            <option>Últimos 12 meses</option>
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

      {/* Pie stats grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
        {/* Reqs por estado */}
        <div style={{ background: 'var(--bg)', border: '1px solid var(--bl)', borderRadius: 'var(--rl)', padding: 14, boxShadow: 'var(--sh)' }}>
          <div className="ss">Requerimientos por estado</div>
          {[
            ['var(--red)',   'Pendiente',        reqPend.length],
            ['var(--ora)',   'Atendido parcial',  reqAtParcial.length],
            ['var(--green)', 'Atendido total',    reqAtTotal.length],
          ].map(([color, label, val]) => (
            <div key={label as string} style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 13, marginBottom: 7 }}>
              <div style={{ width: 9, height: 9, borderRadius: '50%', background: color as string, flexShrink: 0 }} />
              <span>{label}</span>
              <span style={{ marginLeft: 'auto', fontWeight: 600 }}>{val}</span>
            </div>
          ))}
        </div>

        {/* Reqs por prioridad */}
        <div style={{ background: 'var(--bg)', border: '1px solid var(--bl)', borderRadius: 'var(--rl)', padding: 14, boxShadow: 'var(--sh)' }}>
          <div className="ss">Requerimientos por prioridad</div>
          {[
            ['var(--red)',   'Alta · urgentes', reqAlta.length],
            ['var(--amber)', 'Media · normal',  reqPend.filter((r) => r.prioridad === 'MEDIA').length],
          ].map(([color, label, val]) => (
            <div key={label as string} style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 13, marginBottom: 7 }}>
              <div style={{ width: 9, height: 9, borderRadius: '50%', background: color as string, flexShrink: 0 }} />
              <span>{label}</span>
              <span style={{ marginLeft: 'auto', fontWeight: 600 }}>{val}</span>
            </div>
          ))}
        </div>

        {/* Facturas por forma de pago */}
        <div style={{ background: 'var(--bg)', border: '1px solid var(--bl)', borderRadius: 'var(--rl)', padding: 14, boxShadow: 'var(--sh)' }}>
          <div className="ss">Facturas por forma de pago</div>
          {byFormaPago.map(({ label, color, v }) => (
            <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 13, marginBottom: 7 }}>
              <div style={{ width: 9, height: 9, borderRadius: '50%', background: color, flexShrink: 0 }} />
              <span>{label}</span>
              <span style={{ marginLeft: 'auto', fontWeight: 600 }}>{v}</span>
            </div>
          ))}
        </div>

        {/* Urgentes */}
        <div style={{ background: 'var(--bg)', border: '1px solid var(--bl)', borderRadius: 'var(--rl)', padding: 14, boxShadow: 'var(--sh)' }}>
          <div className="ss">Pedidos urgentes sin atender</div>
          <div style={{ background: 'var(--red-bg)', borderRadius: 'var(--rm)', padding: 13, textAlign: 'center' }}>
            <div style={{ fontSize: 34, fontWeight: 600, color: 'var(--red)', letterSpacing: -2 }}>{reqAlta.length}</div>
            <div style={{ fontSize: 12, color: 'var(--red-t)' }}>pedidos urgentes pendientes</div>
          </div>

          {/* Gráfica de reqs */}
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
    </div>
  )
}
