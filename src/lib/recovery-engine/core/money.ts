const SCALE_DIGITS = 6;
const SCALE = 10n ** BigInt(SCALE_DIGITS);

export type MoneyValue = {
  currency: string;
  amount: string;
};

/**
 * Fixed-point decimal math on strings. Billing math never touches IEEE floats:
 * every value is parsed into a BigInt scaled to 6 decimal places.
 */
export function parseDecimal(value: string | number | bigint): bigint {
  if (typeof value === "bigint") return value * SCALE;
  // PostgREST serialises `numeric` columns as JSON numbers. toFixed(6) turns that back into the
  // exact decimal text the database holds (numeric(20,6) never exceeds 15 significant digits
  // for realistic invoice values), so no float arithmetic ever happens on the value itself.
  if (typeof value === "number") {
    if (!Number.isFinite(value)) throw new Error(`Invalid decimal value: ${value}`);
    return parseDecimal(value.toFixed(SCALE_DIGITS));
  }
  if (typeof value !== "string") throw new Error(`Invalid decimal value: ${String(value)}`);
  const normalized = value.trim();
  const match = /^(-?)(\d+)(?:\.(\d+))?$/.exec(normalized);
  if (!match) throw new Error(`Invalid decimal value: ${value}`);
  const fraction = (match[3] ?? "").padEnd(SCALE_DIGITS, "0");
  if (fraction.length > SCALE_DIGITS) throw new Error(`Decimal precision exceeds ${SCALE_DIGITS} places: ${value}`);
  const units = BigInt(match[2]) * SCALE + BigInt(fraction || "0");
  return match[1] === "-" ? -units : units;
}

/** Canonical decimal text for a value read from the database (numeric arrives as a JSON number). */
export function decimalText(value: string | number | null | undefined): string | null {
  if (value === null || value === undefined || value === "") return null;
  return formatDecimal(parseDecimal(value));
}

export function formatDecimal(value: bigint): string {
  const negative = value < 0n;
  const absolute = negative ? -value : value;
  const whole = absolute / SCALE;
  const fraction = (absolute % SCALE).toString().padStart(SCALE_DIGITS, "0").replace(/0+$/, "");
  return `${negative ? "-" : ""}${whole}${fraction ? `.${fraction}` : ""}`;
}

function roundedDivide(numerator: bigint, denominator: bigint): bigint {
  if (denominator === 0n) throw new Error("Division by zero");
  const negative = (numerator < 0n) !== (denominator < 0n);
  const absNumerator = numerator < 0n ? -numerator : numerator;
  const absDenominator = denominator < 0n ? -denominator : denominator;
  const quotient = (absNumerator + absDenominator / 2n) / absDenominator;
  return negative ? -quotient : quotient;
}

export function multiplyDecimal(left: string, right: string): string {
  return formatDecimal(roundedDivide(parseDecimal(left) * parseDecimal(right), SCALE));
}

export function divideDecimal(left: string, right: string): string {
  return formatDecimal(roundedDivide(parseDecimal(left) * SCALE, parseDecimal(right)));
}

export function addDecimal(left: string, right: string): string {
  return formatDecimal(parseDecimal(left) + parseDecimal(right));
}

export function subtractDecimal(left: string, right: string): string {
  return formatDecimal(parseDecimal(left) - parseDecimal(right));
}

export function sumDecimals(values: string[]): string {
  return formatDecimal(values.reduce((total, value) => total + parseDecimal(value), 0n));
}

/** percent is expressed like "18.5" for 18.5%. */
export function percentOf(base: string, percent: string): string {
  return formatDecimal(roundedDivide(parseDecimal(base) * parseDecimal(percent), SCALE * 100n));
}

export function compareDecimal(left: string, right: string): -1 | 0 | 1 {
  const a = parseDecimal(left);
  const b = parseDecimal(right);
  return a < b ? -1 : a > b ? 1 : 0;
}

export function maxDecimal(left: string, right: string): string {
  return compareDecimal(left, right) >= 0 ? formatDecimal(parseDecimal(left)) : formatDecimal(parseDecimal(right));
}

export function isPositive(value: string): boolean {
  return parseDecimal(value) > 0n;
}

export function isZero(value: string): boolean {
  return parseDecimal(value) === 0n;
}

/** Accepts common spreadsheet money formats ("$1,234.50", "(120.00)", "1 234,50") and returns a canonical decimal string. */
export function normalizeDecimalInput(raw: string | number | null | undefined): string | null {
  if (raw === null || raw === undefined) return null;
  if (typeof raw === "number") {
    if (!Number.isFinite(raw)) return null;
    return formatDecimal(parseDecimal(raw.toFixed(SCALE_DIGITS)));
  }
  let text = raw.trim();
  if (!text) return null;
  let negative = false;
  if (/^\(.*\)$/.test(text)) {
    negative = true;
    text = text.slice(1, -1);
  }
  if (text.startsWith("-")) {
    negative = !negative;
    text = text.slice(1);
  }
  text = text.replace(/[^\d.,]/g, "");
  if (!text) return null;
  // European style "1.234,56" → treat the last separator as decimal point when it is a comma.
  const lastComma = text.lastIndexOf(",");
  const lastDot = text.lastIndexOf(".");
  if (lastComma > lastDot) {
    text = text.replace(/\./g, "").replace(",", ".");
  } else {
    text = text.replace(/,/g, "");
  }
  if (!/^\d*(?:\.\d*)?$/.test(text) || text === "." ) return null;
  if (text.startsWith(".")) text = `0${text}`;
  if (text.endsWith(".")) text = text.slice(0, -1);
  const [whole, fraction = ""] = text.split(".");
  const rounded = fraction.length > SCALE_DIGITS ? `${whole}.${fraction.slice(0, SCALE_DIGITS)}` : text;
  const value = parseDecimal(rounded);
  return formatDecimal(negative ? -value : value);
}
