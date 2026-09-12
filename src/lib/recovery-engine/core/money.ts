const SCALE_DIGITS = 6;
const SCALE = 10n ** BigInt(SCALE_DIGITS);

export type MoneyValue = {
  currency: string;
  amount: string;
};

export function parseDecimal(value: string): bigint {
  const normalized = value.trim();
  const match = /^(-?)(\d+)(?:\.(\d+))?$/.exec(normalized);
  if (!match) throw new Error(`Invalid decimal value: ${value}`);
  const fraction = (match[3] ?? "").padEnd(SCALE_DIGITS, "0");
  if (fraction.length > SCALE_DIGITS) throw new Error(`Decimal precision exceeds ${SCALE_DIGITS} places: ${value}`);
  const units = BigInt(match[2]) * SCALE + BigInt(fraction || "0");
  return match[1] === "-" ? -units : units;
}

export function formatDecimal(value: bigint): string {
  const negative = value < 0n;
  const absolute = negative ? -value : value;
  const whole = absolute / SCALE;
  const fraction = (absolute % SCALE).toString().padStart(SCALE_DIGITS, "0").replace(/0+$/, "");
  return `${negative ? "-" : ""}${whole}${fraction ? `.${fraction}` : ""}`;
}

export function multiplyDecimal(left: string, right: string): string {
  const product = parseDecimal(left) * parseDecimal(right);
  const rounded = product >= 0n
    ? (product + SCALE / 2n) / SCALE
    : (product - SCALE / 2n) / SCALE;
  return formatDecimal(rounded);
}

export function subtractDecimal(left: string, right: string): string {
  return formatDecimal(parseDecimal(left) - parseDecimal(right));
}

export function isPositive(value: string): boolean {
  return parseDecimal(value) > 0n;
}
