'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { IconArrowLeft, IconSend, IconMailbox, IconFileAlert, IconClipboardList } from '@tabler/icons-react'
import {
  enviarPruebaBienvenida, enviarPruebaFacturasVencidas, enviarPruebaRequerimientos,
} from '@/lib/actions/correos-prueba'

type Tipo = 'bienvenida' | 'facturas' | 'requerimientos'

const TIPOS: { id: Tipo; label: string; icon: typeof IconMailbox; desc: string }[] = [
  { id: 'bienvenida',     label: 'Bienvenida',           icon: IconMailbox,       desc: 'Correo con credenciales de acceso a un nuevo usuario' },
  { id: 'facturas',       label: 'Facturas vencidas',    icon: IconFileAlert,     desc: 'Alerta diaria de facturas vencidas sin pago' },
  { id: 'requerimientos', label: 'Requerimientos pendientes', icon: IconClipboardList, desc: 'Alerta diaria de requerimientos no atendidos' },
]

function Feedback({ feedback }: { feedback: { ok: boolean; msg: string } | null }) {
  if (!feedback) return null
  return (
    <div style={{
      padding: '8px 12px', borderRadius: 'var(--r)', fontSize: 13, marginBottom: 14,
      background: feedback.ok ? '#f0fdf4' : '#fef2f2',
      color:      feedback.ok ? '#16a34a' : 'var(--red)',
      border:     `1px solid ${feedback.ok ? '#bbf7d0' : '#fecaca'}`,
    }}>
      {feedback.msg}
    </div>
  )
}

// ─── Form: Bienvenida ────────────────────────────────────────────────────────

function FormBienvenida({ correoInicial }: { correoInicial: string }) {
  const [isPending, startTransition] = useTransition()
  const [correo,     setCorreo]     = useState(correoInicial)
  const [nombres,    setNombres]    = useState('Kevin')
  const [apellidos,  setApellidos]  = useState('Hurtado')
  const [contrasena, setContrasena] = useState('12345678')
  const [feedback,   setFeedback]   = useState<{ ok: boolean; msg: string } | null>(null)

  function enviar() {
    setFeedback(null)
    startTransition(async () => {
      const res = await enviarPruebaBienvenida({ correo, nombres, apellidos, contrasena })
      setFeedback(res.ok
        ? { ok: true, msg: `Correo de bienvenida enviado a ${correo}.` }
        : { ok: false, msg: res.error })
    })
  }

  return (
    <div className="dc">
      <Feedback feedback={feedback} />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 14, marginBottom: 14 }}>
        <div className="fi" style={{ gridColumn: 'span 2' }}>
          <label>Enviar a *</label>
          <input type="email" value={correo} onChange={(e) => setCorreo(e.target.value)} placeholder="correo@ejemplo.com" />
        </div>
        <div className="fi">
          <label>Nombres</label>
          <input type="text" value={nombres} onChange={(e) => setNombres(e.target.value)} />
        </div>
        <div className="fi">
          <label>Apellidos</label>
          <input type="text" value={apellidos} onChange={(e) => setApellidos(e.target.value)} />
        </div>
        <div className="fi">
          <label>Contraseña temporal</label>
          <input type="text" value={contrasena} onChange={(e) => setContrasena(e.target.value)} style={{ fontFamily: 'var(--fm)' }} />
        </div>
      </div>
      <button className="btn btn-p" onClick={enviar} disabled={isPending || !correo}>
        <IconSend size={13} /> {isPending ? 'Enviando...' : 'Enviar correo de prueba'}
      </button>
    </div>
  )
}

// ─── Form: Facturas vencidas ─────────────────────────────────────────────────

