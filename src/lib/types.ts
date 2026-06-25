// Reemplaza los enums de Prisma (no soportados en SQL Server)
// Usar estos tipos en todo el proyecto en lugar de importar desde @prisma/client

export type Rol = "ADMIN" | "ASISTENTE";
export type Moneda = "SOLES" | "DOLARES" | "EUROS";
export type TipoFactura = "COMPRA" | "SERVICIO";
export type EstadoFactura = "POR_VENCER" | "PENDIENTE" | "PAGADA" | "VENCIDA";
export type FormaPago =
  | "CREDITO"
  | "FACTORING"
  | "FACTURA_NEGOCIABLE"
  | "LETRA";
export type Prioridad = "ALTA" | "MEDIA";
export type TipoRequerimiento = "COMPRA" | "SERVICIO";
export type EstadoRequerimiento =
  | "ATENDIDO_TOTAL"
  | "ATENDIDO_PARCIAL"
  | "PENDIENTE"
  | "NO_ATENDIDO";
export type Modulo =
  | "COMPROBANTES"
  | "REQUERIMIENTOS"
  | "USUARIOS"
  | "AUTH"
  | "CONFIGURACION";
