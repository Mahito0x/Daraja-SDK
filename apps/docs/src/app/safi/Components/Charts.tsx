"use client";

import AreaChart, { Area } from "@/components/charts/area-chart";
import Bar from "@/components/charts/bar";
import BarChart from "@/components/charts/bar-chart";
import BarXAxis from "@/components/charts/bar-x-axis";
import Grid from "@/components/charts/grid";
import { ChartTooltip } from "@/components/charts/tooltip";
import XAxis from "@/components/charts/x-axis";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import {
  differenceInCalendarDays,
  format,
  startOfDay,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import {
  ArrowLeftRight,
  CalendarClock,
  Check,
  ChevronDown,
  Info,
  Layers,
  Wallet,
} from "lucide-react";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import type { MpesaTransaction } from "../data/data";

interface ChartsProps {
  transactions: MpesaTransaction[];
}

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

/**
 * Moves between your Business Account and M-PESA Account show up as a
 * paid-in AND a withdrawn row with the same receipt. They aren't real income
 * or spending, so every chart here ignores them.
 */
export const isInternalTransfer = (details: string) =>
  /business\s*account|small business withdrawal/i.test(details);

function parseTime(s: string): Date | null {
  const str = (s || "").trim();
  const iso = new Date(str.replace(" ", "T"));
  if (!isNaN(iso.getTime())) return iso;

  const [d, t = "00:00:00"] = str.split(" ");
  const sep = d.includes("/") ? "/" : "-";
  const p = d.split(sep).map(Number);
  if (p.length !== 3 || p.some(isNaN)) return null;
  const [y, m, day] = p[0] > 31 ? p : [p[2], p[1], p[0]];
  const [hh = 0, mm = 0, ss = 0] = t.split(":").map(Number);
  const out = new Date(y, m - 1, day, hh, mm, ss);
  return isNaN(out.getTime()) ? null : out;
}

function categorize(details: string) {
  const d = details.toLowerCase();
  if (d.includes("charge") || /\bfees?\b/.test(d)) return "Fees";
  if (d.includes("transfer to") || d.includes("customer transfer"))
    return "Send money";
  if (
    d.includes("merchant payment") ||
    d.includes("card pay bill") ||
    d.includes("payment to small")
  )
    return "Merchants";
  if (d.includes("pay bill") || d.includes("paybill")) return "Pay bill";
  if (d.includes("bundle") || d.includes("airtime") || d.includes("recharge"))
    return "Airtime & data";
  if (d.includes("withdrawal")) return "Withdrawals";
  return "Other payments";
}

const kes = (n: number) =>
  `KSh ${n.toLocaleString("en-US", { maximumFractionDigits: 0 })}`;

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const BLOCKS = [
  { label: "Night", hint: "12am to 6am" },
  { label: "Morning", hint: "6am to 12pm" },
  { label: "Afternoon", hint: "12pm to 6pm" },
  { label: "Evening", hint: "6pm to 12am" },
];

function useIsMobile(bp = 640) {
  const [mobile, setMobile] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia(`(max-width:${bp - 1}px)`);
    const on = () => setMobile(mq.matches);
    on();
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, [bp]);
  return mobile;
}

/* ------------------------------------------------------------------ */
/* Small UI pieces                                                     */
/* ------------------------------------------------------------------ */

function HelpIcon({ content }: { content: ReactNode }) {
  return (
    <Tooltip>
      <TooltipTrigger
        aria-label="What is this?"
        className="cursor-help rounded-full p-1 text-muted-foreground/70 outline-none transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/60"
      >
        <Info className="size-3.5" />
      </TooltipTrigger>
      <TooltipContent
        side="top"
        className="max-w-64 text-pretty text-xs leading-relaxed"
      >
        {content}
      </TooltipContent>
    </Tooltip>
  );
}

