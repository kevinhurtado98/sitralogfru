import {
  getISOWeek,
  getYear,
  startOfISOWeek,
  addDays,
  nextFriday,
  isFriday,
  startOfDay,
} from 'date-fns'

export interface SemanaPago {
  semana: number
  año: number
  viernesPago: Date
}

/**
 * Calcula la semana ISO y el viernes de pago para una fecha de vencimiento.
 * Regla: el pago se programa el lunes de la semana anterior al vencimiento
 * y se abona el viernes de esa misma semana.
 *
 * Ejemplo: vence 21/05/2026 (jueves semana 21)
 *   → semana de pago: 20 → viernes: 15/05/2026
 */
export function calcularSemanaPago(fechaVencimiento: Date): SemanaPago {
  const lunes = startOfISOWeek(fechaVencimiento)
  // Pagar la semana anterior: retroceder 7 días
  const lunesSemanaAnterior = addDays(lunes, -7)
  const viernesPago = addDays(lunesSemanaAnterior, 4)

  return {
    semana: getISOWeek(lunesSemanaAnterior),
    año: getYear(lunesSemanaAnterior),
    viernesPago: startOfDay(viernesPago),
  }
}

/**
 * Devuelve el próximo viernes a partir de una fecha.
 * Si la fecha ya es viernes, devuelve esa misma fecha.
 */
export function proximoViernes(fecha: Date): Date {
  if (isFriday(fecha)) return startOfDay(fecha)
  return startOfDay(nextFriday(fecha))
}

/**
 * Etiqueta legible para la semana de pago.
 * Ej: "Semana 20 – Viernes 15/05/2026"
 */
export function etiquetaSemanaPago(info: SemanaPago): string {
  const d = info.viernesPago
  const dd = String(d.getDate()).padStart(2, '0')
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const yyyy = d.getFullYear()
  return `Semana ${info.semana} – Viernes ${dd}/${mm}/${yyyy}`
}