function FormFacturas({ correoInicial }: { correoInicial: string }) {
  const [isPending, startTransition] = useTransition()
  const [correo,       setCorreo]       = useState(correoInicial)
  const [proveedor,    setProveedor]    = useState('Proveedor de Prueba S.A.C.')
  const [serie,        setSerie]        = useState('F001')
  const [numero,       setNumero]       = useState('00001234')
  const [moneda,       setMoneda]       = useState<'SOLES' | 'DOLARES' | 'EUROS'>('SOLES')
  const [montoNeto,    setMontoNeto]    = useState('1500.00')
  const [formaPago,    setFormaPago]    = useState('')
  const [diasVencida,  setDiasVencida]  = useState('5')
  const [feedback,     setFeedback]     = useState<{ ok: boolean; msg: string } | null>(null)

  function enviar() {
    setFeedback(null)
    const monto = parseFloat(montoNeto)
    const dias = parseInt(diasVencida)
    if (!correo || !proveedor || !serie || !numero || isNaN(monto) || isNaN(dias)) {
      setFeedback({ ok: false, msg: 'Completa todos los campos obligatorios.' })
      return
    }
    startTransition(async () => {
      const res = await enviarPruebaFacturasVencidas({
        correo, proveedor, serie, numero, moneda, montoNeto: monto,
        formaPago: formaPago || null, diasVencida: dias,
      })
      setFeedback(res.ok
        ? { ok: true, msg: `Correo de facturas vencidas enviado a ${correo}.` }
        : { ok: false, msg: res.error })
    })
  }

  return (
    <div className="dc">
      <Feedback feedback={feedback} />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 14 }}>
        <div className="fi" style={{ gridColumn: 'span 2' }}>
          <label>Enviar a *</label>
          <input type="email" value={correo} onChange={(e) => setCorreo(e.target.value)} placeholder="correo@ejemplo.com" />
        </div>
        <div className="fi" style={{ gridColumn: 'span 2' }}>
          <label>Proveedor</label>
          <input type="text" value={proveedor} onChange={(e) => setProveedor(e.target.value)} />
        </div>
        <div className="fi">
          <label>Serie</label>
          <input type="text" value={serie} onChange={(e) => setSerie(e.target.value)} style={{ fontFamily: 'var(--fm)' }} />
        </div>
        <div className="fi">
          <label>Número</label>
          <input type="text" value={numero} onChange={(e) => setNumero(e.target.value)} style={{ fontFamily: 'var(--fm)' }} />
        </div>
        <div className="fi">
          <label>Moneda</label>
          <select value={moneda} onChange={(e) => setMoneda(e.target.value as typeof moneda)}>
            <option value="SOLES">Soles (PEN)</option>
            <option value="DOLARES">Dólares (USD)</option>
            <option value="EUROS">Euros (EUR)</option>
          </select>
        </div>
        <div className="fi">
          <label>Monto neto</label>
          <input type="number" value={montoNeto} onChange={(e) => setMontoNeto(e.target.value)} step="0.01" />
        </div>
        <div className="fi">
          <label>Forma de pago</label>
          <select value={formaPago} onChange={(e) => setFormaPago(e.target.value)}>
            <option value="">— Sin asignar —</option>
            <option value="CREDITO">Crédito</option>
            <option value="FACTORING">Factoring</option>
            <option value="FACTURA_NEGOCIABLE">Factura negociable</option>
            <option value="LETRA">Letra</option>
          </select>
        </div>
        <div className="fi">
          <label>Días vencida</label>
          <input type="number" value={diasVencida} onChange={(e) => setDiasVencida(e.target.value)} min="0" />
        </div>
      </div>
      <button className="btn btn-p" onClick={enviar} disabled={isPending}>
        <IconSend size={13} /> {isPending ? 'Enviando...' : 'Enviar correo de prueba'}
      </button>
    </div>
  )
}

// ─── Form: Requerimientos pendientes ─────────────────────────────────────────

