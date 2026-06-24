// Mapeos compartidos entre el server (filtros de Prisma) y el cliente (UI de auditoría)
// para agrupar las acciones registradas por tipo de entidad y por categoría.

export const ENTIDAD_ACCION: Record<string, string> = {
  CREAR_USUARIO: 'usuario', EDITAR_USUARIO: 'usuario', ACTIVAR_USUARIO: 'usuario',
  DESACTIVAR_USUARIO: 'usuario', RESET_PASSWORD_USUARIO: 'usuario',

  CREAR_AREA: 'area', EDITAR_AREA: 'area', ACTIVAR_AREA: 'area', DESACTIVAR_AREA: 'area',

  CREAR_RESPONSABLE: 'responsable', ELIMINAR_RESPONSABLE: 'responsable',

  CREAR_REQUERIMIENTO: 'requerimiento', CAMBIAR_ESTADO: 'requerimiento',

  CREAR_MANUAL: 'factura', IMPORTAR_XML: 'factura', EDITAR: 'factura',
  MARCAR_PAGADA: 'factura', ELIMINAR: 'factura', REGISTRO_CONTABLE: 'factura',

  CREAR_NOTA_CREDITO: 'nota_credito',
  CREAR_NOTA_DEBITO: 'nota_debito',

  CAMBIAR_PASSWORD: 'cuenta',
}

export const ENTIDAD_LABELS: Record<string, string> = {
  usuario: 'Usuario',
  area: 'Área',
  responsable: 'Responsable',
  requerimiento: 'Requerimiento',
  factura: 'Factura',
  nota_credito: 'Nota de crédito',
  nota_debito: 'Nota de débito',
  cuenta: 'Cuenta',
}

export const CATEGORIA_ACCION: Record<string, string> = {
  CREAR: 'creacion', CREAR_REQUERIMIENTO: 'creacion', CREAR_AREA: 'creacion',
  CREAR_USUARIO: 'creacion', CREAR_RESPONSABLE: 'creacion',
  CREAR_NOTA_CREDITO: 'creacion', CREAR_NOTA_DEBITO: 'creacion', CREAR_MANUAL: 'creacion',
  EDITAR: 'edicion', EDITAR_AREA: 'edicion', EDITAR_USUARIO: 'edicion', CAMBIAR_ESTADO: 'edicion',
  ACTIVAR_AREA: 'edicion', DESACTIVAR_AREA: 'edicion',
  ACTIVAR_USUARIO: 'edicion', DESACTIVAR_USUARIO: 'edicion',
  REGISTRO_CONTABLE: 'edicion', MARCAR_PAGADA: 'edicion',
  RESET_PASSWORD_USUARIO: 'edicion', CAMBIAR_PASSWORD: 'edicion',
  ELIMINAR: 'eliminacion', ELIMINAR_RESPONSABLE: 'eliminacion',
  IMPORTAR_XML: 'importacion',
  NOTIFICACION: 'notificacion',
}

export const CATEGORIA_LABELS: Record<string, string> = {
  creacion: 'Creación',
  edicion: 'Edición',
  eliminacion: 'Eliminación',
  importacion: 'Importación',
  notificacion: 'Notificación',
}

export function accionesPorEntidad(entidad: string): string[] {
  return Object.entries(ENTIDAD_ACCION)
    .filter(([, v]) => v === entidad)
    .map(([k]) => k)
}

export function accionesPorCategoria(categoria: string): string[] {
  return Object.entries(CATEGORIA_ACCION)
    .filter(([, v]) => v === categoria)
    .map(([k]) => k)
}
