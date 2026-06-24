import { Document, Page, Text, View, StyleSheet, renderToBuffer } from "@react-pdf/renderer";

const styles = StyleSheet.create({
  page: { padding: 28, fontSize: 9, fontFamily: "Helvetica" },
  titulo: { fontSize: 15, fontWeight: 700, marginBottom: 2 },
  subtitulo: { fontSize: 10, color: "#64748b", marginBottom: 14 },
  tabla: { display: "flex", width: "100%", borderWidth: 1, borderColor: "#e2e8f0" },
  fila: { flexDirection: "row", borderBottomWidth: 1, borderColor: "#e2e8f0" },
  filaHeader: { flexDirection: "row", backgroundColor: "#e5edfb" },
  celda: { flex: 1, padding: 5, fontSize: 8.5 },
  celdaHeader: { flex: 1, padding: 5, fontSize: 8.5, fontWeight: 700 },
});

// Genera un PDF tabular en memoria a partir de columnas y filas ya calculadas, listo para enviar como descarga
export async function generarReportePDF(
  titulo: string,
  columnas: string[],
  filas: (string | number)[][],
  rango: string,
): Promise<Buffer> {
  const doc = (
    <Document>
      <Page size="A4" orientation="landscape" style={styles.page}>
        <Text style={styles.titulo}>{titulo}</Text>
        <Text style={styles.subtitulo}>{rango}</Text>
        <View style={styles.tabla}>
          <View style={styles.filaHeader}>
            {columnas.map((c, i) => (
              <Text key={i} style={styles.celdaHeader}>{c}</Text>
            ))}
          </View>
          {filas.map((fila, i) => (
            <View key={i} style={styles.fila}>
              {fila.map((valor, j) => (
                <Text key={j} style={styles.celda}>{String(valor)}</Text>
              ))}
            </View>
          ))}
        </View>
      </Page>
    </Document>
  );

  return renderToBuffer(doc);
}
