"use client";

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
  mobileNumber: string;
  /** e.g. "2026-01-01 - 2026-09-29" */
  period: string;
  totalIn: number;
  totalOut: number;
  fees: number;
  /** Outgoing categories using the page's names (Send Money, PayBill, ...) */
  categories: { name: string; amount: number }[];
  /** Shows the "DEMO PREVIEW" badge */
  isDemo: boolean;
}

const CARD_W = 1080;
const CARD_H = 1920;
const CTA_URL = "daraja.lumierelabs.xyz/safi";

const G = {
  bg: "#052E1F",
  ink: "#F2F7F1",
  muted: "rgba(242,247,241,0.58)",
  line: "rgba(242,247,241,0.16)",
  lime: "#C4F46A",
  limeInk: "#07281B",
  mint: "#8EF0B6",
  coral: "#FF9B8A",
};

const money = (n: number) =>
  `KSh ${Math.abs(n).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

/** Font size that keeps a string inside maxW (digits are ~0.62em wide). */
const fs = (s: string, max: number, maxW: number) =>
  Math.min(max, Math.floor(maxW / (s.length * 0.62)));

const maskPhone = (s: string) => {
  const p = s.replace(/\s+/g, "");
  if (p.length < 6) return "*".repeat(p.length || 8);
  return `${p.slice(0, 2)}${"*".repeat(p.length - 4)}${p.slice(-2)}`;
};

function prettyPeriod(p: string) {
  const m = p.match(/(\d{4}-\d{2}-\d{2})\s*-\s*(\d{4}-\d{2}-\d{2})/);
  if (!m) return p.trim();
  const a = new Date(`${m[1]}T00:00:00`);
  const b = new Date(`${m[2]}T00:00:00`);
  const mon = (d: Date) => d.toLocaleDateString("en-GB", { month: "long" });
  const sameYear = a.getFullYear() === b.getFullYear();
  if (sameYear && a.getMonth() === b.getMonth())
    return `${mon(b)} ${b.getFullYear()}`;
  return sameYear
    ? `${mon(a)} \u2014 ${mon(b)} ${b.getFullYear()}`
    : `${mon(a)} ${a.getFullYear()} \u2014 ${mon(b)} ${b.getFullYear()}`;
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

function bucketCategories(cats: ShareData["categories"]) {
  const sums: Record<string, number> = {
    "Send Money": 0,
    "Shopping & Payments": 0,
    Withdrawals: 0,
    Other: 0,
  };
  cats.forEach((c) => {
    if (c.name === "Send Money") sums["Send Money"] += c.amount;
    else if (
      ["Merchant Payments", "PayBill", "Airtime & Bundles"].includes(c.name)
    )
      sums["Shopping & Payments"] += c.amount;
    else if (c.name === "Withdrawals") sums.Withdrawals += c.amount;
    else sums.Other += c.amount;
  });
  const named = Object.entries(sums)
    .filter(([n]) => n !== "Other")
    .sort((a, b) => b[1] - a[1]);
  const rows = [...named, ["Other", sums.Other] as [string, number]].filter(
    ([, v]) => v > 0,
  );
  const pct = percents(rows.map(([, v]) => v));
  return rows.map(([name], i) => ({ name, pct: pct[i] }));
}

/* ------------------------------------------------------------------ */
/* The image itself (plain DOM + inline styles, captured by html-to-image) */
/* ------------------------------------------------------------------ */

const label = {
  fontSize: 24,
  fontWeight: 700,
  letterSpacing: "0.16em",
  color: G.muted,
} as const;

const SafiCard = forwardRef<HTMLDivElement, { d: ShareData; reveal: boolean }>(
  function SafiCard({ d, reveal }, ref) {
    const net = d.totalIn - d.totalOut;
    const netStr = `${net >= 0 ? "+" : "-"}${money(net)}`;
    const inStr = money(d.totalIn);
    const outStr = money(d.totalOut);
    const feeStr = money(d.fees);
    const rows = bucketCategories(d.categories);

    return (
      <div
        ref={ref}
        style={{
          position: "relative",
          width: CARD_W,
          height: CARD_H,
          boxSizing: "border-box",
          padding: "72px 80px",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          overflow: "hidden",
          color: G.ink,
          fontFamily: "inherit",
          fontVariantNumeric: "tabular-nums",
          background: `radial-gradient(900px 700px at 100% 0%, rgba(196,244,106,0.16), transparent 60%), radial-gradient(800px 700px at 0% 100%, rgba(52,211,153,0.14), transparent 60%), ${G.bg}`,
        }}
      >
        {/* ripple motif */}
        {[760, 1060, 1360].map((s) => (
          <div
            key={s}
            style={{
              position: "absolute",
              top: -s / 2,
              right: -s / 2,
              width: s,
              height: s,
              borderRadius: "50%",
              border: "2px solid rgba(196,244,106,0.10)",
            }}
          />
        ))}

        {/* header */}
        <div
          style={{
            position: "relative",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 22 }}>
            <div
              style={{
                width: 72,
                height: 72,
                borderRadius: 22,
                background: G.lime,
                color: G.limeInk,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 44,
                fontWeight: 900,
              }}
            >
              S
            </div>
            <div>
              <div
                style={{
                  fontSize: 44,
                  fontWeight: 900,
                  letterSpacing: "0.14em",
                  lineHeight: 1,
                }}
              >
                SAFI
              </div>
              <div style={{ ...label, fontSize: 20, marginTop: 8 }}>
                YOUR MONEY RECAP
              </div>
            </div>
          </div>
          {d.isDemo && (
            <div
              style={{
                border: `2px solid ${G.lime}`,
                color: G.lime,
                borderRadius: 999,
                padding: "12px 26px",
                fontSize: 22,
                fontWeight: 800,
                letterSpacing: "0.18em",
              }}
            >
              DEMO PREVIEW
            </div>
          )}
        </div>

        {/* headline */}
        <div style={{ position: "relative" }}>
          <div style={{ ...label, color: G.lime, fontSize: 24 }}>
            MY FINANCIAL SNAPSHOT
          </div>
          <div
            style={{
              marginTop: 22,
              fontSize: 116,
              fontWeight: 900,
              lineHeight: 1.02,
              letterSpacing: "-0.035em",
            }}
          >
            <span style={{ display: "block" }}>My money,</span>
            <span style={{ display: "block", opacity: 0.5 }}>
              in perspective.
            </span>
          </div>
          <div
            style={{
              marginTop: 24,
              fontSize: 36,
              fontWeight: 500,
              color: G.muted,
            }}
          >
            {prettyPeriod(d.period)}
          </div>
        </div>

        {/* money */}
        <div style={{ position: "relative" }}>
          <div style={{ borderTop: `2px solid ${G.line}`, padding: "24px 0" }}>
            <div style={label}>TOTAL MONEY RECEIVED</div>
            <div
              style={{
                marginTop: 8,
                fontSize: fs(inStr, 76, 920),
                fontWeight: 800,
                letterSpacing: "-0.02em",
                color: G.mint,
                lineHeight: 1.1,
              }}
            >
              {inStr}
            </div>
          </div>
          <div style={{ borderTop: `2px solid ${G.line}`, padding: "24px 0" }}>
            <div style={label}>TOTAL MONEY SPENT</div>
            <div
              style={{
                marginTop: 8,
                fontSize: fs(outStr, 76, 920),
                fontWeight: 800,
                letterSpacing: "-0.02em",
                color: G.coral,
                lineHeight: 1.1,
              }}
            >
              {outStr}
            </div>
          </div>

          <div
            style={{
              marginTop: 8,
              borderRadius: 36,
              padding: "32px 40px",
              background: net >= 0 ? G.lime : G.coral,
              color: G.limeInk,
            }}
          >
            <div style={{ ...label, color: "rgba(7,40,27,0.7)" }}>
              NET CASH FLOW
            </div>
            <div
              style={{
                marginTop: 10,
                fontSize: fs(netStr, 108, 856),
                fontWeight: 900,
                letterSpacing: "-0.03em",
                lineHeight: 1.05,
              }}
            >
              {netStr}
            </div>
          </div>

          <div
            style={{
              marginTop: 8,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              borderTop: `2px solid ${G.line}`,
              borderBottom: `2px solid ${G.line}`,
              padding: "22px 0",
            }}
          >
            <div style={label}>TRANSACTION FEES</div>
            <div style={{ fontSize: 44, fontWeight: 800, color: G.coral }}>
              {feeStr}
            </div>
          </div>
        </div>

        {/* categories */}
        <div style={{ position: "relative" }}>
          <div
            style={{ fontSize: 40, fontWeight: 800, letterSpacing: "-0.01em" }}
          >
            Where my money went
          </div>
          <div style={{ marginTop: 22 }}>
            {rows.map((r, i) => (
              <div key={r.name} style={{ marginTop: i === 0 ? 0 : 20 }}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "baseline",
                    fontSize: 32,
                    fontWeight: 600,
                  }}
                >
                  <span>{r.name}</span>
                  <span style={{ fontWeight: 800 }}>{r.pct}%</span>
                </div>
                <div
                  style={{
                    marginTop: 10,
                    height: 12,
                    borderRadius: 6,
                    background: "rgba(242,247,241,0.10)",
                  }}
                >
                  <div
                    style={{
                      width: `${r.pct}%`,
                      height: 12,
                      borderRadius: 6,
                      background: G.lime,
                      opacity: [1, 0.75, 0.55, 0.4][i] ?? 0.4,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* account + privacy */}
        <div
          style={{
            position: "relative",
            display: "flex",
            justifyContent: "space-between",
            borderTop: `2px solid ${G.line}`,
            paddingTop: 24,
          }}
        >
          <div>
            <div style={label}>ACCOUNT</div>
            <div style={{ marginTop: 8, fontSize: 40, fontWeight: 800 }}>
              {reveal ? d.mobileNumber : maskPhone(d.mobileNumber)}
            </div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={label}>PRIVACY</div>
            <div
              style={{
                marginTop: 8,
                fontSize: 40,
                fontWeight: 800,
                display: "flex",
                alignItems: "center",
                justifyContent: "flex-end",
                gap: 14,
              }}
            >
              <span
                style={{
                  width: 16,
                  height: 16,
                  borderRadius: "50%",
                  background: reveal ? "#FBBF24" : G.lime,
                }}
              />
              {reveal ? "Visible" : "Protected"}
            </div>
          </div>
        </div>

        {/* CTA */}
        <div
          style={{
            position: "relative",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 24,
            padding: "30px 40px",
            borderRadius: 36,
            border: `2px solid ${G.line}`,
            background: "rgba(242,247,241,0.06)",
          }}
        >
          <div>
            <div
              style={{
                fontSize: 38,
                fontWeight: 900,
                letterSpacing: "-0.01em",
              }}
            >
              Understand your money.
            </div>
            <div style={{ marginTop: 6, fontSize: 24, color: G.muted }}>
              Made with SAFI
            </div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div
              style={{
                display: "inline-block",
                borderRadius: 999,
                background: G.lime,
                color: G.limeInk,
                padding: "14px 30px",
                fontSize: 30,
                fontWeight: 900,
              }}
            >
              Get yours now
            </div>
            <div style={{ marginTop: 10, fontSize: 24, color: G.muted }}>
              {CTA_URL}
            </div>
          </div>
        </div>
      </div>
    );
  },
);

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
      backgroundColor: G.bg,
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
      await navigator.share({ files: [file], title: "My SAFI money recap" });
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
            Made on your device as a portrait image. Your account number stays
            masked unless you reveal it.
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
              <SafiCard ref={cardRef} d={data} reveal={reveal} />
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between gap-4 rounded-xl border bg-muted/30 p-4">
              <div className="min-w-0">
                <p className="text-sm font-medium">
                  {reveal ? "Account number visible" : "Account number hidden"}
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Tap the eye to show or hide your full number.
                </p>
              </div>
              <Button
                type="button"
                variant={reveal ? "default" : "outline"}
                size="icon"
                onClick={() => setReveal((v) => !v)}
                aria-pressed={reveal}
                aria-label={
                  reveal ? "Hide account number" : "Show account number"
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
                ? "Heads up: your full number will be visible in the saved image."
                : "Safe to post. Only the first and last digits show."}
            </p>

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
