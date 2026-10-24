/**
 * M-PESA statement parser — apps/docs/src/app/safi/lib/parse-statement.ts
 *
 * Runs entirely in the browser. The PDF is opened with pdf.js (Mozilla), which
 * decrypts it natively with the PIN, and the transaction table is rebuilt from
 * the position of every piece of text, not from fixed line patterns. So it
 * doesn't care how many pages there are, how long a details cell wraps, or
 * which transaction types appear.
 *
 * Privacy rules this file follows:
 *  - Nothing is logged, stored, or sent anywhere. Bytes and the PIN live only
 *    for the duration of the call.
 *  - pdf.js runs with eval and XFA disabled, and no range/stream fetching.
 *
 * Usage:
 *   try {
 *     const statement = await parseStatement(file);          // unlocked PDF
 *   } catch (e) {
 *     if (e instanceof PinRequiredError) { ...show <PinInput /> }
 *   }
 *   await parseStatement(file, pin);                          // locked PDF
 *   // WrongPinError => PinInput's onSubmit returns false
 */

/* -------------------------------------------------------------------------- */
/* Errors                                                                     */
/* -------------------------------------------------------------------------- */

export class StatementError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "StatementError";
  }
}
/** The PDF is locked and no PIN was supplied. */
export class PinRequiredError extends StatementError {
  constructor(message = "This statement is locked. Enter the PIN to open it.") {
    super(message);
    this.name = "PinRequiredError";
  }
}
/** A PIN was supplied but it did not unlock the PDF. */
export class WrongPinError extends StatementError {
  constructor(message = "That PIN didn't unlock the statement.") {
    super(message);
    this.name = "WrongPinError";
  }
}
/** The file opened, but it isn't an M-PESA statement we recognise. */
export class StatementFormatError extends StatementError {
  constructor(message: string) {
    super(message);
    this.name = "StatementFormatError";
  }
}
/** The file couldn't be read as a PDF at all (corrupt, truncated, etc.). */
export class StatementReadError extends StatementError {
  constructor(message = "This file couldn't be read as a PDF.") {
    super(message);
    this.name = "StatementReadError";
  }
}

export const isWrongPinError = (e: unknown): e is WrongPinError =>
  e instanceof WrongPinError;
export const isPinRequiredError = (e: unknown): e is PinRequiredError =>
  e instanceof PinRequiredError;

/* -------------------------------------------------------------------------- */
/* Public types                                                               */
/* -------------------------------------------------------------------------- */

export type TransactionKind =
  | "sent" // Customer Transfer to -
  | "received" // Funds received from -
  | "paybill" // Pay Bill (Online) to
  | "till" // Merchant Payment to (Buy Goods)
  | "pochi" // Customer Payment to Small Business (Pochi la Biashara)
  | "airtime" // Airtime Purchase
  | "data_bundles" // Bundle purchase / data recharge
  | "withdrawal" // Withdrawal at agent
  | "deposit" // Deposit at agent
  | "fee" // Any "... Charge" line (belongs to the same receipt as its parent)
  | "card" // Card Pay Bill Online (GlobalPay: Apple, Canva, ...)
  | "reversal" // GlobalPay / transaction reversals
  | "business_transfer" // Move between M-PESA wallet and the business account
  | "business_payment" // Business / salary / promotion payment received
  | "investment" // Unit trust, MMF, Ziidi...
  | "loan" // Fuliza, Okoa, repayments...
  | "savings" // M-Shwari, lock savings...
  | "other_in"
  | "other_out";

export type CounterpartyKind =
  "person" | "till" | "paybill" | "agent" | "merchant" | "service";

export interface Counterparty {
  kind: CounterpartyKind;
  /** Display name, tidied (title case, no wrapping artefacts). */
  name: string;
  /** Stable key for grouping ("who did I send the most to"). */
  key: string;
  /** Masked phone, normalised to 07xx***123 style so 254… and 07… group together. */
  phone?: string;
  /** Till / paybill / agent number. */
  number?: string;
  /** Paybill account reference. */
  account?: string;
}

export interface Transaction {
  /** Unique within this parse (receipts repeat for charges). */
  id: string;
  receipt: string;
  /** Epoch ms of the completion time (statement times are East Africa Time, UTC+3). */
  ts: number;
  /** Chronological position, 0 = oldest. Use (ts, seq) to sort reliably. */
  seq: number;
  /** As printed in the statement: YYYY-MM-DD, HH:MM:SS, YYYY-MM. */
  date: string;
  time: string;
  month: string;
  /** 0–23, in statement (EAT) time. */
  hour: number;
  /** 0 = Sunday … 6 = Saturday. */
  weekday: number;
  details: string;
  status: string;
  paidIn: number;
  /** Always positive. */
  paidOut: number;
  /** Signed net: + money in, − money out. */
  amount: number;
  direction: "in" | "out";
  /** Wallet balance after this row. null on business-account-side rows. */
  balance: number | null;
  /** False for the business-account half of a wallet<->business transfer. */
  affectsWallet: boolean;
  kind: TransactionKind;
  counterparty: Counterparty | null;
  /** Wallet<->business direction, only on business_transfer rows. */
  transferDirection?: "to_wallet" | "to_business";
  /** Looks like the user's own other number (heuristic: same masked phone or same name). */
  likelySelf: boolean;
  /** 1-based page the row was read from. */
  page: number;
  /** Position in the document, 0 = first row printed (newest). */
  order: number;
}

