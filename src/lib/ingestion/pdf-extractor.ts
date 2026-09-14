import type { TabularTable } from "./tabular";

/**
 * PDF invoice extraction through a vision-capable model.
 *
 * Boundaries (see src/lib/ai/agents.ts): the model may only *extract* what is printed on the
 * page into rows. It never computes variances or expected costs. Extracted rows flow through the
 * same deterministic parser and rule engine as CSV/XLSX uploads, and every finding derived from
 * an AI-extracted document is capped at the extraction confidence and marked "needs review"
 * until a human confirms the rows against the source PDF.
 *
 * Credentials are read server-side only (ANTHROPIC_API_KEY or OPENAI_API_KEY). Nothing here is
 * ever bundled for the browser.
 */

export type ExtractionProvider = "anthropic" | "openai";

export type ExtractionConfig = {
  provider: ExtractionProvider;
  model: string;
  apiKey: string;
};

export type ExtractionProvenance = {
  method: "ai";
  provider: ExtractionProvider;
  model: string;
  /** Model-reported read confidence 0..1, stored as text. Not a savings estimate. */
  confidence: string;
  pagesRead: number | null;
  statedTotal: string | null;
  extractedLines: number;
  extractedAt: string;
  humanVerificationRequired: true;
  notes: string[];
};

export type PdfExtractionResult = {
  tables: TabularTable[];
  provenance: ExtractionProvenance;
  warnings: string[];
};

const DEFAULT_MODELS: Record<ExtractionProvider, string> = {
  anthropic: "claude-sonnet-5",
  openai: "gpt-5.4-mini",
};

const MAX_PDF_BYTES = 20 * 1024 * 1024;

export function getExtractionConfig(): ExtractionConfig | null {
  const forced = process.env.RECOVRA_AI_PROVIDER as ExtractionProvider | undefined;
  const anthropicKey = process.env.ANTHROPIC_API_KEY;
  const openaiKey = process.env.OPENAI_API_KEY;
  const provider: ExtractionProvider | null =
    forced === "anthropic" && anthropicKey ? "anthropic"
    : forced === "openai" && openaiKey ? "openai"
    : anthropicKey ? "anthropic"
    : openaiKey ? "openai"
    : null;
  if (!provider) return null;
  return {
    provider,
    model: process.env.RECOVRA_AI_MODEL || DEFAULT_MODELS[provider],
    apiKey: provider === "anthropic" ? anthropicKey! : openaiKey!,
  };
}

export function isPdfExtractionConfigured() {
  return getExtractionConfig() !== null;
}

export function isPdfFile(filename: string, mimeType: string) {
  return filename.toLowerCase().endsWith(".pdf") || mimeType === "application/pdf";
}

/** Column names the deterministic invoice parser already understands (see INVOICE_COLUMN_ALIASES). */
const LINE_FIELDS = [
  "invoice_number", "invoice_date", "vendor", "currency", "line_id", "description", "charge_code",
  "quantity", "unit", "unit_price", "billed_amount", "mode", "origin", "destination", "equipment",
  "service_level", "reference", "free_days", "actual_days", "weight", "zone",
] as const;

const EXTRACTION_INSTRUCTIONS = `You are a data-entry clerk transcribing a freight, parcel or supplier invoice PDF into rows.
Return ONLY a JSON object, no prose, no markdown fences, with this exact shape:
{
  "invoice_number": string, "invoice_date": string (YYYY-MM-DD or ""), "vendor": string, "currency": string (ISO code or ""),
  "stated_total": string (the invoice total printed on the document, plain decimal, or ""),
  "pages_read": number,
  "confidence": number between 0 and 1 describing how legible and unambiguous the document was,
  "notes": string[] (anything you could not read or had to skip),
  "lines": [ { ${LINE_FIELDS.map((field) => `"${field}": string`).join(", ")}, "page": number } ]
}
Rules:
- Transcribe exactly what is printed. Never estimate, infer, total, or correct amounts. If a value is not printed, use "".
- One row per billed charge line (base freight, fuel surcharge, each accessorial, demurrage/detention, duties, etc.).
- Amounts and quantities are plain decimals with no currency symbols or thousands separators. Negative credits keep a leading minus sign.
- charge_code is the short code or, if none is printed, an UPPER_SNAKE_CASE label from the description (FUEL_SURCHARGE, LIFTGATE, DEMURRAGE...).
- reference is the shipment reference the line belongs to (container, BOL, PRO, tracking or booking number) when printed.
- origin/destination are port codes, ZIP codes or city names as printed. equipment is the container/trailer type as printed.
- free_days and actual_days apply only to demurrage/detention/storage lines when the document states them.
- Repeat invoice_number, invoice_date, vendor and currency on every line.
- Do not include header, subtotal, tax-summary or total rows as lines.`;

type ModelLine = Partial<Record<(typeof LINE_FIELDS)[number], unknown>> & { page?: unknown };
type ModelPayload = {
  invoice_number?: unknown; invoice_date?: unknown; vendor?: unknown; currency?: unknown; stated_total?: unknown;
  pages_read?: unknown; confidence?: unknown; notes?: unknown; lines?: unknown;
};

function asText(value: unknown): string {
  if (value === null || value === undefined) return "";
  if (typeof value === "number") return Number.isFinite(value) ? String(value) : "";
  return String(value).trim();
}

function toBase64(bytes: ArrayBuffer) {
  return Buffer.from(bytes).toString("base64");
}