function MiniStat({
  label,
  value,
  sub,
  tone,
}: {
  label: string;
  value: string;
  sub?: string;
  tone?: "in" | "out";
}) {
  return (
    <div className="min-w-0 rounded-xl border bg-muted/30 px-3 py-2.5">
      <p className="truncate text-[11px] text-muted-foreground">{label}</p>
      <p
        className={cn(
          "mt-0.5 truncate text-sm font-semibold tabular-nums sm:text-base",
          tone === "in" && "text-emerald-700 dark:text-emerald-400",
          tone === "out" && "text-rose-700 dark:text-rose-400",
        )}
      >
        {value}
      </p>
      {sub && (
        <p className="truncate text-[11px] text-muted-foreground">{sub}</p>
      )}
    </div>
  );
}

function Legend({
  items,
}: {
  items: { name: string; color: string; note?: string }[];
}) {
  return (
    <ul className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-xs text-muted-foreground">
      {items.map((i) => (
        <li key={i.name} className="flex items-center gap-2">
          <span
            className="size-2.5 shrink-0 rounded-full"
            style={{ backgroundColor: i.color }}
          />
          <span className="text-foreground">{i.name}</span>
          {i.note && <span className="tabular-nums">{i.note}</span>}
        </li>
      ))}
    </ul>
  );
}