export interface StatementMeta {
  customerName: string | null;
  mobile: string | null;
  email: string | null;
  /** ISO dates (YYYY-MM-DD) */
  periodStart: string | null;
  periodEnd: string | null;
  requestDate: string | null;
  pageCount: number;
}

export interface SummaryRow {
  label: string;
  paidIn: number;
  paidOut: number;
}

export interface StatementSummary {
  rows: SummaryRow[];
  totalPaidIn: number | null;
  totalPaidOut: number | null;
}

export interface StatementChecks {
  rowCount: number;
  /** Rows we could not read (missing date or amount). Should be 0. */
  skippedRows: number;
  /** Times the running balance didn't add up. 0 means no row was lost or misread. */
  balanceBreaks: number;
  /** Do our totals equal the statement's own TOTAL row? null if it had none. */
  totalsMatchSummary: boolean | null;
  warnings: string[];
}

export interface ParsedStatement {
  meta: StatementMeta;
  summary: StatementSummary | null;
  /** Newest first, same order as the PDF. */
  transactions: Transaction[];
  /** First and last transaction dates actually present (YYYY-MM-DD). */
  coverage: { first: string | null; last: string | null };
  balances: { opening: number | null; closing: number | null };
  checks: StatementChecks;
}

export interface ParseOptions {
  signal?: AbortSignal;
  onProgress?: (progress: { page: number; total: number }) => void;
  /** Safety cap. Default 1500 pages. */
  maxPages?: number;
}

/* -------------------------------------------------------------------------- */
/* Minimal pdf.js surface (typed locally so the build never depends on         */
/* which pdfjs-dist entry point ships which declarations)                      */
/* -------------------------------------------------------------------------- */

interface PdfTextItem {
  str: string;
  transform: number[];
  width: number;
  height: number;
}
interface PdfTextContent {
  items: Array<PdfTextItem | { type?: string }>;
}
interface PdfPage {
  getTextContent(): Promise<PdfTextContent>;
  cleanup(): void;
}
export interface PdfDocument {
  numPages: number;
  getPage(n: number): Promise<PdfPage>;
}
interface PdfLoadingTask {
  promise: Promise<PdfDocument>;
  destroy(): Promise<void>;
}
interface PdfJs {
  getDocument(src: Record<string, unknown>): PdfLoadingTask;
  GlobalWorkerOptions: { workerSrc: string };
}

let pdfjsPromise: Promise<PdfJs> | null = null;

/**
 * Loaded on demand and only in the browser. The "legacy" build is used on
 * purpose: it carries the polyfills older Android/Safari WebViews need.
 */
function loadPdfJs(): Promise<PdfJs> {
  pdfjsPromise ??= import("pdfjs-dist/legacy/build/pdf.mjs").then((mod) => {
    const lib = mod as unknown as PdfJs;
    lib.GlobalWorkerOptions.workerSrc = new URL(
      "pdfjs-dist/legacy/build/pdf.worker.min.mjs",
      import.meta.url,
    ).toString();
    return lib;
  });
  return pdfjsPromise;
}

/** pdf.js PasswordException codes: 1 = needs password, 2 = incorrect password. */
function passwordCode(err: unknown): 1 | 2 | null {
  if (
    err &&
    typeof err === "object" &&
    (err as { name?: string }).name === "PasswordException"
  ) {
    return (err as { code?: number }).code === 2 ? 2 : 1;
  }
  return null;
}

const isAbort = (err: unknown) =>
  typeof err === "object" &&
  err !== null &&
  (err as { name?: string }).name === "AbortError";

/* -------------------------------------------------------------------------- */
/* Entry point                                                                */
/* -------------------------------------------------------------------------- */

/**
 * Open the PDF (with the PIN if it's locked) and parse it.
 *
 * Throws PinRequiredError / WrongPinError / StatementFormatError /
 * StatementReadError. The PIN is never stored.
 */
export async function parseStatement(
  file: File,
  pin?: string,
  options: ParseOptions = {},
): Promise<ParsedStatement> {
  if (typeof window === "undefined") {
    throw new StatementReadError(
      "The statement parser only runs in the browser.",
    );
  }

  const pdfjs = await loadPdfJs();

  let data: Uint8Array;
  try {
    data = new Uint8Array(await file.arrayBuffer());
  } catch {
    throw new StatementReadError(
      "Couldn't read the file. Please select it again.",
    );
  }

  const task = pdfjs.getDocument({
    data, // handed to the worker (transferred), so nothing here keeps a copy
    password: pin || undefined,
    isEvalSupported: false,
    enableXfa: false,
    disableAutoFetch: true,
    disableStream: true,
    disableRange: true,
    verbosity: 0,
  });

  try {
    const doc = await task.promise;
    return await parseDocument(doc, options);
  } catch (err) {
    const code = passwordCode(err);
    if (code === 2) throw new WrongPinError();
    if (code === 1) throw pin ? new WrongPinError() : new PinRequiredError();
    if (err instanceof StatementError || isAbort(err)) throw err;
    throw new StatementReadError();
  } finally {
    // Tears down the worker and frees the document.
    await task.destroy().catch(() => undefined);
  }
}

