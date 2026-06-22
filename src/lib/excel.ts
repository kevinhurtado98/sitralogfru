import ExcelJS from "exceljs";

export interface ColumnaExcel<T> {
  header: string;
  width?: number;
  value: (row: T) => string | number | Date | null;
}

// Genera un workbook .xlsx en memoria a partir de columnas tipadas y filas, listo para enviar como descarga
export async function generarExcel<T>(
  columnas: ColumnaExcel<T>[],
  filas: T[],
  nombreHoja: string,
): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  const hoja = workbook.addWorksheet(nombreHoja);

  hoja.columns = columnas.map((c) => ({ header: c.header, width: c.width ?? 20 }));
  hoja.getRow(1).font = { bold: true };
  hoja.getRow(1).fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FFE5EDFB" },
  };

  for (const fila of filas) {
    hoja.addRow(columnas.map((c) => c.value(fila)));
  }

  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}