function FormRequerimientos({ correoInicial }: { correoInicial: string }) {
  const [isPending, startTransition] = useTransition()
  const [correo,      setCorreo]      = useState(correoInicial)
  const [area,        setArea]        = useState('Logística')
  const [responsable, setResponsable] = useState('Juan Pérez')
  const [prioridad,   setPrioridad]   = useState<'ALTA' | 'MEDIA'>('ALTA')
  const [diasRetraso, setDiasRetraso] = useState('2')
  const [descripcion, setDescripcion] = useState('Requerimiento de prueba para verificar el diseño del correo')
  const [feedback,    setFeedback]    = useState<{ ok: boolean; msg: string } | null>(null)

  function enviar() {
    setFeedback(null)
    const dias = parseInt(diasRetraso)
    if (!correo || !area || !responsable || !descripcion || isNaN(dias)) {
      setFeedback({ ok: false, msg: 'Completa todos los campos obligatorios.' })
      return
    }
    startTransition(async () => {
      const res = await enviarPruebaRequerimientos({ correo, area, responsable, prioridad, diasRetraso: dias, descripcion })
      setFeedback(res.ok
        ? { ok: true, msg: `Correo de requerimientos enviado a ${correo}.` }
        : { ok: false, msg: res.error })
    })
  }

  return (
    <div className="dc">
      <Feedback feedback={feedback} />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 14, marginBottom: 14 }}>
        <div className="fi" style={{ gridColumn: 'span 2' }}>
          <label>Enviar a *</label>
          <input type="email" value={correo} onChange={(e) => setCorreo(e.target.value)} placeholder="correo@ejemplo.com" />
        </div>
        <div className="fi">
          <label>Área</label>
          <input type="text" value={area} onChange={(e) => setArea(e.target.value)} />
        </div>
        <div className="fi">
          <label>Responsable</label>
          <input type="text" value={responsable} onChange={(e) => setResponsable(e.target.value)} />
        </div>
        <div className="fi">
          <label>Prioridad</label>
          <select value={prioridad} onChange={(e) => setPrioridad(e.target.value as typeof prioridad)}>
            <option value="ALTA">Alta · urgente</option>
            <option value="MEDIA">Media · normal</option>
          </select>
        </div>
        <div className="fi">
          <label>Días de retraso</label>
          <input type="number" value={diasRetraso} onChange={(e) => setDiasRetraso(e.target.value)} min="0" />
        </div>
        <div className="fi" style={{ gridColumn: 'span 2' }}>
          <label>Descripción</label>
          <textarea value={descripcion} onChange={(e) => setDescripcion(e.target.value)} rows={3} />
        </div>
      </div>
      <button className="btn btn-p" onClick={enviar} disabled={isPending}>
        <IconSend size={13} /> {isPending ? 'Enviando...' : 'Enviar correo de prueba'}
      </button>
    </div>
  )
}

// ─── Vista principal ─────────────────────────────────────────────────────────

export function CorreosPruebaView({ correoSesion }: { correoSesion: string }) {
  const [tipo, setTipo] = useState<Tipo>('bienvenida')

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <Link href="/configuracion" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--t2)', textDecoration: 'none' }}>
          <IconArrowLeft size={14} /> Volver a configuración
        </Link>
      </div>

      <div className="dc">
        <div className="ss">Tipo de correo a probar</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
          {TIPOS.map(({ id, label, icon: Icon, desc }) => (
            <div
              key={id}
              onClick={() => setTipo(id)}
              style={{
                cursor: 'pointer', padding: '12px 14px', borderRadius: 'var(--rm)',
                border: `1.5px solid ${tipo === id ? 'var(--blue)' : 'var(--bl)'}`,
                background: tipo === id ? 'var(--blue-bg)' : 'transparent',
              }}
            >
              <Icon size={18} style={{ color: tipo === id ? 'var(--blue)' : 'var(--t2)', marginBottom: 6 }} />
              <div style={{ fontSize: 13, fontWeight: 600, color: tipo === id ? 'var(--blue-t)' : 'var(--t1)' }}>{label}</div>
              <div style={{ fontSize: 11, color: 'var(--t3)', marginTop: 2 }}>{desc}</div>
            </div>
          ))}
        </div>
      </div>

      {tipo === 'bienvenida'     && <FormBienvenida correoInicial={correoSesion} />}
      {tipo === 'facturas'       && <FormFacturas correoInicial={correoSesion} />}
      {tipo === 'requerimientos' && <FormRequerimientos correoInicial={correoSesion} />}
    </div>
  )
}
