import ExcelJS from "exceljs";

export type TabularRow = {
  /** Deterministic locator such as "row:7" or "sheet:Rates!row:7" for evidence provenance. */
  locator: string;
  values: Record<string, string>;
};

export type TabularTable = {
  headers: string[];
  rows: TabularRow[];
  sheet: string | null;
};

export function normalizeHeader(header: string): string {
  return header
    .replace(/^\uFEFF/, "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let quoted = false;
  const source = text.replace(/^\uFEFF/, "");

  for (let index = 0; index < source.length; index += 1) {
    const char = source[index];
    if (quoted) {
      if (char === '"') {
        if (source[index + 1] === '"') {
          field += '"';
          index += 1;
        } else {
          quoted = false;
        }
      } else {
        field += char;
      }
      continue;
    }
    if (char === '"') {
      quoted = true;
    } else if (char === ",") {
      row.push(field);
      field = "";
    } else if (char === "\n" || char === "\r") {
      if (char === "\r" && source[index + 1] === "\n") index += 1;
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else {
      field += char;
    }
  }
  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  return rows.filter((cells) => cells.some((cell) => cell.trim() !== ""));
}

function toTable(matrix: string[][], sheet: string | null): TabularTable {
  if (matrix.length === 0) return { headers: [], rows: [], sheet };
  const headers = matrix[0].map(normalizeHeader);
  const prefix = sheet ? `sheet:${sheet}!` : "";
  const rows: TabularRow[] = matrix.slice(1).map((cells, index) => {
    const values: Record<string, string> = {};
    headers.forEach((header, column) => {
      if (!header) return;
      values[header] = (cells[column] ?? "").trim();
    });
    // +2: 1-based rows and one header row.
    return { locator: `${prefix}row:${index + 2}`, values };
  });
  return { headers: headers.filter(Boolean), rows, sheet };
}

function cellToString(value: ExcelJS.CellValue): string {
  if (value === null || value === undefined) return "";
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  if (typeof value === "object") {
    if ("richText" in value) return value.richText.map((part) => part.text).join("");
    if ("result" in value) return cellToString(value.result as ExcelJS.CellValue);
    if ("text" in value) return String(value.text);
    if ("hyperlink" in value) return String(value.hyperlink);
    return "";
  }
  return String(value);
}

export async function parseXlsx(buffer: ArrayBuffer): Promise<TabularTable[]> {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer);
  const tables: TabularTable[] = [];
  workbook.eachSheet((worksheet) => {
    const matrix: string[][] = [];
    worksheet.eachRow({ includeEmpty: false }, (row) => {
      const cells: string[] = [];
      const rowValues = row.values as ExcelJS.CellValue[];
      // ExcelJS row.values is 1-based.
      for (let column = 1; column < rowValues.length; column += 1) cells.push(cellToString(rowValues[column]));
      matrix.push(cells);
    });
    if (matrix.length > 0) tables.push(toTable(matrix, worksheet.name));
  });
  return tables;
}

export function isSpreadsheetFile(filename: string, mimeType: string) {
  const lower = filename.toLowerCase();
  return lower.endsWith(".csv") || lower.endsWith(".xlsx") || mimeType === "text/csv" || mimeType.includes("spreadsheetml");
}

export async function parseTabularFile(filename: string, buffer: ArrayBuffer): Promise<TabularTable[]> {
  const lower = filename.toLowerCase();
  if (lower.endsWith(".xlsx")) return parseXlsx(buffer);
  if (lower.endsWith(".csv") || lower.endsWith(".txt")) {
    const text = new TextDecoder("utf-8").decode(buffer);
    return [toTable(parseCsv(text), null)];
  }
  throw new Error(`Unsupported tabular file type: ${filename}`);
}

/** Returns the first non-empty value among the aliases, or "". */
export function pick(values: Record<string, string>, aliases: string[]): string {
  for (const alias of aliases) {
    const value = values[alias];
    if (value !== undefined && value !== "") return value;
  }
  return "";
}

export function parseDateValue(raw: string): string | null {
  const value = raw.trim();
  if (!value) return null;
  const iso = /^(\d{4})-(\d{2})-(\d{2})/.exec(value);
  if (iso) return `${iso[1]}-${iso[2]}-${iso[3]}`;
  const us = /^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/.exec(value);
  if (us) {
    const year = us[3].length === 2 ? `20${us[3]}` : us[3];
    return `${year}-${us[1].padStart(2, "0")}-${us[2].padStart(2, "0")}`;
  }
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString().slice(0, 10);
}