/* -------------------------------------------------------------------------- */
/* Geometry helpers                                                           */
/* -------------------------------------------------------------------------- */

interface Item {
  str: string;
  x: number;
  y: number;
  w: number;
}
interface Fragment {
  x: number;
  right: number;
  text: string;
}

const MAX_ITEMS_PER_PAGE = 30_000;
const MAX_ROWS = 200_000;
const ROW_Y_TOLERANCE = 3;

function toItems(content: PdfTextContent): Item[] {
  const out: Item[] = [];
  for (const raw of content.items) {
    if (!("str" in raw) || typeof raw.str !== "string" || !raw.str.trim())
      continue;
    const [a, b, c, d, e, f] = raw.transform;
    // Rotated or skewed text is a stamp or watermark, never table data.
    if (Math.abs(b) > 0.1 * Math.abs(a) || Math.abs(c) > 0.1 * Math.abs(d))
      continue;
    out.push({ str: raw.str, x: e, y: f, w: raw.width });
  }
  return out;
}

/** Group items into visual lines (top to bottom), each sorted left to right. */
function groupLines(items: Item[], tol = 2.5): Item[][] {
  const sorted = [...items].sort((p, q) => q.y - p.y || p.x - q.x);
  const lines: Item[][] = [];
  for (const it of sorted) {
    const line = lines[lines.length - 1];
    if (line && Math.abs(line[0].y - it.y) <= tol) line.push(it);
    else lines.push([it]);
  }
  for (const l of lines) l.sort((p, q) => p.x - q.x);
  return lines;
}

function joinItems(items: Item[]): string {
  let s = "";
  let prevEnd = -Infinity;
  for (const it of items) {
    if (s && it.x - prevEnd > 1 && !/\s$/.test(s) && !/^\s/.test(it.str))
      s += " ";
    s += it.str;
    prevEnd = it.x + it.w;
  }
  return s.replace(/\s+/g, " ").trim();
}

/** Runs of text on one line separated by a real gap (i.e. one table cell each). */
function fragments(line: Item[], gap = 6): Fragment[] {
  const out: Fragment[] = [];
  for (const it of line) {
    const last = out[out.length - 1];
    if (last && it.x - last.right <= gap) {
      last.text += (it.x - last.right > 1 ? " " : "") + it.str;
      last.right = it.x + it.w;
    } else {
      out.push({ x: it.x, right: it.x + it.w, text: it.str });
    }
  }
  return out.map((f) => ({ ...f, text: f.text.replace(/\s+/g, " ").trim() }));
}

const norm = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z ]/g, "")
    .replace(/\s+/g, " ")
    .trim();

/* -------------------------------------------------------------------------- */
/* Table layout detection                                                     */
/* -------------------------------------------------------------------------- */

interface HeaderInfo {
  y: number;
  piC: number;
  wdC: number;
  balC: number;
  statusX: number | null;
}

interface Layout {
  timeLeft: number;
  detailsLeft: number;
  statusLeft: number;
  piLeft: number;
  wdLeft: number;
  balLeft: number;
}

type ColumnKey =
  | "receipt"
  | "time"
  | "details"
  | "status"
  | "paidIn"
  | "withdrawn"
  | "balance";

const RECEIPT = /^[A-Z0-9]{8,12}$/;
const DATE_START = /^\d{4}-\d{2}-\d{2}/;
const TIME_ONLY = /^\d{1,2}:\d{2}:\d{2}$/;
const STATUS_WORD =
  /^(completed|failed|pending|cancelled|canceled|reversed|declined)$/i;
const FOOTER_START = /^(disclaimer|statement verification code|for self-help)/i;

/** The repeated "Receipt No. | Completion Time | … | Balance" row. */
function findHeader(items: Item[]): HeaderInfo | null {
  for (const line of groupLines(items)) {
    const frags = fragments(line);
    const by = (names: string[]) =>
      frags.find((f) => names.includes(norm(f.text)));
    const receipt = by(["receipt no", "receipt"]);
    const pi = by(["paid in"]);
    const wd = by(["withdrawn"]);
    const bal = by(["balance"]);
    if (!receipt || !pi || !wd || !bal) continue;
    const status = by(["transaction status", "status"]);
    const centre = (f: Fragment) => (f.x + f.right) / 2;
    return {
      y: line[0].y,
      piC: centre(pi),
      wdC: centre(wd),
      balC: centre(bal),
      statusX: status ? status.x : null,
    };
  }
  return null;
}

/**
 * Column edges. The three money columns are equal-width cells with centred
 * headers, so their edges come from the header. The text columns are
 * left-aligned, so their edges come from where the data actually starts.
 */
