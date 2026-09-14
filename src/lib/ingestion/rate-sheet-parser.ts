import { normalizeCode, normalizeDecimalInput } from "@/lib/recovery-engine";
import type { ChargeDimensions, ContractTermType, ContractTermValue } from "@/lib/recovery-engine";
import { parseDateValue, pick, type TabularTable } from "./tabular";

export const RATE_COLUMN_ALIASES = {
  vendor: ["vendor", "carrier", "supplier", "vendor_name", "carrier_name"],
  contract: ["contract", "contract_title", "agreement", "contract_name", "tariff"],
  charge_code: ["charge_code", "charge", "charge_type", "code", "accessorial", "accessorial_code", "fee_code", "charge_name"],
  term_type: ["term_type", "type", "rule_type"],
  rate: ["rate", "contract_rate", "contracted_rate", "price", "unit_rate", "amount", "daily_rate", "per_day"],
  basis: ["basis", "rate_basis", "pricing_basis"],
  unit: ["unit", "uom", "unit_of_measure", "per"],
  percent: ["percent", "pct", "percentage", "fuel_pct", "fuel_percent", "surcharge_percent"],
  percent_basis: ["percent_basis", "basis_codes", "applies_to"],
  free_days: ["free_days", "free_time", "free_time_days"],
  minimum: ["minimum", "min", "min_charge", "minimum_charge"],
  currency: ["currency", "curr", "ccy"],
  mode: ["mode", "transport_mode", "service_mode"],
  origin: ["origin", "origin_port", "pol", "port_of_loading", "from", "origin_zip", "origin_city"],
  destination: ["destination", "destination_port", "pod", "port_of_discharge", "to", "destination_zip", "destination_city"],
  equipment: ["equipment", "container_type", "container_size", "trailer", "equipment_type", "size_type"],
  service_level: ["service_level", "service", "service_type", "service_class"],
  effective_from: ["effective_from", "valid_from", "start_date", "effective", "effective_date"],
  effective_to: ["effective_to", "valid_to", "end_date", "expires", "expiration", "expiry"],
  clause: ["clause", "section", "notes", "source_clause", "reference"],
} as const;

export type ParsedRateTerm = {
  chargeCode: string;
  termType: ContractTermType;
  dimensions: ChargeDimensions;
  value: ContractTermValue;
  locator: string;
};

export type ParsedRateSheet = {
  vendorName: string;
  contractTitle: string;
  currency: string;
  effectiveFrom: string | null;
  effectiveTo: string | null;
  terms: ParsedRateTerm[];
};

export type RateSheetParseResult = {
  sheets: ParsedRateSheet[];
  warnings: string[];
  rowsRead: number;
};

function inferTermType(explicit: string, value: { rate: string | null; percent: string | null; freeDays: string | null }): ContractTermType | null {
  const normalized = explicit.trim().toLowerCase().replace(/[\s-]+/g, "_");
  if (["rate", "percent", "free_time", "allowed_charge"].includes(normalized)) return normalized as ContractTermType;
  if (normalized === "percentage" || normalized === "fuel") return "percent";
  if (normalized === "demurrage" || normalized === "detention" || normalized === "per_diem" || normalized === "free_days") return "free_time";
  if (normalized === "allowed" || normalized === "accessorial") return value.rate ? "rate" : "allowed_charge";
  if (value.percent) return "percent";
  if (value.freeDays) return "free_time";
  if (value.rate) return "rate";
  return null;
}