function Empty({ children }: { children: ReactNode }) {
  return (
    <div className="flex items-center justify-center py-16 text-center text-xs text-muted-foreground">
      {children}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Component                                                           */
/* ------------------------------------------------------------------ */

type View = "balance" | "flow" | "mix" | "habits";

const VIEWS: {
  key: View;
  label: string;
  icon: typeof Wallet;
  title: string;
  desc: string;
  tip: string;
}[] = [
  {
    key: "flow",
    label: "Cash flow",
    icon: ArrowLeftRight,
    title: "Money in vs money out",
    desc: "Compared per period, with the net result in the tooltip",
    tip: "Money received next to money sent for each period. The period adapts to your date range: days, weeks or months. Transfers between your Business and M-PESA accounts are ignored.",
  },
  {
    key: "balance",
    label: "Balance",
    icon: Wallet,
    title: "Your balance over time",
    desc: "Where your M-PESA balance ended each day",
    tip: "The balance left in your M-PESA after your last transaction of each day. Dips show heavy spending days; climbs show money coming in.",
  },
  {
    key: "mix",
    label: "Spending mix",
    icon: Layers,
    title: "How your spending shifts",
    desc: "What you spent on, period by period",
    tip: "Money sent, stacked by category for each period. Your top four categories get their own colour; the rest are grouped as 'Everything else'.",
  },
  {
    key: "habits",
    label: "Habits",
    icon: CalendarClock,
    title: "When you spend",
    desc: "Your weekly and daily rhythm",
    tip: "Which weekdays and times of day you spend the most. Fees and transfers between your own accounts are left out.",
  },
];

export function Charts({ transactions }: ChartsProps) {
  const [view, setView] = useState<View>("flow");
  const isMobile = useIsMobile();
  const aspect = isMobile ? "1.3 / 1" : "2.3 / 1";
  const halfAspect = isMobile ? "1.3 / 1" : "1.6 / 1";

  /** Chronological, real (non-internal) rows. Statement order is newest-first, so ties flip. */
  const rows = useMemo(() => {
    const out: { tx: MpesaTransaction; t: Date; idx: number }[] = [];
    transactions.forEach((tx, idx) => {
      if (isInternalTransfer(tx.details)) return;
      const t = parseTime(tx.completionTime);
      if (t) out.push({ tx, t, idx });
    });
    return out.sort((a, b) => a.t.getTime() - b.t.getTime() || b.idx - a.idx);
  }, [transactions]);

  /** Auto bucket size so charts stay readable at any range. */
  const grain = useMemo<"day" | "week" | "month">(() => {
    if (rows.length === 0) return "day";
    const span = differenceInCalendarDays(rows[rows.length - 1].t, rows[0].t);
    return span > 120 ? "month" : span > 45 ? "week" : "day";
  }, [rows]);

  const bucket = useMemo(() => {
    const multiYear =
      rows.length > 0 &&
      rows[0].t.getFullYear() !== rows[rows.length - 1].t.getFullYear();
    return (t: Date) => {
      if (grain === "month") {
        const s = startOfMonth(t);
        return {
          key: s.getTime(),
          label: format(s, multiYear ? "MMM yy" : "MMM"),
        };
      }
      if (grain === "week") {
        const s = startOfWeek(t, { weekStartsOn: 1 });
        return { key: s.getTime(), label: format(s, "d MMM") };
      }
      const s = startOfDay(t);
      return { key: s.getTime(), label: format(s, "d MMM") };
    };
  }, [grain, rows]);

  const grainWord =
    grain === "month" ? "month" : grain === "week" ? "week" : "day";

  /* ---------- 1. Balance ---------- */
  const balance = useMemo(() => {
    const byDay = new Map<number, { date: Date; balance: number }>();
    rows.forEach(({ tx, t }) => {
      const d = startOfDay(t);
      byDay.set(d.getTime(), { date: d, balance: tx.balance });
    });
    const data = [...byDay.values()];
    if (data.length === 0) return { data, high: null, low: null, last: null };
    const high = data.reduce((a, b) => (b.balance > a.balance ? b : a));
    const low = data.reduce((a, b) => (b.balance < a.balance ? b : a));
    return { data, high, low, last: data[data.length - 1] };
  }, [rows]);

  /* ---------- 2. Cash flow ---------- */
  const flow = useMemo(() => {
    const map = new Map<
      number,
      { label: string; moneyIn: number; moneyOut: number }
    >();
    rows.forEach(({ tx, t }) => {
      const b = bucket(t);
      const cur = map.get(b.key) ?? { label: b.label, moneyIn: 0, moneyOut: 0 };
      cur.moneyIn += tx.paidIn;
      cur.moneyOut += tx.withdrawn;
      map.set(b.key, cur);
    });
    const data = [...map.values()];
    const totalIn = data.reduce((a, b) => a + b.moneyIn, 0);
    const totalOut = data.reduce((a, b) => a + b.moneyOut, 0);
    const best = data.length
      ? data.reduce((a, b) =>
          b.moneyIn - b.moneyOut > a.moneyIn - a.moneyOut ? b : a,
        )
      : null;
    const worst = data.length
      ? data.reduce((a, b) =>
          b.moneyIn - b.moneyOut < a.moneyIn - a.moneyOut ? b : a,
        )
      : null;
    return { data, totalIn, totalOut, best, worst };
  }, [rows, bucket]);

  /* ---------- 3. Spending mix ---------- */
  const mix = useMemo(() => {
    const out = rows.filter((r) => r.tx.withdrawn > 0);
    const totals: Record<string, number> = {};
    out.forEach(({ tx }) => {
      const c = categorize(tx.details);
      totals[c] = (totals[c] ?? 0) + tx.withdrawn;
    });
    const ranked = Object.entries(totals).sort((a, b) => b[1] - a[1]);
    const top = ranked.slice(0, 4);
    const rest = ranked.slice(4);
    const grand = ranked.reduce((a, [, v]) => a + v, 0);

    const series = top.map(([name, total], i) => ({
      key: `s${i}`,
      name,
      total,
      color: `var(--chart-${i + 1})`,
    }));
    if (rest.length) {
      series.push({
        key: `s${series.length}`,
        name: "Everything else",
        total: rest.reduce((a, [, v]) => a + v, 0),
        color: `var(--chart-${series.length + 1})`,
      });
    }
    const keyOf = (cat: string) =>
      series.find((s) => s.name === cat)?.key ?? series[series.length - 1]?.key;

    const map = new Map<number, Record<string, number | string>>();
    out.forEach(({ tx, t }) => {
      const b = bucket(t);
      let row = map.get(b.key);
      if (!row) {
        row = { label: b.label };
        series.forEach((s) => (row![s.key] = 0));
        map.set(b.key, row);
      }
      const k = keyOf(categorize(tx.details));
      if (k) row[k] = (row[k] as number) + tx.withdrawn;
    });

    return { data: [...map.values()], series, grand };
  }, [rows, bucket]);

  /* ---------- 4. Habits ---------- */
  const habits = useMemo(() => {
    const week = WEEKDAYS.map((day) => ({ day, spent: 0 }));
    const grid = BLOCKS.map(() => Array<number>(7).fill(0));
    rows.forEach(({ tx, t }) => {
      if (tx.withdrawn <= 0 || categorize(tx.details) === "Fees") return;
      const d = (t.getDay() + 6) % 7;
      week[d].spent += tx.withdrawn;
      grid[Math.min(3, Math.floor(t.getHours() / 6))][d] += tx.withdrawn;
    });
    const max = Math.max(1, ...grid.flat());
    const total = week.reduce((a, b) => a + b.spent, 0);
    const topDay = week.reduce((a, b) => (b.spent > a.spent ? b : a));
    let peak = { b: 0, d: 0, v: -1 };
    grid.forEach((r, b) =>
      r.forEach((v, d) => {
        if (v > peak.v) peak = { b, d, v };
      }),
    );
    const blockTotals = grid.map((r) => r.reduce((a, b) => a + b, 0));
    const topBlock = blockTotals.indexOf(Math.max(...blockTotals));
    return { week, grid, max, total, topDay, peak, topBlock };
  }, [rows]);

  const meta = VIEWS.find((v) => v.key === view)!;
  const empty = rows.length === 0;

  const stats: {
    label: string;
    value: string;
    sub?: string;
    tone?: "in" | "out";
  }[] = empty
    ? []
    : view === "balance" && balance.high && balance.low && balance.last
      ? [
          {
            label: "Latest",
            value: kes(balance.last.balance),
            sub: format(balance.last.date, "d MMM yyyy"),
          },
          {
            label: "Highest",
            value: kes(balance.high.balance),
            sub: format(balance.high.date, "d MMM yyyy"),
            tone: "in",
          },
          {
            label: "Lowest",
            value: kes(balance.low.balance),
            sub: format(balance.low.date, "d MMM yyyy"),
            tone: "out",
          },
        ]
      : view === "flow"
        ? [
            {
              label: "Net flow",
              value: kes(Math.abs(flow.totalIn - flow.totalOut)),
              tone: flow.totalIn - flow.totalOut >= 0 ? "in" : "out",
            },
            {
              label: `Best ${grainWord}`,
              value: flow.best?.label ?? "-",
              sub: flow.best
                ? kes(flow.best.moneyIn - flow.best.moneyOut)
                : undefined,
              tone: "in",
            },
            {
              label: `Toughest ${grainWord}`,
              value: flow.worst?.label ?? "-",
              sub: flow.worst
                ? `${flow.worst.moneyIn - flow.worst.moneyOut < 0 ? "-" : "+"}${kes(Math.abs(flow.worst.moneyIn - flow.worst.moneyOut))}`
                : undefined,
              tone: "out",
            },
          ]
        : view === "mix"
          ? [
              { label: "Total spent", value: kes(mix.grand), tone: "out" },
              {
                label: "Top category",
                value: mix.series[0]?.name ?? "-",
                sub:
                  mix.series[0] && mix.grand
                    ? `${((mix.series[0].total / mix.grand) * 100).toFixed(0)}% of spending`
                    : undefined,
              },
              {
                label: "Categories",
                value: `${mix.series.length}`,
                sub: `shown per ${grainWord}`,
              },
            ]
          : [
              {
                label: "Priciest day",
                value: habits.total ? habits.topDay.day : "-",
                sub: habits.total ? kes(habits.topDay.spent) : undefined,
                tone: "out",
              },
              {
                label: "Busiest time",
                value: habits.total ? BLOCKS[habits.topBlock].label : "-",
                sub: habits.total ? BLOCKS[habits.topBlock].hint : undefined,
              },
              {
                label: "Hottest slot",
                value: habits.total
                  ? `${WEEKDAYS[habits.peak.d]} ${BLOCKS[habits.peak.b].label.toLowerCase()}`
                  : "-",
                sub: habits.total ? kes(habits.peak.v) : undefined,
              },
            ];

  return (
    <div className="space-y-5 rounded-2xl border bg-card p-5 sm:p-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-semibold tracking-tight">
              {meta.title}
            </h2>
            <HelpIcon content={meta.tip} />
          </div>
          <p className="mt-0.5 text-xs text-muted-foreground">{meta.desc}</p>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button
                variant="outline"
                size="sm"
                className="h-8 shrink-0 gap-1.5 px-2.5 text-xs"
                aria-label={`Chart view: ${meta.label}`}
              />
            }
          >
            <meta.icon className="size-4" />
            <span className="hidden sm:inline">{meta.label}</span>
            <ChevronDown className="size-3.5 opacity-50" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            {VIEWS.map(({ key, label, icon: Icon }) => (
              <DropdownMenuItem
                key={key}
                onClick={() => setView(key)}
                className="gap-2 text-xs"
              >
                <Icon className="size-3.5" />
                <span className="flex-1">{label}</span>
                {view === key && <Check className="size-3.5" />}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {empty ? (
        <Empty>No transaction data available for this range.</Empty>
      ) : (
        <>
          <div className="grid grid-cols-3 gap-2 sm:gap-3">
            {stats.map((s) => (
              <MiniStat key={s.label} {...s} />
            ))}
          </div>

          <div className="w-full">
            {/* ---------------- Cash flow ---------------- */}
            {view === "flow" && (
              <>
                <BarChart
                  data={flow.data}
                  xDataKey="label"
                  aspectRatio={aspect}
                >
                  <Grid horizontal />
                  <Bar
                    dataKey="moneyIn"
                    fill="var(--chart-line-primary)"
                    lineCap="round"
                  />
                  <Bar
                    dataKey="moneyOut"
                    fill="var(--chart-line-secondary)"
                    lineCap="round"
                  />
                  <BarXAxis />
                  <ChartTooltip
                    rows={(point: any) => [
                      {
                        label: "Money in",
                        value: point.moneyIn,
                        color: "var(--chart-line-primary)",
                      },
                      {
                        label: "Money out",
                        value: point.moneyOut,
                        color: "var(--chart-line-secondary)",
                      },
                      {
                        label: "Net",
                        value: point.moneyIn - point.moneyOut,
                        color: "var(--chart-foreground-muted)",
                      },
                    ]}
                  />
                </BarChart>
                <Legend
                  items={[
                    {
                      name: "Money in",
                      color: "var(--chart-line-primary)",
                      note: kes(flow.totalIn),
                    },
                    {
                      name: "Money out",
                      color: "var(--chart-line-secondary)",
                      note: kes(flow.totalOut),
                    },
                  ]}
                />
              </>
            )}

            {/* ---------------- Balance ---------------- */}
            {view === "balance" &&
              (balance.data.length < 2 ? (
                <Empty>
                  Need at least two days of activity to draw a trend.
                </Empty>
              ) : (
                <AreaChart data={balance.data} aspectRatio={aspect}>
                  <Grid horizontal />
                  <Area
                    dataKey="balance"
                    fill="var(--chart-line-primary)"
                    fillOpacity={0.3}
                    fadeEdges
                  />
                  <XAxis />
                  <ChartTooltip
                    rows={(point: any) => [
                      {
                        label: "Balance",
                        value: point.balance,
                        color: "var(--chart-line-primary)",
                      },
                    ]}
                  />
                </AreaChart>
              ))}

            {/* ---------------- Spending mix ---------------- */}
            {view === "mix" &&
              (mix.data.length === 0 ? (
                <Empty>No outgoing payments in this range.</Empty>
              ) : (
                <>
                  <BarChart
                    data={mix.data}
                    xDataKey="label"
                    stacked
                    stackGap={1}
                    aspectRatio={aspect}
                  >
                    <Grid horizontal />
                    {mix.series.map((s) => (
                      <Bar
                        key={s.key}
                        dataKey={s.key}
                        fill={s.color}
                        lineCap={3}
                      />
                    ))}
                    <BarXAxis />
                    <ChartTooltip
                      rows={(point: any) =>
                        mix.series.map((s) => ({
                          label: s.name,
                          value: point[s.key] ?? 0,
                          color: s.color,
                        }))
                      }
                    />
                  </BarChart>
                  <Legend
                    items={mix.series.map((s) => ({
                      name: s.name,
                      color: s.color,
                      note: mix.grand
                        ? `${((s.total / mix.grand) * 100).toFixed(0)}%`
                        : undefined,
                    }))}
                  />
                </>
              ))}

            {/* ---------------- Habits ---------------- */}
            {view === "habits" &&
              (habits.total === 0 ? (
                <Empty>No outgoing payments in this range.</Empty>
              ) : (
                <div className="grid gap-8 lg:grid-cols-2">
                  <div>
                    <p className="mb-1 text-sm font-medium">By weekday</p>
                    <BarChart
                      data={habits.week}
                      xDataKey="day"
                      aspectRatio={halfAspect}
                    >
                      <Grid horizontal />
                      <Bar
                        dataKey="spent"
                        fill="var(--chart-line-primary)"
                        lineCap="round"
                      />
                      <BarXAxis />
                      <ChartTooltip
                        rows={(point: any) => [
                          {
                            label: "Spent",
                            value: point.spent,
                            color: "var(--chart-line-primary)",
                          },
                        ]}
                      />
                    </BarChart>
                  </div>

                  <div>
                    <p className="mb-3 text-sm font-medium">By time of day</p>
                    <div className="grid grid-cols-[auto_repeat(7,minmax(0,1fr))] items-center gap-1 sm:gap-1.5">
                      <span />
                      {WEEKDAYS.map((d) => (
                        <span
                          key={d}
                          className="text-center text-[10px] text-muted-foreground sm:text-xs"
                        >
                          {isMobile ? d[0] : d}
                        </span>
                      ))}
                      {BLOCKS.map((b, bi) => (
                        <div key={b.label} className="contents">
                          <span className="pr-2 text-[10px] text-muted-foreground sm:text-xs">
                            {b.label}
                          </span>
                          {habits.grid[bi].map((v, di) => (
                            <div
                              key={di}
                              title={`${WEEKDAYS[di]} ${b.label.toLowerCase()} (${b.hint}): ${kes(v)}`}
                              className={cn(
                                "h-10 rounded-md sm:h-14",
                                v === 0 && "bg-muted/60",
                              )}
                              style={
                                v > 0
                                  ? {
                                      backgroundColor: `color-mix(in oklab, var(--chart-line-primary) ${Math.round(
                                        14 + 86 * (v / habits.max),
                                      )}%, transparent)`,
                                    }
                                  : undefined
                              }
                            />
                          ))}
                        </div>
                      ))}
                    </div>
                    <div className="mt-3 flex items-center justify-end gap-2 text-[11px] text-muted-foreground">
                      Less
                      {[14, 38, 62, 86, 100].map((p) => (
                        <span
                          key={p}
                          className="size-3 rounded-sm"
                          style={{
                            backgroundColor: `color-mix(in oklab, var(--chart-line-primary) ${p}%, transparent)`,
                          }}
                        />
                      ))}
                      More
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </>
      )}
    </div>
  );
}
