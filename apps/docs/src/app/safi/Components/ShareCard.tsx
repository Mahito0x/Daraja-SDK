"use client";

import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { toPng } from "html-to-image";
import { Download, Eye, EyeOff, Loader2, Share2 } from "lucide-react";
import { forwardRef, useEffect, useRef, useState } from "react";

/* ------------------------------------------------------------------ */
/* Types + helpers                                                     */
/* ------------------------------------------------------------------ */

export interface ShareData {
  /** Account holder, as printed on the statement. Masked unless revealed. */
  name: string;
  /** Masked unless revealed. */
  mobileNumber: string;
  /** "2026-01-01 - 2026-09-29" or "01 Jan 2026 - 29 Sep 2026" */
  period: string;
  totalIn: number;
  totalOut: number;
  fees: number;
  /** Outgoing categories, in whatever names the page uses. */
  categories: { name: string; amount: number }[];
  /** Shows the "Demo preview" tag */
  isDemo: boolean;
}

const CARD_W = 1080;
const CARD_H = 1920;
const CTA_URL = "daraja.lumierelabs.xyz/safi";

/**
 * The card is a fixed-size image that gets posted, so it carries its own two
 * palettes instead of following the app theme. Colours match the page:
 * emerald for money in, rose for money out, and the same four category hues.
 */
type Theme = "dark" | "light";

interface Palette {
  bg: string;
  panel: string;
  line: string;
  ink: string;
  muted: string;
  inn: string;
  out: string;
  markBg: string;
  markInk: string;
  cats: string[];
}

const PALETTES: Record<Theme, Palette> = {
  dark: {
    bg: "#08150F",
    panel: "#0E2017",
    line: "rgba(238,244,239,0.10)",
    ink: "#EEF4EF",
    muted: "#8AA396",
    inn: "#34D399",
    out: "#FB7185",
    markBg: "#C4F46A",
    markInk: "#07281B",
    cats: ["#34D399", "#38BDF8", "#FBBF24", "#A78BFA"],
  },
  light: {
    bg: "#F4F6F3",
    panel: "#FFFFFF",
    line: "rgba(12,24,17,0.10)",
    ink: "#0E1A13",
    muted: "#64756B",
    inn: "#059669",
    out: "#E11D48",
    markBg: "#0E1A13",
    markInk: "#C4F46A",
    cats: ["#059669", "#0284C7", "#D97706", "#7C3AED"],
  },
};

const number = (n: number) =>
  Math.abs(n).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

/** Largest font size (up to max) that keeps `chars` characters inside `width`. */
const fit = (chars: number, max: number, width: number, em = 0.6) =>
  Math.max(20, Math.min(max, Math.floor(width / (Math.max(chars, 1) * em))));

const maskPhone = (s: string) => {
  const p = s.replace(/\s+/g, "");
  if (p.length < 6) return "*".repeat(p.length || 8);
  return `${p.slice(0, 2)}${"*".repeat(p.length - 4)}${p.slice(-2)}`;
};

/** "JUWERIA SAID MUALIM" -> "J**** S*** M****" */
const maskName = (s: string) =>
  s
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w[0] + "*".repeat(Math.min(4, w.length - 1)))
    .join(" ") || "********";