export function parseRateSheetTables(tables: TabularTable[], defaults: { vendorName?: string; contractTitle: string; currency?: string }): RateSheetParseResult {
  const warnings: string[] = [];
  const grouped = new Map<string, ParsedRateSheet>();
  let rowsRead = 0;

  for (const table of tables) {
    const hasCode = table.headers.some((header) => (RATE_COLUMN_ALIASES.charge_code as readonly string[]).includes(header));
    if (!hasCode) {
      warnings.push(`${table.sheet ? `Sheet ${table.sheet}` : "File"} has no charge code column. Skipped.`);
      continue;
    }

    for (const row of table.rows) {
      rowsRead += 1;
      const values = row.values;
      const chargeCode = normalizeCode(pick(values, [...RATE_COLUMN_ALIASES.charge_code])).slice(0, 48);
      if (!chargeCode) {
        warnings.push(`${row.locator}: empty charge code. Skipped.`);
        continue;
      }
      const vendorName = pick(values, [...RATE_COLUMN_ALIASES.vendor]) || defaults.vendorName || "";
      if (!vendorName) {
        warnings.push(`${row.locator}: no vendor column and no vendor selected. Skipped.`);
        continue;
      }

      const rate = normalizeDecimalInput(pick(values, [...RATE_COLUMN_ALIASES.rate]));
      const percent = normalizeDecimalInput(pick(values, [...RATE_COLUMN_ALIASES.percent]));
      const freeDays = normalizeDecimalInput(pick(values, [...RATE_COLUMN_ALIASES.free_days]));
      const termType = inferTermType(pick(values, [...RATE_COLUMN_ALIASES.term_type]), { rate, percent, freeDays });
      if (!termType) {
        warnings.push(`${row.locator}: could not determine term type (needs rate, percent or free_days). Skipped.`);
        continue;
      }
      if (termType === "rate" && rate === null) {
        warnings.push(`${row.locator}: rate term without a rate value. Skipped.`);
        continue;
      }
      if (termType === "percent" && percent === null) {
        warnings.push(`${row.locator}: percent term without a percent value. Skipped.`);
        continue;
      }
      if (termType === "free_time" && rate === null) {
        warnings.push(`${row.locator}: free-time term needs a daily rate. Skipped.`);
        continue;
      }

      const contractTitle = pick(values, [...RATE_COLUMN_ALIASES.contract]) || defaults.contractTitle;
      const currency = (pick(values, [...RATE_COLUMN_ALIASES.currency]) || defaults.currency || "USD").toUpperCase().slice(0, 3);
      const key = `${vendorName.toLowerCase()}|${contractTitle.toLowerCase()}`;
      let sheet = grouped.get(key);
      if (!sheet) {
        sheet = {
          vendorName,
          contractTitle,
          currency,
          effectiveFrom: parseDateValue(pick(values, [...RATE_COLUMN_ALIASES.effective_from])),
          effectiveTo: parseDateValue(pick(values, [...RATE_COLUMN_ALIASES.effective_to])),
          terms: [],
        };
        grouped.set(key, sheet);
      }

      const dimensions: ChargeDimensions = {};
      for (const dimension of ["mode", "origin", "destination", "equipment", "service_level"] as const) {
        const value = pick(values, [...RATE_COLUMN_ALIASES[dimension]]);
        if (value) dimensions[dimension] = value.trim().toUpperCase();
      }

      const basisRaw = pick(values, [...RATE_COLUMN_ALIASES.basis]).toLowerCase();
      const value: ContractTermValue = {
        currency,
        clause: pick(values, [...RATE_COLUMN_ALIASES.clause]) || undefined,
      };
      if (termType === "rate") {
        value.rate = rate ?? undefined;
        value.basis = basisRaw === "flat" ? "flat" : "per_unit";
        value.unit = pick(values, [...RATE_COLUMN_ALIASES.unit]).toUpperCase() || undefined;
        const minimum = normalizeDecimalInput(pick(values, [...RATE_COLUMN_ALIASES.minimum]));
        if (minimum !== null) value.minimum = minimum;
      } else if (termType === "percent") {
        value.percent = percent ?? undefined;
        const basisCodes = pick(values, [...RATE_COLUMN_ALIASES.percent_basis]);
        if (basisCodes) value.percentBasisCodes = basisCodes.split(/[;,|]/).map((code) => normalizeCode(code)).filter(Boolean);
      } else if (termType === "free_time") {
        value.rate = rate ?? undefined;
        value.freeDays = freeDays ?? "0";
        value.unit = "DAY";
      }

      sheet.terms.push({ chargeCode, termType, dimensions, value, locator: row.locator });
    }
  }

  return { sheets: [...grouped.values()], warnings, rowsRead };
}