function extractJson(text: string): ModelPayload {
  const trimmed = text.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
  const start = trimmed.indexOf("{");
  const end = trimmed.lastIndexOf("}");
  if (start === -1 || end === -1) throw new Error("The extraction model did not return JSON.");
  return JSON.parse(trimmed.slice(start, end + 1)) as ModelPayload;
}

async function callAnthropic(config: ExtractionConfig, bytes: ArrayBuffer, filename: string): Promise<string> {
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "content-type": "application/json", "x-api-key": config.apiKey, "anthropic-version": "2023-06-01" },
    body: JSON.stringify({
      model: config.model,
      max_tokens: 16000,
      temperature: 0,
      system: EXTRACTION_INSTRUCTIONS,
      messages: [{
        role: "user",
        content: [
          { type: "document", source: { type: "base64", media_type: "application/pdf", data: toBase64(bytes) }, title: filename },
          { type: "text", text: "Transcribe this invoice into the JSON shape described. Return only JSON." },
        ],
      }],
    }),
    signal: AbortSignal.timeout(120_000),
  });
  if (!response.ok) throw new Error(`Extraction provider error (${response.status}): ${(await response.text()).slice(0, 300)}`);
  const payload = (await response.json()) as { content?: Array<{ type: string; text?: string }> };
  return (payload.content ?? []).filter((block) => block.type === "text").map((block) => block.text ?? "").join("\n");
}

async function callOpenAI(config: ExtractionConfig, bytes: ArrayBuffer, filename: string): Promise<string> {
  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: { "content-type": "application/json", authorization: `Bearer ${config.apiKey}` },
    body: JSON.stringify({
      model: config.model,
      instructions: EXTRACTION_INSTRUCTIONS,
      input: [{
        role: "user",
        content: [
          { type: "input_file", filename, file_data: `data:application/pdf;base64,${toBase64(bytes)}`, detail: "high" },
          { type: "input_text", text: "Transcribe this invoice into the JSON shape described. Return only JSON." },
        ],
      }],
    }),
    signal: AbortSignal.timeout(120_000),
  });
  if (!response.ok) throw new Error(`Extraction provider error (${response.status}): ${(await response.text()).slice(0, 300)}`);
  const payload = (await response.json()) as { output_text?: string; output?: Array<{ type: string; content?: Array<{ type: string; text?: string }> }> };
  if (payload.output_text) return payload.output_text;
  return (payload.output ?? [])
    .flatMap((item) => item.content ?? [])
    .filter((part) => part.type === "output_text")
    .map((part) => part.text ?? "")
    .join("\n");
}

export async function extractInvoiceTablesFromPdf(bytes: ArrayBuffer, filename: string, config: ExtractionConfig): Promise<PdfExtractionResult> {
  if (bytes.byteLength > MAX_PDF_BYTES) throw new Error("PDF extraction is limited to 20 MB per file.");
  const raw = config.provider === "anthropic" ? await callAnthropic(config, bytes, filename) : await callOpenAI(config, bytes, filename);
  return tablesFromModelOutput(raw, { provider: config.provider, model: config.model });
}

/** Pure conversion of the model's text output into parser tables + provenance. Exported for tests. */
export function tablesFromModelOutput(raw: string, source: { provider: ExtractionProvider; model: string }): PdfExtractionResult {
  const payload = extractJson(raw);
  const warnings: string[] = [];

  const header = {
    invoice_number: asText(payload.invoice_number),
    invoice_date: asText(payload.invoice_date),
    vendor: asText(payload.vendor),
    currency: asText(payload.currency).toUpperCase(),
  };
  const modelLines = Array.isArray(payload.lines) ? (payload.lines as ModelLine[]) : [];
  const rows = modelLines.map((line, index) => {
    const page = Number(line.page);
    const values: Record<string, string> = {};
    for (const field of LINE_FIELDS) values[field] = asText(line[field]);
    for (const key of ["invoice_number", "invoice_date", "vendor", "currency"] as const) if (!values[key]) values[key] = header[key];
    if (!values.line_id) values.line_id = String(index + 1);
    return { locator: `pdf:page:${Number.isFinite(page) && page > 0 ? page : "?"}:line:${index + 1}`, values };
  }).filter((row) => row.values.billed_amount !== "" || row.values.description !== "");

  if (rows.length === 0) warnings.push("The extraction model found no billable lines on this PDF.");
  const notes = Array.isArray(payload.notes) ? (payload.notes as unknown[]).map(asText).filter(Boolean).slice(0, 20) : [];
  for (const note of notes) warnings.push(`Extraction note: ${note}`);

  const confidenceNumber = Number(payload.confidence);
  const confidence = Number.isFinite(confidenceNumber) ? Math.min(1, Math.max(0, confidenceNumber)) : 0.5;
  const pagesRead = Number(payload.pages_read);

  return {
    tables: [{ headers: [...LINE_FIELDS], rows, sheet: null }],
    provenance: {
      method: "ai",
      provider: source.provider,
      model: source.model,
      confidence: confidence.toFixed(4),
      pagesRead: Number.isFinite(pagesRead) && pagesRead > 0 ? pagesRead : null,
      statedTotal: asText(payload.stated_total) || null,
      extractedLines: rows.length,
      extractedAt: new Date().toISOString(),
      humanVerificationRequired: true,
      notes,
    },
    warnings,
  };
}
