// Catálogo de tipos de reporte y tipos compartidos — sin dependencias de servidor, seguro para importar desde el cliente
export interface ReporteResultado {
  columnas: string[];
  filas: (string | number)[][];
  agregado: { categoria: string; valor: number }[];
}

export interface ReporteDef {
  id: string;
  label: string;
  modulo: "comprobantes" | "requerimientos";
}

export const REPORTES: ReporteDef[] = [
  { id: "facturas_vencidas", label: "Facturas vencidas", modulo: "comprobantes" },
  { id: "facturas_por_vencer", label: "Facturas por vencer", modulo: "comprobantes" },
  { id: "facturas_sin_registro", label: "Facturas sin registro contable", modulo: "comprobantes" },
  { id: "facturas_por_forma_pago", label: "Facturas por forma de pago", modulo: "comprobantes" },
  { id: "facturas_pagadas", label: "Facturas pagadas", modulo: "comprobantes" },
  { id: "requerimientos_por_estado", label: "Requerimientos por estado", modulo: "requerimientos" },
  { id: "requerimientos_por_prioridad", label: "Requerimientos por prioridad", modulo: "requerimientos" },
  { id: "requerimientos_urgentes_sin_atender", label: "Urgentes sin atender", modulo: "requerimientos" },
];
