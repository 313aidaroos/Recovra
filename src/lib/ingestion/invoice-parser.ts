import { normalizeCode, normalizeDecimalInput, sumDecimals } from "@/lib/recovery-engine";
import type { ChargeDimensions } from "@/lib/recovery-engine";
import { parseDateValue, pick, type TabularTable } from "./tabular";

export const INVOICE_COLUMN_ALIASES = {
  invoice_number: ["invoice_number", "invoice", "invoice_no", "invoice_id", "inv_no", "inv_number", "bill_number", "bill_no"],
  invoice_date: ["invoice_date", "date", "bill_date", "billing_date"],
  vendor: ["vendor", "carrier", "supplier", "vendor_name", "carrier_name", "supplier_name", "payee"],
  currency: ["currency", "curr", "ccy"],
  line_id: ["line_id", "line", "line_number", "line_no", "item_no"],
  description: ["description", "desc", "charge_description", "item", "item_description", "service_description"],
  charge_code: ["charge_code", "charge", "charge_type", "code", "accessorial", "accessorial_code", "fee_code", "charge_name"],
  quantity: ["quantity", "qty", "units", "days", "miles", "billed_weight", "pieces", "pallets"],
  unit: ["unit", "uom", "unit_of_measure"],
  unit_price: ["unit_price", "rate", "price", "unit_rate", "billed_rate"],
  billed_amount: ["billed_amount", "amount", "total", "charge_amount", "net_amount", "line_total", "billed", "extended_amount", "line_amount"],
  mode: ["mode", "transport_mode", "service_mode"],
  origin: ["origin", "origin_port", "pol", "port_of_loading", "from", "origin_zip", "pickup_zip", "origin_city"],
  destination: ["destination", "destination_port", "pod", "port_of_discharge", "to", "destination_zip", "delivery_zip", "dest_zip", "destination_city"],
  equipment: ["equipment", "container_type", "container_size", "trailer", "equipment_type", "size_type"],
  service_level: ["service_level", "service", "service_type", "service_class"],
  reference: ["reference", "bol", "bol_number", "pro", "pro_number", "container", "container_number", "tracking", "tracking_number", "shipment_id", "shipment", "booking", "booking_number", "load_id"],
  free_days: ["free_days", "free_time", "free_time_days"],
  actual_days: ["actual_days", "days_used", "dwell_days", "total_days", "days_held"],
  weight: ["weight", "actual_weight", "gross_weight"],
  zone: ["zone", "rate_zone"],
} as const;

export type ParsedInvoiceLine = {
  lineNumber: number;
  externalLineId: string | null;
  description: string;
  chargeCode: string;
  quantity: string | null;
  unit: string | null;
  unitPrice: string | null;
  billedAmount: string;
  dimensions: ChargeDimensions;
  locator: string;
};

export type ParsedInvoice = {
  invoiceNumber: string;
  invoiceDate: string | null;
  vendorName: string;
  currency: string;
  total: string;
  lines: ParsedInvoiceLine[];
};

export type InvoiceParseResult = {
  invoices: ParsedInvoice[];
  warnings: string[];
  rowsRead: number;
};

export function parseInvoiceTables(tables: TabularTable[], defaults: { vendorName?: string; currency?: string; fallbackInvoiceNumber: string }): InvoiceParseResult {
  const warnings: string[] = [];
  const grouped = new Map<string, ParsedInvoice>();
  let rowsRead = 0;

  for (const table of tables) {
    const hasAmount = table.headers.some((header) => (INVOICE_COLUMN_ALIASES.billed_amount as readonly string[]).includes(header));
    if (!hasAmount) {
      warnings.push(`${table.sheet ? `Sheet ${table.sheet}` : "File"} has no billed amount column (expected one of: ${INVOICE_COLUMN_ALIASES.billed_amount.slice(0, 4).join(", ")}). Skipped.`);
      continue;
    }

    for (const row of table.rows) {
      rowsRead += 1;
      const values = row.values;
      const billedAmount = normalizeDecimalInput(pick(values, [...INVOICE_COLUMN_ALIASES.billed_amount]));
      if (billedAmount === null) {
        warnings.push(`${row.locator}: missing or invalid billed amount. Skipped.`);
        continue;
      }

      const invoiceNumber = pick(values, [...INVOICE_COLUMN_ALIASES.invoice_number]) || defaults.fallbackInvoiceNumber;
      const vendorName = pick(values, [...INVOICE_COLUMN_ALIASES.vendor]) || defaults.vendorName || "";
      if (!vendorName) {
        warnings.push(`${row.locator}: no vendor column and no vendor selected. Skipped.`);
        continue;
      }
      const currency = (pick(values, [...INVOICE_COLUMN_ALIASES.currency]) || defaults.currency || "USD").toUpperCase().slice(0, 3);
      const key = `${vendorName.toLowerCase()}|${invoiceNumber}`;

      let invoice = grouped.get(key);
      if (!invoice) {
        invoice = {
          invoiceNumber,
          invoiceDate: parseDateValue(pick(values, [...INVOICE_COLUMN_ALIASES.invoice_date])),
          vendorName,
          currency,
          total: "0",
          lines: [],
        };
        grouped.set(key, invoice);
      }

      const description = pick(values, [...INVOICE_COLUMN_ALIASES.description]);
      const rawCode = pick(values, [...INVOICE_COLUMN_ALIASES.charge_code]) || description;
      const chargeCode = normalizeCode(rawCode).slice(0, 48) || "UNSPECIFIED";
      const dimensions: ChargeDimensions = {};
      for (const dimension of ["mode", "origin", "destination", "equipment", "service_level", "reference", "free_days", "actual_days", "weight", "zone"] as const) {
        const value = pick(values, [...INVOICE_COLUMN_ALIASES[dimension]]);
        if (!value) continue;
        if (dimension === "free_days" || dimension === "actual_days" || dimension === "weight") {
          const numeric = normalizeDecimalInput(value);
          if (numeric !== null) dimensions[dimension] = numeric;
        } else {
          dimensions[dimension] = value.trim().toUpperCase();
        }
      }

      invoice.lines.push({
        lineNumber: invoice.lines.length + 1,
        externalLineId: pick(values, [...INVOICE_COLUMN_ALIASES.line_id]) || null,
        description,
        chargeCode,
        quantity: normalizeDecimalInput(pick(values, [...INVOICE_COLUMN_ALIASES.quantity])),
        unit: pick(values, [...INVOICE_COLUMN_ALIASES.unit]).toUpperCase() || null,
        unitPrice: normalizeDecimalInput(pick(values, [...INVOICE_COLUMN_ALIASES.unit_price])),
        billedAmount,
        dimensions,
        locator: row.locator,
      });
    }
  }

  const invoices = [...grouped.values()].map((invoice) => ({
    ...invoice,
    total: sumDecimals(invoice.lines.map((line) => line.billedAmount)),
  }));

  return { invoices, warnings, rowsRead };
}