const titleCase = (s: string) =>
  s
    .toLowerCase()
    .replace(
      /(^|[\s\-'])([a-z])/g,
      (_, a: string, b: string) => a + b.toUpperCase(),
    );

const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

function parseDay(s: string): { y: number; m: number; d: number } | null {
  const iso = /(\d{4})-(\d{2})-(\d{2})/.exec(s);
  if (iso) return { y: +iso[1], m: +iso[2] - 1, d: +iso[3] };
  const dmy = /(\d{1,2})\s+([A-Za-z]{3})[a-z]*\s+(\d{4})/.exec(s);
  if (dmy) {
    const m = MONTHS.findIndex((x) => x.toLowerCase() === dmy[2].toLowerCase());
    if (m >= 0) return { y: +dmy[3], m, d: +dmy[1] };
  }
  return null;
}

/** "1 Jan to 29 Sep 2026". Falls back to the raw text if it can't be read. */
function prettyPeriod(p: string) {
  const [from, to] = p.split(/\s+-\s+/);
  const a = from ? parseDay(from) : null;
  const b = to ? parseDay(to) : null;
  if (!a || !b) return p.trim();
  const day = (x: typeof a) => `${x.d} ${MONTHS[x.m]}`;
  if (a.y === b.y && a.m === b.m && a.d === b.d) return `${day(a)} ${a.y}`;
  return a.y === b.y
    ? `${day(a)} to ${day(b)} ${b.y}`
    : `${day(a)} ${a.y} to ${day(b)} ${b.y}`;
}

/** Rounds to whole percents that always add up to 100. */
function percents(vals: number[]) {
  const sum = vals.reduce((a, b) => a + b, 0);
  if (sum <= 0) return vals.map(() => 0);
  const raw = vals.map((v) => (v / sum) * 100);
  const out = raw.map(Math.floor);
  let rem = 100 - out.reduce((a, b) => a + b, 0);
  raw
    .map((r, i) => [r - out[i], i] as const)
    .sort((a, b) => b[0] - a[0])
    .forEach(([, i]) => {
      if (rem > 0) {
        out[i]++;
        rem--;
      }
    });
  return out;
}

const BUCKETS = ["Send money", "Shopping & bills", "Cash withdrawals", "Other"];

/** Works with the page's names ("Merchant Payments") and the parser's ("Buy goods (Till)"). */
function bucketOf(name: string) {
  const n = name.toLowerCase();
  if (/send|transfer/.test(n)) return 0;
  if (/merchant|till|goods|pay ?bill|card|airtime|bundle|pochi/.test(n))
    return 1;
  if (/withdraw/.test(n)) return 2;
  return 3;
}

function bucketCategories(cats: ShareData["categories"]) {
  const sums = BUCKETS.map(() => 0);
  cats.forEach((c) => {
    sums[bucketOf(c.name)] += c.amount;
  });
  // Biggest first, but "Other" always last.
  const order = [0, 1, 2].sort((a, b) => sums[b] - sums[a]).concat(3);
  const rows = order.filter((i) => sums[i] > 0);
  const total = rows.reduce((s, i) => s + sums[i], 0);
  const pct = percents(rows.map((i) => sums[i]));
  return rows.map((i, idx) => ({
    name: BUCKETS[i],
    amount: sums[i],
    pct: pct[idx],
    share: total > 0 ? (sums[i] / total) * 100 : 0,
  }));
}

/* ------------------------------------------------------------------ */
/* The image itself (plain DOM + inline styles, captured by html-to-image) */
/* ------------------------------------------------------------------ */

const SafiCard = forwardRef<
  HTMLDivElement,
  { d: ShareData; reveal: boolean; theme: Theme }
>(function SafiCard({ d, reveal, theme }, ref) {
  const P = PALETTES[theme];
  const net = d.totalIn - d.totalOut;
  const flow = d.totalIn + d.totalOut;
  const inShare = flow > 0 ? (d.totalIn / flow) * 100 : 50;
  const feeShare = d.totalOut > 0 ? (d.fees / d.totalOut) * 100 : 0;
  const rows = bucketCategories(d.categories);

  const name = reveal ? titleCase(d.name) : maskName(d.name);
  const phone = reveal ? d.mobileNumber : maskPhone(d.mobileNumber);

  const netDigits = `${net < 0 ? "-" : ""}${number(net)}`;

  const label = { fontSize: 26, fontWeight: 500, color: P.muted } as const;
  const panel = {
    background: P.panel,
    border: `2px solid ${P.line}`,
    borderRadius: 36,
  } as const;

  return (
    <div
      ref={ref}
      style={{
        width: CARD_W,
        height: CARD_H,
        boxSizing: "border-box",
        padding: "80px 80px 72px",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        gap: 36,
        overflow: "hidden",
        background: P.bg,
        color: P.ink,
        fontFamily: "inherit",
        fontVariantNumeric: "tabular-nums",
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <div
            style={{ fontSize: 42, fontWeight: 700, letterSpacing: "-0.02em" }}
          >
            <Logo size={50} />
          </div>
        </div>
        {d.isDemo ? (
          <div
            style={{
              border: `2px solid ${P.line}`,
              borderRadius: 999,
              padding: "10px 24px",
              fontSize: 24,
              fontWeight: 600,
              color: P.muted,
            }}
          >
            Demo preview
          </div>
        ) : (
          <div style={{ fontSize: 26, fontWeight: 500, color: P.muted }}>
            Money recap
          </div>
        )}
      </div>

      {/* Period */}
      <div>
        <div style={label}>Statement period</div>
        <div
          style={{
            marginTop: 10,
            fontSize: fit(prettyPeriod(d.period).length, 88, 920, 0.56),
            fontWeight: 700,
            letterSpacing: "-0.03em",
            lineHeight: 1.1,
          }}
        >
          {prettyPeriod(d.period)}
        </div>
      </div>

      {/* Who: name and number share one style, so they read as a pair */}
      <div style={{ ...panel, display: "flex" }}>
        <div style={{ flex: 1.55, minWidth: 0, padding: "34px 40px" }}>
          <div style={label}>Account holder</div>
          <div
            style={{
              marginTop: 10,
              fontSize: 40,
              fontWeight: 600,
              lineHeight: 1.18,
              letterSpacing: "-0.01em",
              wordBreak: "break-word",
              maxHeight: 40 * 1.18 * 2,
              overflow: "hidden",
            }}
          >
            {name}
          </div>
        </div>
        <div style={{ width: 2, background: P.line }} />
        <div style={{ flex: 1, minWidth: 0, padding: "34px 40px" }}>
          <div style={label}>Mobile number</div>
          <div
            style={{
              marginTop: 10,
              fontSize: 40,
              fontWeight: 600,
              lineHeight: 1.18,
              whiteSpace: "nowrap",
            }}
          >
            {phone}
          </div>
        </div>
      </div>

      {/* Net cash flow */}
      <div style={{ ...panel, padding: "44px 48px 48px" }}>
        <div style={label}>Net cash flow</div>
        <div
          style={{
            marginTop: 14,
            display: "flex",
            alignItems: "baseline",
            gap: 20,
            whiteSpace: "nowrap",
          }}
        >
          <span style={{ fontSize: 46, fontWeight: 500, color: P.muted }}>
            KSh
          </span>
          <span
            style={{
              fontSize: fit(netDigits.length, 132, 640),
              fontWeight: 700,
              letterSpacing: "-0.035em",
              lineHeight: 1,
              color: net >= 0 ? P.inn : P.out,
            }}
          >
            {netDigits}
          </span>
        </div>

        <div
          style={{
            marginTop: 40,
            display: "flex",
            height: 18,
            borderRadius: 9,
            overflow: "hidden",
            background: P.line,
          }}
        >
          <div style={{ width: `${inShare}%`, background: P.inn }} />
          <div style={{ width: `${100 - inShare}%`, background: P.out }} />
        </div>

        <div style={{ marginTop: 32, display: "flex" }}>
          {(
            [
              ["Received", d.totalIn, P.inn],
              ["Spent", d.totalOut, P.out],
            ] as const
          ).map(([text, value, color], i) => (
            <div
              key={text}
              style={{ flex: 1, minWidth: 0, paddingLeft: i === 0 ? 0 : 36 }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  ...label,
                }}
              >
                <span
                  style={{
                    width: 14,
                    height: 14,
                    borderRadius: 7,
                    background: color,
                  }}
                />
                {text}
              </div>
              <div
                style={{
                  marginTop: 8,
                  fontSize: fit(number(value).length + 4, 48, 360),
                  fontWeight: 600,
                  whiteSpace: "nowrap",
                }}
              >
                <span style={{ color: P.muted, fontWeight: 500 }}>KSh </span>
                {number(value)}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Fees */}
      <div
        style={{
          ...panel,
          padding: "30px 40px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 24,
        }}
      >
        <div>
          <div style={{ fontSize: 32, fontWeight: 600 }}>Transaction fees</div>
          <div style={{ ...label, fontSize: 24, marginTop: 6 }}>
            {feeShare.toFixed(1)}% of what I spent
          </div>
        </div>
        <div style={{ fontSize: 44, fontWeight: 600, whiteSpace: "nowrap" }}>
          <span style={{ color: P.muted, fontWeight: 500 }}>KSh </span>
          {number(d.fees)}
        </div>
      </div>

      {/* Where it went */}
      <div>
        <div
          style={{ fontSize: 36, fontWeight: 700, letterSpacing: "-0.01em" }}
        >
          Where my money went
        </div>

        {rows.length === 0 ? (
          <div style={{ ...label, marginTop: 24 }}>
            No spending in this period.
          </div>
        ) : (
          <>
            <div
              style={{
                marginTop: 26,
                display: "flex",
                height: 18,
                borderRadius: 9,
                overflow: "hidden",
                background: P.line,
                gap: 4,
              }}
            >
              {rows.map((r, i) => (
                <div
                  key={r.name}
                  style={{
                    width: `${Math.max(r.share, 1)}%`,
                    background: P.cats[i % P.cats.length],
                  }}
                />
              ))}
            </div>

            <div style={{ marginTop: 10 }}>
              {rows.map((r, i) => (
                <div
                  key={r.name}
                  style={{
                    height: 84,
                    display: "flex",
                    alignItems: "center",
                    gap: 20,
                    borderBottom:
                      i === rows.length - 1 ? "none" : `2px solid ${P.line}`,
                  }}
                >
                  <span
                    style={{
                      width: 20,
                      height: 20,
                      borderRadius: 10,
                      flexShrink: 0,
                      background: P.cats[i % P.cats.length],
                    }}
                  />
                  <span style={{ flex: 1, fontSize: 34, fontWeight: 500 }}>
                    {r.name}
                  </span>
                  <span
                    style={{
                      fontSize: 28,
                      color: P.muted,
                      whiteSpace: "nowrap",
                    }}
                  >
                    KSh {number(r.amount)}
                  </span>
                  <span
                    style={{
                      width: 104,
                      textAlign: "right",
                      fontSize: 34,
                      fontWeight: 700,
                    }}
                  >
                    {r.pct === 0 ? "<1%" : `${r.pct}%`}
                  </span>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Footer */}
      <div
        style={{
          borderTop: `2px solid ${P.line}`,
          paddingTop: 34,
          display: "flex",
          alignItems: "flex-end",
          justifyContent: "space-between",
          gap: 24,
        }}
      >
        <div>
          <div style={{ fontSize: 30, fontWeight: 600 }}>Made with Safi</div>
          <div style={{ ...label, fontSize: 24, marginTop: 6 }}>
            Read on my device. Nothing uploaded.
          </div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ ...label, fontSize: 24 }}>Get yours</div>
          <div style={{ fontSize: 30, fontWeight: 600, marginTop: 6 }}>
            {CTA_URL}
          </div>
        </div>
      </div>
    </div>
  );
});

/* ------------------------------------------------------------------ */
/* Dialog                                                              */
/* ------------------------------------------------------------------ */

export function ShareDialog({
  open,
  onOpenChange,
  data,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  data: ShareData;
}) {
  const [reveal, setReveal] = useState(false);
  const [theme, setTheme] = useState<Theme>("dark");
  const [busy, setBusy] = useState<"save" | "share" | null>(null);
  const [canShare, setCanShare] = useState(false);
  const [wrap, setWrap] = useState<HTMLDivElement | null>(null);
  const [scale, setScale] = useState(0.3);
  const cardRef = useRef<HTMLDivElement>(null);

  // Always start protected, every time the dialog opens.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (!open) setReveal(false);
  }, [open]);

  useEffect(() => {
    try {
      const f = new File([""], "a.png", { type: "image/png" });
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setCanShare(!!navigator.canShare?.({ files: [f] }));
    } catch {
      setCanShare(false);
    }
  }, []);

  // Scale the 1080x1920 card down to the preview width (capture stays full size).
  useEffect(() => {
    if (!wrap) return;
    const ro = new ResizeObserver(([e]) =>
      setScale(e.contentRect.width / CARD_W),
    );
    ro.observe(wrap);
    return () => ro.disconnect();
  }, [wrap]);

  const render = async () => {
    const node = cardRef.current;
    if (!node) throw new Error("Card not ready");
    const opts = {
      width: CARD_W,
      height: CARD_H,
      pixelRatio: 1.5,
      cacheBust: true,
      backgroundColor: PALETTES[theme].bg,
      // The preview is scaled with a CSS transform; capture the card at full size.
      style: { transform: "none", transformOrigin: "top left" },
    };
    await toPng(node, opts); // warm-up: Safari drops fonts/images on the first pass
    return toPng(node, opts);
  };

  const save = async () => {
    setBusy("save");
    try {
      const url = await render();
      const a = document.createElement("a");
      a.href = url;
      a.download = `safi-recap-${new Date().toISOString().slice(0, 10)}.png`;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } finally {
      setBusy(null);
    }
  };

  const share = async () => {
    setBusy("share");
    try {
      const url = await render();
      const blob = await (await fetch(url)).blob();
      const file = new File([blob], "safi-recap.png", { type: "image/png" });
      await navigator.share({ files: [file], title: "My Safi money recap" });
    } catch {
      /* cancelled */
    } finally {
      setBusy(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] w-[calc(100%-1.5rem)] overflow-y-auto p-4 sm:max-w-3xl sm:p-6">
        <DialogHeader>
          <DialogTitle>Share your money recap</DialogTitle>
          <DialogDescription>
            Made on your device as a portrait image. Your name and number stay
            masked unless you reveal them.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-6 sm:grid-cols-[minmax(0,320px)_1fr] sm:items-start">
          <div
            ref={setWrap}
            className="relative mx-auto aspect-[9/16] w-full max-w-[260px] overflow-hidden rounded-2xl border shadow-2xl sm:max-w-none"
          >
            <div
              style={{
                width: CARD_W,
                height: CARD_H,
                transform: `scale(${scale})`,
                transformOrigin: "top left",
              }}
            >
              <SafiCard ref={cardRef} d={data} reveal={reveal} theme={theme} />
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between gap-4 rounded-xl border bg-muted/30 p-4">
              <div className="min-w-0">
                <p className="text-sm font-medium">
                  {reveal
                    ? "Name and number visible"
                    : "Name and number hidden"}
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Tap the eye to show or hide them.
                </p>
              </div>
              <Button
                type="button"
                variant={reveal ? "default" : "outline"}
                size="icon"
                onClick={() => setReveal((v) => !v)}
                aria-pressed={reveal}
                aria-label={
                  reveal ? "Hide name and number" : "Show name and number"
                }
                className="shrink-0"
              >
                {reveal ? (
                  <Eye className="size-4" />
                ) : (
                  <EyeOff className="size-4" />
                )}
              </Button>
            </div>

            <p
              className={cn(
                "text-xs leading-relaxed",
                reveal
                  ? "text-amber-700 dark:text-amber-400"
                  : "text-muted-foreground",
              )}
            >
              {reveal
                ? "Heads up: your full name and number will be visible in the saved image."
                : "Safe to post. Only the first letters and last digits show."}
            </p>

            <div className="flex items-center justify-between gap-4 rounded-xl border bg-muted/30 p-4">
              <p className="text-sm font-medium">Card style</p>
              <div className="flex items-center gap-1 rounded-lg bg-muted p-1">
                {(["dark", "light"] as const).map((t) => (
                  <Button
                    key={t}
                    type="button"
                    size="sm"
                    variant={theme === t ? "default" : "ghost"}
                    onClick={() => setTheme(t)}
                    aria-pressed={theme === t}
                    className="h-7 px-3 text-xs capitalize"
                  >
                    {t}
                  </Button>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row">
              <Button onClick={save} disabled={!!busy} className="flex-1 gap-2">
                {busy === "save" ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Download className="size-4" />
                )}
                Save image
              </Button>
              {canShare && (
                <Button
                  variant="outline"
                  onClick={share}
                  disabled={!!busy}
                  className="flex-1 gap-2"
                >
                  {busy === "share" ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <Share2 className="size-4" />
                  )}
                  Share
                </Button>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
