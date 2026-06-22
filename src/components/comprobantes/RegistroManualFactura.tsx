'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { format } from 'date-fns'
import { IconArrowLeft, IconDeviceFloppy } from '@tabler/icons-react'
import { crearFacturaManual } from '@/lib/actions/comprobantes'
import type { Moneda, TipoFactura, FormaPago } from '@/lib/types'

export function RegistroManualFactura() {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState('')

  const [proveedor,        setProveedor]        = useState('')
  const [rucProveedor,     setRucProveedor]     = useState('')
  const [serie,            setSerie]            = useState('')
  const [numero,           setNumero]           = useState('')
  const [fechaEmision,     setFechaEmision]     = useState(format(new Date(), 'yyyy-MM-dd'))
  const [fechaVencimiento, setFechaVencimiento] = useState('')
  const [moneda,           setMoneda]           = useState<Moneda>('SOLES')
  const [tipo,             setTipo]             = useState<TipoFactura>('COMPRA')
  const [monto,            setMonto]            = useState('')
  const [formaPago,        setFormaPago]        = useState<FormaPago | ''>('')
  const [ordenCompra,      setOrdenCompra]      = useState('')
  const [notas,            setNotas]            = useState('')

  function guardar() {
    setError('')
    const montoNum = parseFloat(monto)

    if (!proveedor.trim() || !serie.trim() || !numero.trim() || !fechaVencimiento || isNaN(montoNum) || montoNum <= 0) {
      setError('Completa proveedor, serie, número, fecha de vencimiento y monto.')
      return
    }

    startTransition(async () => {
      const res = await crearFacturaManual({
        proveedor: proveedor.trim(),
        rucProveedor: rucProveedor.trim() || undefined,
        serie: serie.trim(),
        numero: numero.trim(),
        fechaEmision,
        fechaVencimiento,
        moneda,
        tipo,
        monto: montoNum,
        formaPago: formaPago || undefined,
        ordenCompra: ordenCompra.trim() || undefined,
        notas: notas.trim() || undefined,
      })
      if (!res.ok) { setError(res.error); return }
      router.push(`/comprobantes/${res.id}`)
      router.refresh()
    })
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 16 }}>
        <Link href="/comprobantes">
          <button className="btn btn-sm"><IconArrowLeft size={13} /> Volver</button>
        </Link>
        <span style={{ fontSize: 13, color: 'var(--t2)' }}>Registro manual de factura</span>
      </div>

      {error && (
        <div style={{
          padding: '8px 12px', borderRadius: 'var(--r)', fontSize: 13, marginBottom: 14,
          background: '#fef2f2', color: 'var(--red)', border: '1px solid #fecaca',
        }}>
          {error}
        </div>
      )}

      <div className="dc">
        <div className="ss">Datos de la factura</div>
        <p style={{ fontSize: 12, color: 'var(--t3)', marginBottom: 14 }}>
          Usa este formulario cuando el proveedor no envía el XML de la factura electrónica.
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>

          <div className="fi" style={{ gridColumn: 'span 2' }}>
            <label>Proveedor *</label>
            <input type="text" value={proveedor} onChange={(e) => setProveedor(e.target.value)} placeholder="Razón social" />
          </div>

          <div className="fi">
            <label>RUC proveedor</label>
            <input type="text" value={rucProveedor} onChange={(e) => setRucProveedor(e.target.value)} maxLength={20} style={{ fontFamily: 'var(--fm)' }} />
          </div>

          <div className="fi">
            <label>Moneda</label>
            <select value={moneda} onChange={(e) => setMoneda(e.target.value as Moneda)}>
              <option value="SOLES">Soles (PEN)</option>
              <option value="DOLARES">Dólares (USD)</option>
              <option value="EUROS">Euros (EUR)</option>
            </select>
          </div>

          <div className="fi">
            <label>Serie *</label>
            <input type="text" value={serie} onChange={(e) => setSerie(e.target.value)} placeholder="F001" maxLength={10} style={{ fontFamily: 'var(--fm)', textTransform: 'uppercase' }} />
          </div>

          <div className="fi">
            <label>Número *</label>
            <input type="text" value={numero} onChange={(e) => setNumero(e.target.value)} placeholder="00001234" maxLength={20} style={{ fontFamily: 'var(--fm)' }} />
          </div>

          <div className="fi">
            <label>Fecha emisión *</label>
            <input type="date" value={fechaEmision} onChange={(e) => setFechaEmision(e.target.value)} />
          </div>

          <div className="fi">
            <label>Fecha vencimiento *</label>
            <input type="date" value={fechaVencimiento} onChange={(e) => setFechaVencimiento(e.target.value)} />
          </div>

          <div className="fi">
            <label>Monto total *</label>
            <input type="number" value={monto} onChange={(e) => setMonto(e.target.value)} placeholder="0.00" min="0.01" step="0.01" />
          </div>

          <div className="fi">
            <label>Tipo de compra</label>
            <select value={tipo} onChange={(e) => setTipo(e.target.value as TipoFactura)}>
              <option value="COMPRA">Factura de Compra</option>
              <option value="SERVICIO">Factura de Servicio</option>
            </select>
          </div>

          <div className="fi">
            <label>Forma de pago</label>
            <select value={formaPago} onChange={(e) => setFormaPago(e.target.value as FormaPago | '')}>
              <option value="">— Sin asignar —</option>
              <option value="CREDITO">Crédito</option>
              <option value="FACTORING">Factoring</option>
              <option value="FACTURA_NEGOCIABLE">Factura negociable</option>
              <option value="LETRA">Letra</option>
            </select>
          </div>

          <div className="fi">
            <label>N° Orden de compra (OCO)</label>
            <input type="text" value={ordenCompra} onChange={(e) => setOrdenCompra(e.target.value)} placeholder="OCO 2026-000000" style={{ fontFamily: 'var(--fm)' }} />
          </div>

          <div className="fi" style={{ gridColumn: '1 / -1' }}>
            <label>Notas internas</label>
            <textarea value={notas} onChange={(e) => setNotas(e.target.value)} placeholder="Observaciones, comentarios..." rows={3} />
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 9, justifyContent: 'flex-end', paddingBottom: 6 }}>
        <button className="btn btn-p" onClick={guardar} disabled={isPending}>
          <IconDeviceFloppy size={13} /> {isPending ? 'Guardando...' : 'Registrar factura'}
        </button>
      </div>
    </div>
  )
}