function buildLayout(
  body: Item[],
  h: HeaderInfo,
  prev: Layout | null,
): Layout | null {
  const half = (h.wdC - h.piC) / 2;
  const piLeft = h.piC - half;
  const wdLeft = (h.piC + h.wdC) / 2;
  const balLeft = (h.wdC + h.balC) / 2;

  const text = body.filter((i) => i.x + i.w / 2 < piLeft);

  const anchor = text.find((i) => STATUS_WORD.test(i.str.trim()));
  const statusStart = Math.min(
    h.statusX ?? Infinity,
    anchor ? anchor.x : Infinity,
  );
  const statusLeft = Number.isFinite(statusStart)
    ? statusStart - 2
    : piLeft - 1;

  const stamps = text.filter(
    (i) =>
      i.x < statusLeft &&
      (DATE_START.test(i.str.trim()) || TIME_ONLY.test(i.str.trim())),
  );
  if (stamps.length === 0) return prev;

  const timeLeft = Math.min(...stamps.map((i) => i.x)) - 2;
  const timeRight = Math.max(...stamps.map((i) => i.x + i.w));
  const stampSet = new Set(stamps);
  const detailsXs = text
    .filter((i) => !stampSet.has(i) && i.x > timeRight && i.x < statusLeft)
    .map((i) => i.x);
  const detailsLeft = detailsXs.length
    ? (timeRight + Math.min(...detailsXs)) / 2
    : timeRight + 1;

  if (!(
    timeLeft < detailsLeft &&
    detailsLeft < statusLeft &&
    statusLeft < piLeft
  ))
    return prev;
  return { timeLeft, detailsLeft, statusLeft, piLeft, wdLeft, balLeft };
}

function columnOf(it: Item, L: Layout): ColumnKey {
  const cx = it.x + it.w / 2;
  if (cx >= L.balLeft) return "balance";
  if (cx >= L.wdLeft) return "withdrawn";
  if (cx >= L.piLeft) return "paidIn";
  if (it.x >= L.statusLeft) return "status";
  if (it.x >= L.detailsLeft) return "details";
  if (it.x >= L.timeLeft) return "time";
  return "receipt";
}

interface RawRow {
  page: number;
  receipt: string;
  time: string;
  details: string;
  status: string;
  paidIn: string;
  withdrawn: string;
  balance: string;
}

const cellText = (items: Item[]) =>
  groupLines(items).map(joinItems).join(" ").replace(/\s+/g, " ").trim();

/** Each receipt number starts a row; everything below it, until the next, is that row. */
function assembleRows(body: Item[], L: Layout, page: number): RawRow[] {
  const anchors = body
    .filter((i) => i.x < L.timeLeft && RECEIPT.test(i.str.trim()))
    .sort((a, b) => b.y - a.y);
  if (anchors.length === 0) return [];

  const buckets: Item[][] = anchors.map(() => []);
  for (const it of body) {
    let idx = -1;
    for (let i = 0; i < anchors.length; i++) {
      if (anchors[i].y + ROW_Y_TOLERANCE >= it.y) idx = i;
      else break;
    }
    if (idx >= 0) buckets[idx].push(it);
  }

  return buckets.map((bucket, i) => {
    const cols: Record<ColumnKey, Item[]> = {
      receipt: [],
      time: [],
      details: [],
      status: [],
      paidIn: [],
      withdrawn: [],
      balance: [],
    };
    for (const it of bucket) cols[columnOf(it, L)].push(it);
    return {
      page,
      receipt: anchors[i].str.trim(),
      time: cellText(cols.time),
      details: cellText(cols.details),
      status: cellText(cols.status),
      paidIn: cellText(cols.paidIn),
      withdrawn: cellText(cols.withdrawn),
      balance: cellText(cols.balance),
    };
  });
}

/* -------------------------------------------------------------------------- */
/* Value parsing                                                              */
/* -------------------------------------------------------------------------- */

