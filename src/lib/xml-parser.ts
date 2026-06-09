import { XMLParser } from "fast-xml-parser";

export interface FacturaXMLData {
  proveedor: string;
  rucProveedor: string;
  serie: string;
  numero: string;
  fechaEmision: Date;
  fechaVencimiento: Date | null;
  moneda: "SOLES" | "DOLARES" | "EUROS";
  monto: number;
  tipoDocumento: string;
}

export class XMLParseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "XMLParseError";
  }
}

const MONEDA_MAP: Record<string, "SOLES" | "DOLARES" | "EUROS"> = {
  PEN: "SOLES",
  USD: "DOLARES",
  EUR: "EUROS",
};

// Tipos de documento SUNAT
export const TIPO_DOC: Record<string, string> = {
  "01": "FACTURA",
  "03": "BOLETA",
  "07": "NOTA_CREDITO",
  "08": "NOTA_DEBITO",
};

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "@_",
  textNodeName: "#text",
  parseAttributeValue: true,
  isArray: (name) =>
    ["cac:PaymentTerms", "cac:TaxTotal", "cac:InvoiceLine"].includes(name),
});

export function parseFacturaXML(xmlContent: string): FacturaXMLData {
  let parsed: Record<string, unknown>;
  try {
    parsed = parser.parse(xmlContent);
  } catch {
    throw new XMLParseError("El archivo no es un XML válido");
  }

  // Encuentra el nodo Invoice independientemente del namespace
  const invoice = (parsed?.Invoice ??
    parsed?.["inv:Invoice"] ??
    parsed?.["ubl:Invoice"] ??
    Object.values(parsed).find(
      (v) => v != null && typeof v === "object" && "cbc:ID" in (v as object),
    )) as Record<string, unknown>;

  if (!invoice)
    throw new XMLParseError("No se encontró el nodo Invoice en el XML");

  // ── Serie-Número ────────────────────────────────────────────────────────────
  const serieNumeroRaw =
    getString(invoice, "cbc:ID") ?? getString(invoice, "ID");
  if (!serieNumeroRaw)
    throw new XMLParseError("No se encontró el ID de la factura");
  const [serie, numero] = parseSerieNumero(serieNumeroRaw);

  // ── Tipo de documento ───────────────────────────────────────────────────────
  const tipoDocumento = String(
    getRawValue(invoice, "cbc:InvoiceTypeCode") ??
      getRawValue(invoice, "InvoiceTypeCode") ??
      "01",
  );

  // ── Fechas ──────────────────────────────────────────────────────────────────
  const fechaEmisionStr =
    getString(invoice, "cbc:IssueDate") ?? getString(invoice, "IssueDate");
  if (!fechaEmisionStr)
    throw new XMLParseError("No se encontró la fecha de emisión");
  const fechaEmision = parseDate(fechaEmisionStr);
  if (!fechaEmision) throw new XMLParseError("Fecha de emisión inválida");

  // Fecha de vencimiento: puede estar en DueDate o en PaymentTerms (crédito)
  const fechaVencimiento = extractFechaVencimiento(invoice);

  // ── Moneda ──────────────────────────────────────────────────────────────────
  const monedaCode = String(
    getRawValue(invoice, "cbc:DocumentCurrencyCode") ??
      getRawValue(invoice, "DocumentCurrencyCode") ??
      "PEN",
  ).toUpperCase();

  // ── Monto ───────────────────────────────────────────────────────────────────
  const lmt =
    getObj(invoice, "cac:LegalMonetaryTotal") ??
    getObj(invoice, "LegalMonetaryTotal");
  const montoRaw =
    getNumber(lmt ?? {}, "cbc:PayableAmount") ??
    getNumber(lmt ?? {}, "PayableAmount");
  if (!montoRaw || montoRaw <= 0)
    throw new XMLParseError("No se encontró el monto a pagar");

  // ── Proveedor ───────────────────────────────────────────────────────────────
  const supplier =
    getObj(invoice, "cac:AccountingSupplierParty") ??
    getObj(invoice, "AccountingSupplierParty");
  const party =
    getObj(supplier ?? {}, "cac:Party") ?? getObj(supplier ?? {}, "Party");
  const legalEntity =
    getObj(party ?? {}, "cac:PartyLegalEntity") ??
    getObj(party ?? {}, "PartyLegalEntity");
  const proveedor =
    getString(legalEntity ?? {}, "cbc:RegistrationName") ??
    getString(legalEntity ?? {}, "RegistrationName") ??
    "Desconocido";

  // RUC: busca en PartyIdentification con schemeID="6"
  const partyId =
    getObj(party ?? {}, "cac:PartyIdentification") ??
    getObj(party ?? {}, "PartyIdentification");
  const idNode =
    (partyId as Record<string, unknown>)?.["cbc:ID"] ??
    (partyId as Record<string, unknown>)?.["ID"];
  const rucProveedor = extractRUC(idNode);

  return {
    proveedor: proveedor.trim(),
    rucProveedor: rucProveedor.trim(),
    serie,
    numero,
    fechaEmision,
    fechaVencimiento,
    moneda: MONEDA_MAP[monedaCode] ?? "SOLES",
    monto: montoRaw,
    tipoDocumento,
  };
}