/** "-1,227.00" -> -122700. Integer cents, so sums never drift. */
function parseCents(raw: string): number | null {
  const t = raw.replace(/\s/g, "");
  if (!/^[-−–(]?[\d,]+(\.\d{1,2})?\)?$/.test(t)) return null;
  const neg = /^[-−–(]/.test(t);
  const [whole, frac = ""] = t.replace(/[^\d.]/g, "").split(".");
  if (!whole) return null;
  const cents =
    parseInt(whole, 10) * 100 + parseInt((frac + "00").slice(0, 2), 10);
  return neg ? -cents : cents;
}

const kes = (cents: number) => cents / 100;

interface Stamp {
  ts: number;
  date: string;
  time: string;
  month: string;
  hour: number;
  weekday: number;
}

function parseTimestamp(text: string): Stamp | null {
  const m = /(\d{4})-(\d{2})-(\d{2})[ T]+(\d{1,2}):(\d{2}):(\d{2})/.exec(text);
  if (!m) return null;
  const [y, mo, d, h, mi, s] = m.slice(1).map(Number);
  const day = new Date(Date.UTC(y, mo - 1, d));
  if (
    day.getUTCMonth() !== mo - 1 ||
    day.getUTCDate() !== d ||
    h > 23 ||
    mi > 59 ||
    s > 59
  ) {
    return null;
  }
  const p2 = (n: number) => String(n).padStart(2, "0");
  return {
    // Statement times are East Africa Time (UTC+3).
    ts: Date.UTC(y, mo - 1, d, h - 3, mi, s),
    date: `${y}-${p2(mo)}-${p2(d)}`,
    time: `${p2(h)}:${p2(mi)}:${p2(s)}`,
    month: `${y}-${p2(mo)}`,
    hour: h,
    weekday: day.getUTCDay(),
  };
}

const MONTHS: Record<string, number> = {
  jan: 1,
  feb: 2,
  mar: 3,
  apr: 4,
  may: 5,
  jun: 6,
  jul: 7,
  aug: 8,
  sep: 9,
  oct: 10,
  nov: 11,
  dec: 12,
};

function parseDayMonthYear(d: string, mon: string, y: string): string | null {
  const m = MONTHS[mon.slice(0, 3).toLowerCase()];
  if (!m) return null;
  return `${y}-${String(m).padStart(2, "0")}-${String(Number(d)).padStart(2, "0")}`;
}

const titleCase = (s: string) =>
  s
    .toLowerCase()
    .replace(
      /(^|[\s\-/])([a-z\u00c0-\u024f])/g,
      (_, p: string, c: string) => p + c.toUpperCase(),
    );

const tidy = (s: string) =>
  s
    .replace(/\s+/g, " ")
    .replace(/[\s.\-]+$/, "")
    .trim();

/** 254726***185 and 0726***185 are the same number. */
function normalisePhone(p: string): string {
  const t = p.replace(/^\+/, "");
  return t.startsWith("254") ? "0" + t.slice(3) : t;
}

/* -------------------------------------------------------------------------- */
/* Classification                                                             */
/* -------------------------------------------------------------------------- */

interface Classified {
  kind: TransactionKind;
  counterparty: Counterparty | null;
  transferDirection?: "to_wallet" | "to_business";
}

function person(rest: string): Counterparty {
  const m = /^(\+?[\d*]{6,})\s*(.*)$/.exec(rest.trim());
  const phone = m ? normalisePhone(m[1]) : undefined;
  const rawName = tidy(m ? m[2] : rest);
  const tokens = rawName.toLowerCase().split(" ").filter(Boolean);
  return {
    kind: "person",
    name: rawName ? titleCase(rawName) : (phone ?? "Unknown"),
    key: `p:${phone ?? "?"}:${tokens.join(" ")}`,
    phone,
  };
}

/** "APPLE.COM/BILL CORK IE" -> Apple, "Canva* paAAA… Sydney AU" -> Canva. */
function cardMerchant(raw: string): Counterparty {
  const cleaned = tidy(raw);
  const first = cleaned.split(" ")[0] ?? cleaned;
  const brand = first.split(/[./*]/)[0] || first;
  const name =
    /[a-z]/.test(brand) && /[A-Z]/.test(brand) ? brand : titleCase(brand);
  return {
    kind: "merchant",
    name: name || "Card payment",
    key: `card:${brand.toLowerCase()}`,
  };
}

function classify(
  details: string,
  paidIn: number,
  paidOut: number,
): Classified {
  const d = details.trim();
  const l = d.toLowerCase();

  // A fee line ends in "Charge"/"Fee" and has no "to <number>" counterparty.
  if (
    !/\b(?:to|from|at|by)\b\s*[-\d]/.test(l) &&
    /(?:charges?|fees?|excise duty)\.?$/.test(l)
  ) {
    return { kind: "fee", counterparty: null };
  }

  if (/reversal/.test(l)) {
    const m = /reversal from\s+(\S+)\s*-\s*(.+)$/i.exec(d);
    return {
      kind: "reversal",
      counterparty: m
        ? {
            kind: "service",
            name: "GlobalPay reversal",
            key: "reversal",
            number: m[1],
          }
        : null,
    };
  }

  if (/^card pay ?bill|globalpay/.test(l)) {
    const m = /globalpay acc\.?\s*(.*)$/i.exec(d);
    return { kind: "card", counterparty: cardMerchant(m ? m[1] : d) };
  }

  if (
    /business account to mpesa account|mpesa account to business account/.test(
      l,
    )
  ) {
    const toWallet = /business account to mpesa account/.test(l);
    return {
      kind: "business_transfer",
      transferDirection: toWallet ? "to_wallet" : "to_business",
      counterparty: {
        kind: "service",
        name: "Business account",
        key: "business-account",
      },
    };
  }

  if (/payment to small business/.test(l)) {
    const m = /payment to small business to\s*-?\s*(.+)$/i.exec(d);
    return { kind: "pochi", counterparty: person(m ? m[1] : d) };
  }

  if (/bundle|recharge for customer/.test(l)) {
    const m = /\bto\s+\d+\s*(.+?)\s+by\b/i.exec(d);
    const name = m ? titleCase(tidy(m[1])) : "Data bundles";
    return {
      kind: "data_bundles",
      counterparty: {
        kind: "service",
        name,
        key: `bundles:${name.toLowerCase()}`,
      },
    };
  }

  if (/airtime/.test(l)) {
    return {
      kind: "airtime",
      counterparty: { kind: "service", name: "Airtime", key: "airtime" },
    };
  }

  if (/^pay ?bill/.test(l)) {
    const m =
      /^pay ?bill(?: online)? to\s+(\S+)\s*-\s*(.+?)(?:\s+acc\.?\s*(.*))?$/i.exec(
        d,
      );
    if (m) {
      return {
        kind: "paybill",
        counterparty: {
          kind: "paybill",
          name: titleCase(tidy(m[2])),
          key: `paybill:${m[1]}`,
          number: m[1],
          account: m[3] ? tidy(m[3]) : undefined,
        },
      };
    }
    return { kind: "paybill", counterparty: null };
  }

  if (/^merchant payment/.test(l)) {
    const m = /^merchant payment to\s+(\S+)\s*-\s*(.+)$/i.exec(d);
    return {
      kind: "till",
      counterparty: m
        ? {
            kind: "till",
            name: titleCase(tidy(m[2])),
            key: `till:${m[1]}`,
            number: m[1],
          }
        : null,
    };
  }

  if (/withdrawal at agent|^customer withdrawal/.test(l)) {
    const m = /agent\s+till\s+(\S+)\s*-\s*(.+)$/i.exec(d);
    return {
      kind: "withdrawal",
      counterparty: m
        ? {
            kind: "agent",
            name: titleCase(tidy(m[2])),
            key: `agent:${m[1]}`,
            number: m[1],
          }
        : null,
    };
  }

  if (/unit trust|\bmmf\b|ziidi|money market|invest/.test(l)) {
    const m = /\bto\s+\d+\s*-\s*(.+?)\s+by\b/i.exec(d);
    const name = m
      ? titleCase(tidy(m[1])).replace(/\bMmf\b/, "MMF")
      : "Investment";
    return {
      kind: "investment",
      counterparty: {
        kind: "service",
        name,
        key: `invest:${name.toLowerCase()}`,
      },
    };
  }

  if (
    /fuliza|overdraft|overdraw|\bloan\b|okoa|repayment|hustler fund/.test(l)
  ) {
    return { kind: "loan", counterparty: null };
  }

  if (/m-?shwari|lock savings|\bsavings?\b|kcb m-?pesa/.test(l)) {
    return { kind: "savings", counterparty: null };
  }

  if (
    /^(?:customer\s+)?deposit|deposit of funds|agent deposit|cash deposit/.test(
      l,
    )
  ) {
    const m = /agent\s+(?:till\s+)?(\S+)\s*-\s*(.+)$/i.exec(d);
    return {
      kind: "deposit",
      counterparty: m
        ? {
            kind: "agent",
            name: titleCase(tidy(m[2])),
            key: `agent:${m[1]}`,
            number: m[1],
          }
        : null,
    };
  }

  if (
    /payment from/.test(l) &&
    /^(?:business|salary|promotion|bonus|b2c)\b/.test(l)
  ) {
    const m = /payment from\s+(\S+)\s*-\s*(.+?)(?:\s+via\b.*)?$/i.exec(d);
    const name = m ? titleCase(tidy(m[2])) : "Business payment";
    return {
      kind: "business_payment",
      counterparty: {
        kind: "service",
        name,
        key: `bizpay:${m ? m[1] : name.toLowerCase()}`,
        number: m ? m[1] : undefined,
      },
    };
  }

  if (/^funds received from/.test(l)) {
    const m = /^funds received from\s*-?\s*(.+)$/i.exec(d);
    return { kind: "received", counterparty: person(m ? m[1] : d) };
  }

  if (/^customer transfer to/.test(l)) {
    const m = /^customer transfer to\s*-?\s*(.+)$/i.exec(d);
    return { kind: "sent", counterparty: person(m ? m[1] : d) };
  }

  return {
    kind: paidIn >= paidOut ? "other_in" : "other_out",
    counterparty: null,
  };
}

/* -------------------------------------------------------------------------- */
/* Header block + summary (top of page 1)                                     */
/* -------------------------------------------------------------------------- */

function parsePreface(items: Item[]): {
  meta: Omit<StatementMeta, "pageCount">;
  summary: StatementSummary | null;
} {
  const lines = groupLines(items).map((l) => fragments(l));

  const value = (label: RegExp): string | null => {
    for (const frs of lines) {
      for (let i = 0; i < frs.length; i++) {
        if (!label.test(frs[i].text)) continue;
        const inline = frs[i].text.replace(label, "").trim();
        return inline || frs[i + 1]?.text.trim() || null;
      }
    }
    return null;
  };

  const period =
    /(\d{1,2})\s+([A-Za-z]{3})[a-z]*\s+(\d{4})\s*-\s*(\d{1,2})\s+([A-Za-z]{3})[a-z]*\s+(\d{4})/.exec(
      value(/^statement period:?/i) ?? "",
    );
  const req = /(\d{1,2})\s+([A-Za-z]{3})[a-z]*\s+(\d{4})/.exec(
    value(/^request date:?/i) ?? "",
  );

  const rows: SummaryRow[] = [];
  let totalIn: number | null = null;
  let totalOut: number | null = null;
  for (const frs of lines) {
    if (frs.length < 3) continue;
    const a = parseCents(frs[frs.length - 2].text);
    const b = parseCents(frs[frs.length - 1].text);
    const label = frs[0].text;
    if (a === null || b === null || !/:\s*$/.test(label)) continue;
    const clean = label.replace(/:\s*$/, "").trim();
    if (/^total$/i.test(clean)) {
      totalIn = kes(a);
      totalOut = kes(b);
    } else {
      rows.push({ label: clean, paidIn: kes(a), paidOut: kes(b) });
    }
  }

  return {
    meta: {
      customerName: value(/^customer name:?/i),
      mobile: value(/^mobile number:?/i),
      email: value(/^email address:?/i),
      periodStart: period
        ? parseDayMonthYear(period[1], period[2], period[3])
        : null,
      periodEnd: period
        ? parseDayMonthYear(period[4], period[5], period[6])
        : null,
      requestDate: req ? parseDayMonthYear(req[1], req[2], req[3]) : null,
    },
    summary:
      rows.length || totalIn !== null
        ? { rows, totalPaidIn: totalIn, totalPaidOut: totalOut }
        : null,
  };
}

/* -------------------------------------------------------------------------- */
/* Balance chain + chronological order                                        */
/* -------------------------------------------------------------------------- */

const cents = (n: number) => Math.round(n * 100);

/** Order rows so each one's balance follows from the previous: start + amount = balance. */
function chain(start: number, rows: Transaction[]): Transaction[] | null {
  const left = [...rows];
  const out: Transaction[] = [];
  let bal = cents(start);
  while (left.length) {
    const i = left.findIndex(
      (t) => bal + cents(t.amount) === cents(t.balance as number),
    );
    if (i < 0) return null;
    const [t] = left.splice(i, 1);
    out.push(t);
    bal = cents(t.balance as number);
  }
  return out;
}

/**
 * The statement prints newest first, but rows sharing a second (a transfer and
 * its charge) come in either order. The running balance says which really
 * happened first, so use it to set a reliable chronological sequence and to
 * prove no row was lost.
 */
function sequenceTransactions(txs: Transaction[]): {
  breaks: number;
  opening: number | null;
  closing: number | null;
} {
  const groups = new Map<number, Transaction[]>();
  for (const t of txs) {
    const g = groups.get(t.ts);
    if (g) g.push(t);
    else groups.set(t.ts, [t]);
  }

  let prev: number | null = null;
  let opening: number | null = null;
  let breaks = 0;
  let seq = 0;

  for (const ts of [...groups.keys()].sort((a, b) => a - b)) {
    const group = groups.get(ts) as Transaction[];
    const wallet = group.filter((t) => t.affectsWallet && t.balance !== null);
    const other = group.filter((t) => !wallet.includes(t)).reverse();

    let ordered: Transaction[] | null = null;
    if (prev !== null) {
      ordered = chain(prev, wallet);
    } else {
      for (const c of wallet) {
        const start = (cents(c.balance as number) - cents(c.amount)) / 100;
        ordered = chain(start, wallet);
        if (ordered) {
          opening = start;
          break;
        }
      }
    }
    if (!ordered) {
      ordered = [...wallet].reverse(); // best guess: reverse of print order
      if (prev !== null) breaks++;
      if (opening === null && ordered[0]) {
        opening =
          (cents(ordered[0].balance as number) - cents(ordered[0].amount)) /
          100;
      }
    }

    for (const t of [...ordered, ...other]) t.seq = seq++;
    if (ordered.length) prev = ordered[ordered.length - 1].balance;
  }

  return { breaks, opening, closing: prev };
}

/* -------------------------------------------------------------------------- */
/* Whole-document parse                                                       */
/* -------------------------------------------------------------------------- */

/** Exported so it can be tested against any pdf.js document. Prefer parseStatement. */
export async function parseDocument(
  doc: PdfDocument,
  options: ParseOptions = {},
): Promise<ParsedStatement> {
  const { signal, onProgress, maxPages = 1500 } = options;
  const total = doc.numPages;
  if (total > maxPages) {
    throw new StatementFormatError(
      `This PDF has ${total} pages, which is more than we can read.`,
    );
  }

  let header: HeaderInfo | null = null;
  let layout: Layout | null = null;
  let preface: Item[] = [];
  const raw: RawRow[] = [];

  for (let p = 1; p <= total; p++) {
    if (signal?.aborted) throw new DOMException("Aborted", "AbortError");
    onProgress?.({ page: p, total });

    const page = await doc.getPage(p);
    const content = await page.getTextContent();
    page.cleanup();

    const items = toItems(content);
    if (items.length > MAX_ITEMS_PER_PAGE) {
      throw new StatementFormatError(
        "This PDF has far more text than a statement should.",
      );
    }

    const found = findHeader(items);
    if (found) header = found;
    if (p === 1)
      preface = found ? items.filter((i) => i.y > found.y + 1) : items;
    if (!header) continue;

    const top = found ? found.y - 1 : Infinity;
    const footers = items.filter(
      (i) => i.y < top && FOOTER_START.test(i.str.trim()),
    );
    const footerY = footers.length
      ? Math.max(...footers.map((i) => i.y))
      : null;
    const body = items.filter(
      (i) => i.y < top && (footerY === null || i.y > footerY + 1),
    );

    layout = buildLayout(body, header, layout);
    if (!layout) continue;

    raw.push(...assembleRows(body, layout, p));
    if (raw.length > MAX_ROWS) {
      throw new StatementFormatError(
        "This PDF has far more rows than a statement should.",
      );
    }
  }

  if (raw.length === 0) {
    throw new StatementFormatError(
      "We couldn't find any transactions. This doesn't look like an M-PESA statement PDF.",
    );
  }

  const { meta: head, summary } = parsePreface(preface);
  const ownerDigits = (head.mobile ?? "").replace(/\D/g, "");
  const owner = normalisePhone(ownerDigits);
  const ownerMask =
    owner.length >= 9 ? `${owner.slice(0, 4)}***${owner.slice(-3)}` : null;
  const ownerTokens = (head.customerName ?? "")
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean);

  const warnings: string[] = [];
  const txs: Transaction[] = [];
  let skipped = 0;
  let sumIn = 0;
  let sumOut = 0;

  raw.forEach((r, order) => {
    const stamp = parseTimestamp(r.time);
    const inC = parseCents(r.paidIn);
    const outC = parseCents(r.withdrawn);
    if (!stamp || (inC === null && outC === null)) {
      skipped++;
      return;
    }
    const paidIn = inC === null ? 0 : Math.abs(inC) / 100;
    const paidOut = outC === null ? 0 : Math.abs(outC) / 100;
    sumIn += Math.round(paidIn * 100);
    sumOut += Math.round(paidOut * 100);

    const c = classify(r.details, paidIn, paidOut);
    const balC = parseCents(r.balance);

    // The business-account half of a wallet<->business transfer prints the
    // *business* balance, which must never be mixed into the wallet's.
    const affectsWallet =
      c.kind !== "business_transfer" ||
      (c.transferDirection === "to_wallet" ? paidIn > 0 : paidOut > 0);

    const cp = c.counterparty;
    const names = cp ? cp.name.toLowerCase().split(" ").filter(Boolean) : [];
    const likelySelf =
      cp?.kind === "person" &&
      ((ownerMask !== null && cp.phone === ownerMask) ||
        (names.length >= 2 &&
          ownerTokens.length >= 2 &&
          names.every((n) => ownerTokens.includes(n))));

    txs.push({
      id: `${r.receipt}-${order}`,
      receipt: r.receipt,
      ts: stamp.ts,
      seq: 0,
      date: stamp.date,
      time: stamp.time,
      month: stamp.month,
      hour: stamp.hour,
      weekday: stamp.weekday,
      details: r.details,
      status: r.status || "Completed",
      paidIn,
      paidOut,
      amount: Math.round((paidIn - paidOut) * 100) / 100,
      direction: paidIn >= paidOut ? "in" : "out",
      balance: affectsWallet && balC !== null ? kes(balC) : null,
      affectsWallet,
      kind: c.kind,
      counterparty: cp,
      transferDirection: c.transferDirection,
      likelySelf: Boolean(likelySelf),
      page: r.page,
      order,
    });
  });

  if (txs.length === 0) {
    throw new StatementFormatError(
      "We found the table but couldn't read any of its rows.",
    );
  }

  const { breaks, opening, closing } = sequenceTransactions(txs);

  let totalsMatch: boolean | null = null;
  if (
    summary &&
    summary.totalPaidIn !== null &&
    summary.totalPaidOut !== null
  ) {
    totalsMatch =
      sumIn === Math.round(summary.totalPaidIn * 100) &&
      sumOut === Math.round(summary.totalPaidOut * 100);
  }

  if (skipped > 0)
    warnings.push(`${skipped} row(s) could not be read and were skipped.`);
  if (breaks > 0)
    warnings.push(
      "The running balance didn't add up in places; some rows may be off.",
    );
  if (totalsMatch === false)
    warnings.push("Our totals differ from the statement's own TOTAL row.");

  const dates = txs.map((t) => t.date).sort();

  return {
    meta: { ...head, pageCount: total },
    summary,
    transactions: txs,
    coverage: {
      first: dates[0] ?? null,
      last: dates[dates.length - 1] ?? null,
    },
    balances: { opening, closing },
    checks: {
      rowCount: txs.length,
      skippedRows: skipped,
      balanceBreaks: breaks,
      totalsMatchSummary: totalsMatch,
      warnings,
    },
  };
}