// ─── Helpers internos ────────────────────────────────────────────────────────

function getRawValue(obj: Record<string, unknown>, key: string): unknown {
  const v = obj?.[key];
  if (v != null && typeof v === "object" && "#text" in (v as object)) {
    return (v as Record<string, unknown>)["#text"];
  }
  return v;
}

function getString(obj: Record<string, unknown>, key: string): string | null {
  const v = getRawValue(obj, key);
  if (v == null) return null;
  const s = String(v).trim();
  return s === "" ? null : s;
}

function getNumber(obj: Record<string, unknown>, key: string): number | null {
  const v = getRawValue(obj, key);
  if (v == null) return null;
  const n = Number(v);
  return isNaN(n) ? null : n;
}

function getObj(
  obj: Record<string, unknown>,
  key: string,
): Record<string, unknown> | null {
  const v = obj?.[key];
  if (v == null || typeof v !== "object" || Array.isArray(v)) return null;
  return v as Record<string, unknown>;
}

function extractFechaVencimiento(
  invoice: Record<string, unknown>,
): Date | null {
  // Opción 1: DueDate directo
  const directDue =
    getString(invoice, "cbc:DueDate") ?? getString(invoice, "DueDate");
  if (directDue) return parseDate(directDue);

  // Opción 2: PaymentTerms (puede ser array) — busca el que tenga PaymentDueDate
  const terms = invoice["cac:PaymentTerms"] ?? invoice["PaymentTerms"];
  if (!terms) return null;

  const arr = Array.isArray(terms) ? terms : [terms];
  for (const term of arr) {
    if (typeof term !== "object" || term == null) continue;
    const dueDate =
      getString(term as Record<string, unknown>, "cbc:PaymentDueDate") ??
      getString(term as Record<string, unknown>, "PaymentDueDate");
    if (dueDate) return parseDate(dueDate);
  }

  return null;
}

function extractRUC(idNode: unknown): string {
  if (idNode == null) return "";
  if (typeof idNode === "string" || typeof idNode === "number")
    return String(idNode);
  if (typeof idNode === "object") {
    // El RUC tiene schemeID="6" en SUNAT
    const node = idNode as Record<string, unknown>;
    return String(node["#text"] ?? node["@_value"] ?? "").trim();
  }
  return "";
}

function parseDate(dateStr: string): Date | null {
  if (!dateStr) return null;
  // SUNAT usa YYYY-MM-DD
  const d = new Date(dateStr + "T00:00:00");
  return isNaN(d.getTime()) ? null : d;
}

function parseSerieNumero(id: string): [string, string] {
  const clean = id.trim();
  const match = clean.match(/^([A-Za-z]\d{3})-(\d+)$/);
  if (match) return [match[1].toUpperCase(), match[2]];
  const dashIdx = clean.lastIndexOf("-");
  if (dashIdx > 0)
    return [clean.slice(0, dashIdx).toUpperCase(), clean.slice(dashIdx + 1)];
  return ["F001", clean];
}
