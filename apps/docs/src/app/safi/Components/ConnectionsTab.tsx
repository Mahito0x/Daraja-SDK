"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { ArrowDownLeft, ArrowUpRight, ChevronRight, Info } from "lucide-react";
import { useMemo, useState } from "react";
import type { MpesaTransaction } from "../data/data";

/* ------------------------------------------------------------------ */
/* Grouping: one entry per real person, across both directions         */
/* ------------------------------------------------------------------ */

export interface ConnectionTx {
  tx: MpesaTransaction;
  dir: "sent" | "received";
  amount: number;
  /** Charges that share this transaction's receipt number. */
  fee: number;
}

export interface Person {
  key: string;
  name: string;
  /** Masked number as printed on the statement, e.g. 0726***185. */
  phone: string | null;
  txs: ConnectionTx[];
}

/** One line in the Sent to / Received from lists. Same shape the Insights tab already reads. */
export interface ConnectionRow {
  key: string;
  name: string;
  phone: string | null;
  amount: number;
  count: number;
}

export interface Connections {
  topSent: ConnectionRow[];
  topReceived: ConnectionRow[];
  people: Record<string, Person>;
}

const SENT =
  /^customer (?:transfer to|payment to small business to)\s*-?\s*(.+)$/i;
const RECEIVED = /^funds received from\s*-?\s*(.+)$/i;

/** A charge line ends in "Charge"/"Fee" and names no counterparty. */
const isFeeLine = (details: string) => {
  const l = details.toLowerCase().trim();
  return (
    !/\b(?:to|from|at|by)\b\s*[-\d]/.test(l) &&
    /(?:charges?|fees?|excise duty)\.?$/.test(l)
  );
};

const tidy = (s: string) =>
  s
    .replace(/\s+/g, " ")
    .replace(/[\s.\-]+$/, "")
    .trim();

const titleCase = (s: string) =>
  s
    .toLowerCase()
    .replace(
      /(^|[\s\-/])([a-z\u00c0-\u024f])/g,
      (_, p: string, c: string) => p + c.toUpperCase(),
    );

/** 254726***185 and 0726***185 are the same number. */
const normalisePhone = (p: string) => {
  const t = p.replace(/^\+/, "");
  return t.startsWith("254") ? `0${t.slice(3)}` : t;
};

function splitPerson(rest: string) {
  const m = /^(\+?[\d*]{6,})\s*(.*)$/.exec(rest.trim());
  const phone = m ? normalisePhone(m[1]) : null;
  const raw = tidy(m ? m[2] : rest);
  return { phone, name: raw ? titleCase(raw) : (phone ?? "Unknown") };
}

const cents = (n: number) => Math.round(n * 100);

export function buildConnections(
  transactions: MpesaTransaction[],
): Connections {
  const feeByReceipt = new Map<string, number>();
  for (const tx of transactions) {
    if (tx.withdrawn > 0 && isFeeLine(tx.details)) {
      feeByReceipt.set(
        tx.receiptNo,
        (feeByReceipt.get(tx.receiptNo) ?? 0) + cents(tx.withdrawn),
      );
    }
  }

  const people = new Map<string, Person>();
  for (const tx of transactions) {
    const sent = tx.withdrawn > 0 ? SENT.exec(tx.details.trim()) : null;
    const received =
      !sent && tx.paidIn > 0 ? RECEIVED.exec(tx.details.trim()) : null;
    const match = sent ?? received;
    if (!match) continue;

    const { phone, name } = splitPerson(match[1]);
    const key = `${phone ?? "?"}|${name.toLowerCase()}`;
    const person = people.get(key) ?? { key, name, phone, txs: [] };
    person.txs.push({
      tx,
      dir: sent ? "sent" : "received",
      amount: sent ? tx.withdrawn : tx.paidIn,
      fee: sent ? (feeByReceipt.get(tx.receiptNo) ?? 0) / 100 : 0,
    });
    people.set(key, person);
  }

  const rows = (dir: "sent" | "received"): ConnectionRow[] =>
    [...people.values()]
      .map((p) => {
        const mine = p.txs.filter((t) => t.dir === dir);
        return {
          key: p.key,
          name: p.name,
          phone: p.phone,
          amount: mine.reduce((s, t) => s + cents(t.amount), 0) / 100,
          count: mine.length,
        };
      })
      .filter((r) => r.count > 0)
      .sort((a, b) => b.amount - a.amount);

  return {
    topSent: rows("sent"),
    topReceived: rows("received"),
    people: Object.fromEntries(people),
  };
}

/* ------------------------------------------------------------------ */
/* Formatting                                                          */
/* ------------------------------------------------------------------ */

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
const MONTHS_LONG = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

/** "2026-09-27 13:36:53" -> parts, read as printed (no timezone shifting). */
function when(s: string) {
  const [date = "", time = ""] = s.trim().split(/[ T]/);
  const [y, m, d] = date.split("-").map(Number);
  return { date, month: date.slice(0, 7), y, m, d, time: time.slice(0, 5) };
}
const fmtDay = (s: string) => {
  const w = when(s);
  return w.m >= 1 && w.m <= 12 ? `${w.d} ${MONTHS[w.m - 1]} ${w.y}` : s;
};
const monthTitle = (key: string) => {
  const [y, m] = key.split("-").map(Number);
  return m >= 1 && m <= 12 ? `${MONTHS_LONG[m - 1]} ${y}` : key;
};

const money = (n: number) =>
  n.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

const initials = (name: string) =>
  name
    .replace(/[^a-zA-Z\s]/g, " ")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("") || "#";

const IN = "text-emerald-700 dark:text-emerald-400";
const OUT = "text-rose-700 dark:text-rose-400";
const IN_CHIP = "bg-emerald-500/12 text-emerald-700 dark:text-emerald-400";
const OUT_CHIP = "bg-rose-500/12 text-rose-700 dark:text-rose-400";

/* ------------------------------------------------------------------ */
/* The detail modal                                                    */
/* ------------------------------------------------------------------ */

type Filter = "all" | "sent" | "received";
type Sort = "newest" | "oldest" | "largest";

function Stat({
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
          "mt-0.5 truncate text-sm font-semibold tabular-nums",
          tone === "in" && IN,
          tone === "out" && OUT,
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

function PersonBody({ person }: { person: Person }) {
  const [filter, setFilter] = useState<Filter>("all");
  const [sort, setSort] = useState<Sort>("newest");

  const stats = useMemo(() => {
    let sentC = 0;
    let recvC = 0;
    let sentN = 0;
    let recvN = 0;
    let feeC = 0;
    let largest: ConnectionTx | null = null;
    const months = new Map<string, { sent: number; received: number }>();
    for (const t of person.txs) {
      if (t.dir === "sent") {
        sentC += cents(t.amount);
        sentN++;
        feeC += cents(t.fee);
      } else {
        recvC += cents(t.amount);
        recvN++;
      }
      if (!largest || t.amount > largest.amount) largest = t;
      const k = when(t.tx.completionTime).month;
      const m = months.get(k) ?? { sent: 0, received: 0 };
      m[t.dir] += t.amount;
      months.set(k, m);
    }
    const times = person.txs.map((t) => t.tx.completionTime).sort();
    return {
      sent: sentC / 100,
      received: recvC / 100,
      sentN,
      recvN,
      net: (recvC - sentC) / 100,
      fees: feeC / 100,
      largest: largest as ConnectionTx | null,
      first: times[0] ?? "",
      last: times[times.length - 1] ?? "",
      months: [...months.entries()].sort(([a], [b]) => (a < b ? -1 : 1)),
    };
  }, [person]);

  const list = useMemo(() => {
    const rows = person.txs
      .map((t, i) => ({ ...t, i }))
      .filter((t) => filter === "all" || t.dir === filter);
    const by: Record<
      Sort,
      (a: (typeof rows)[number], b: (typeof rows)[number]) => number
    > = {
      newest: (a, b) =>
        a.tx.completionTime < b.tx.completionTime
          ? 1
          : a.tx.completionTime > b.tx.completionTime
            ? -1
            : a.i - b.i,
      oldest: (a, b) =>
        a.tx.completionTime > b.tx.completionTime
          ? 1
          : a.tx.completionTime < b.tx.completionTime
            ? -1
            : b.i - a.i,
      largest: (a, b) =>
        b.amount - a.amount ||
        (a.tx.completionTime < b.tx.completionTime ? 1 : -1),
    };
    return rows.sort(by[sort]);
  }, [person, filter, sort]);

  /** Date sorts are grouped by month; "largest" is one flat list. */
  const groups = useMemo(() => {
    if (sort === "largest") return [{ key: "", rows: list }];
    const map = new Map<string, typeof list>();
    for (const r of list) {
      const k = when(r.tx.completionTime).month;
      map.set(k, [...(map.get(k) ?? []), r]);
    }
    return [...map.entries()].map(([key, rows]) => ({ key, rows }));
  }, [list, sort]);

  const maxMonth = Math.max(
    1,
    ...stats.months.flatMap(([, m]) => [m.sent, m.received]),
  );
  const count = person.txs.length;

  return (
    <>
      <DialogHeader className="space-y-0 border-b p-5 pr-12 text-left">
        <div className="flex items-center gap-3">
          <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
            {initials(person.name)}
          </div>
          <div className="min-w-0">
            <DialogTitle className="truncate text-lg font-semibold tracking-tight">
              {person.name}
            </DialogTitle>
            <DialogDescription className="mt-0.5 text-xs">
              {person.phone ? `${person.phone} · ` : ""}
              {count} {count === 1 ? "transaction" : "transactions"} in this
              date range
            </DialogDescription>
          </div>
        </div>
      </DialogHeader>

      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="space-y-4 p-5">
          <div className="grid grid-cols-2 gap-2">
            <Stat
              label="You sent"
              value={`KES ${money(stats.sent)}`}
              sub={`${stats.sentN} ${stats.sentN === 1 ? "time" : "times"}`}
              tone={stats.sentN ? "out" : undefined}
            />
            <Stat
              label="You received"
              value={`KES ${money(stats.received)}`}
              sub={`${stats.recvN} ${stats.recvN === 1 ? "time" : "times"}`}
              tone={stats.recvN ? "in" : undefined}
            />
            <Stat
              label="Net with them"
              value={`${stats.net < 0 ? "-" : stats.net > 0 ? "+" : ""}KES ${money(Math.abs(stats.net))}`}
              sub={
                stats.net < 0
                  ? "You've sent more"
                  : stats.net > 0
                    ? "You've received more"
                    : "Even"
              }
              tone={stats.net < 0 ? "out" : stats.net > 0 ? "in" : undefined}
            />
            <Stat
              label="Fees paid"
              value={`KES ${money(stats.fees)}`}
              sub="On what you sent"
            />
          </div>

          <p className="text-xs leading-relaxed text-muted-foreground">
            {fmtDay(stats.first)}
            {stats.first.slice(0, 10) !== stats.last.slice(0, 10) &&
              ` to ${fmtDay(stats.last)}`}
            {stats.largest && (
              <>
                {" · "}Largest:{" "}
                <span className="font-medium text-foreground tabular-nums">
                  KES {money(stats.largest.amount)}
                </span>{" "}
                {stats.largest.dir}
              </>
            )}
          </p>

          {stats.months.length > 1 && (
            <div>
              <p className="mb-2 text-xs font-medium">By month</p>
              <div className="flex items-end gap-1.5">
                {stats.months.map(([key, m]) => (
                  <div
                    key={key}
                    className="flex min-w-0 flex-1 flex-col items-center gap-1.5"
                  >
                    <div
                      className="flex h-14 w-full items-end justify-center gap-0.5"
                      title={`${monthTitle(key)}: sent KES ${money(m.sent)}, received KES ${money(m.received)}`}
                    >
                      <div
                        className="w-full max-w-3 rounded-t-sm bg-emerald-500"
                        style={{
                          height: `${(m.received / maxMonth) * 100}%`,
                          minHeight: m.received ? 3 : 0,
                        }}
                      />
                      <div
                        className="w-full max-w-3 rounded-t-sm bg-rose-500"
                        style={{
                          height: `${(m.sent / maxMonth) * 100}%`,
                          minHeight: m.sent ? 3 : 0,
                        }}
                      />
                    </div>
                    <span className="text-[10px] text-muted-foreground">
                      {MONTHS[Number(key.slice(5, 7)) - 1]}
                    </span>
                  </div>
                ))}
              </div>
              <div className="mt-2 flex items-center gap-4 text-[11px] text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <span className="size-2 rounded-full bg-emerald-500" />{" "}
                  Received
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="size-2 rounded-full bg-rose-500" /> Sent
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Controls */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-y bg-muted/20 px-5 py-2.5">
          <div className="flex items-center gap-1">
            {(
              [
                ["all", `All ${count}`],
                ["sent", `Sent ${stats.sentN}`],
                ["received", `Received ${stats.recvN}`],
              ] as const
            ).map(([key, label]) => (
              <Button
                key={key}
                type="button"
                size="sm"
                variant={filter === key ? "default" : "outline"}
                disabled={
                  key !== "all" &&
                  (key === "sent" ? !stats.sentN : !stats.recvN)
                }
                onClick={() => setFilter(key)}
                aria-pressed={filter === key}
                className="h-7 rounded-full px-3 text-xs"
              >
                {label}
              </Button>
            ))}
          </div>
          <div className="flex items-center gap-1 rounded-lg bg-muted p-0.5">
            {(
              [
                ["newest", "Newest"],
                ["oldest", "Oldest"],
                ["largest", "Largest"],
              ] as const
            ).map(([key, label]) => (
              <Button
                key={key}
                type="button"
                size="sm"
                variant={sort === key ? "default" : "ghost"}
                onClick={() => setSort(key)}
                aria-pressed={sort === key}
                className="h-6 px-2.5 text-[11px]"
              >
                {label}
              </Button>
            ))}
          </div>
        </div>

        {/* Transactions */}
        <div>
          {groups.map((g) => {
            const total =
              g.rows.reduce(
                (s, r) =>
                  s +
                  (r.dir === "received" ? cents(r.amount) : -cents(r.amount)),
                0,
              ) / 100;
            return (
              <section key={g.key || "flat"}>
                {g.key && (
                  <div className="sticky top-0 z-10 flex items-center justify-between border-b bg-background/95 px-5 py-2 text-xs backdrop-blur">
                    <span className="font-medium">{monthTitle(g.key)}</span>
                    <span className="tabular-nums text-muted-foreground">
                      {g.rows.length} · net{" "}
                      <span
                        className={cn(
                          "font-medium",
                          total < 0 ? OUT : total > 0 ? IN : "",
                        )}
                      >
                        {total < 0 ? "-" : total > 0 ? "+" : ""}
                        {money(Math.abs(total))}
                      </span>
                    </span>
                  </div>
                )}
                <ul className="divide-y divide-border/50">
                  {g.rows.map((r) => {
                    const w = when(r.tx.completionTime);
                    const isIn = r.dir === "received";
                    return (
                      <li
                        key={`${r.tx.receiptNo}-${r.i}`}
                        className="flex gap-3 px-5 py-3.5"
                      >
                        <div
                          className={cn(
                            "flex size-9 shrink-0 items-center justify-center rounded-xl",
                            isIn ? IN_CHIP : OUT_CHIP,
                          )}
                        >
                          {isIn ? (
                            <ArrowDownLeft className="size-4" />
                          ) : (
                            <ArrowUpRight className="size-4" />
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium">
                            {fmtDay(r.tx.completionTime)}
                            <span className="ml-2 text-xs font-normal text-muted-foreground tabular-nums">
                              {w.time}
                            </span>
                          </p>
                          <p className="mt-0.5 text-xs text-muted-foreground">
                            {isIn ? "Received" : "Sent"} ·{" "}
                            <span className="font-mono">{r.tx.receiptNo}</span>
                          </p>
                          <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                            <Badge
                              variant="outline"
                              className="h-5 gap-1.5 px-2 text-[10px] font-normal"
                            >
                              <span
                                className={cn(
                                  "size-1.5 rounded-full",
                                  /complet/i.test(r.tx.status)
                                    ? "bg-emerald-500"
                                    : "bg-amber-500",
                                )}
                              />
                              {r.tx.status}
                            </Badge>
                            {r.fee > 0 && (
                              <span
                                className={cn("text-[11px] tabular-nums", OUT)}
                              >
                                + KES {money(r.fee)} fee
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="shrink-0 text-right">
                          <p
                            className={cn(
                              "text-sm font-semibold tabular-nums",
                              isIn ? IN : OUT,
                            )}
                          >
                            {isIn ? "+" : "-"}
                            {money(r.amount)}
                          </p>
                          <p className="mt-1 text-[11px] tabular-nums text-muted-foreground">
                            Bal {money(r.tx.balance)}
                          </p>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </section>
            );
          })}
          {list.length === 0 && (
            <p className="py-12 text-center text-sm text-muted-foreground">
              No transactions to show.
            </p>
          )}
        </div>
      </div>
    </>
  );
}

/* ------------------------------------------------------------------ */
/* The tab                                                             */
/* ------------------------------------------------------------------ */

export function ConnectionsTab({ connections }: { connections: Connections }) {
  const [mode, setMode] = useState<"sent" | "received">("sent");
  const [open, setOpen] = useState(false);
  // Kept after closing so the modal's content doesn't vanish mid-animation.
  const [activeKey, setActiveKey] = useState<string | null>(null);

  const rows = mode === "sent" ? connections.topSent : connections.topReceived;
  const max = Math.max(1, ...rows.map((r) => r.amount));
  const person = activeKey ? (connections.people[activeKey] ?? null) : null;
  const sent = mode === "sent";

  return (
    <section className="rounded-2xl border bg-card p-5 sm:p-6">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-semibold tracking-tight">
              Your connections
            </h2>
            <Tooltip>
              <TooltipTrigger
                aria-label="About your connections"
                className="cursor-help rounded-full text-muted-foreground outline-none transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/60"
              >
                <Info className="size-3.5" />
              </TooltipTrigger>
              <TooltipContent
                side="top"
                className="max-w-64 text-pretty text-xs leading-relaxed"
              >
                People you sent money to or received it from, ranked by total
                amount. Tap anyone to see every transaction with them, in both
                directions.
              </TooltipContent>
            </Tooltip>
          </div>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Tap a person to see every transaction with them
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-1 rounded-lg bg-muted p-1">
          <Button
            variant={sent ? "default" : "ghost"}
            size="sm"
            onClick={() => setMode("sent")}
            className="h-7 px-3 text-xs"
          >
            Sent to
          </Button>
          <Button
            variant={!sent ? "default" : "ghost"}
            size="sm"
            onClick={() => setMode("received")}
            className="h-7 px-3 text-xs"
          >
            Received from
          </Button>
        </div>
      </div>

      <div className="mt-5">
        {rows.length === 0 ? (
          <p className="py-12 text-center text-sm text-muted-foreground">
            {sent
              ? "No outgoing transfers in this period."
              : "No incoming funds from people in this period."}
          </p>
        ) : (
          <ul className="grid gap-3 md:grid-cols-2">
            {rows.map((c, i) => (
              <li key={c.key}>
                <button
                  type="button"
                  onClick={() => {
                    setActiveKey(c.key);
                    setOpen(true);
                  }}
                  aria-label={`${c.name}: see all transactions`}
                  className="group relative w-full overflow-hidden rounded-xl border bg-muted/20 p-3.5 text-left outline-none transition-colors hover:bg-muted/40 focus-visible:ring-2 focus-visible:ring-ring/60"
                >
                  <div
                    aria-hidden
                    className={cn(
                      "absolute inset-y-0 left-0 opacity-[0.07]",
                      sent ? "bg-rose-500" : "bg-emerald-500",
                    )}
                    style={{ width: `${(c.amount / max) * 100}%` }}
                  />
                  <div className="relative flex items-center gap-3">
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                      {initials(c.name)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{c.name}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        #{i + 1} · {c.count}{" "}
                        {c.count === 1 ? "transaction" : "transactions"}
                        {c.phone ? ` · ${c.phone}` : ""}
                      </p>
                    </div>
                    <p
                      className={cn(
                        "shrink-0 text-sm font-semibold tabular-nums",
                        sent ? OUT : IN,
                      )}
                    >
                      {sent ? "-" : "+"}
                      {money(c.amount)}
                    </p>
                    <ChevronRight className="size-4 shrink-0 text-muted-foreground/60 transition-transform group-hover:translate-x-0.5" />
                  </div>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="flex max-h-[calc(100dvh-2rem)] w-[calc(100%-1.5rem)] flex-col gap-0 overflow-hidden p-0 sm:max-w-lg">
          {person ? (
            <PersonBody key={person.key} person={person} />
          ) : (
            <DialogHeader className="p-5">
              <DialogTitle>Connection</DialogTitle>
              <DialogDescription>
                Nothing to show for this person in the selected range.
              </DialogDescription>
            </DialogHeader>
          )}
        </DialogContent>
      </Dialog>
    </section>
  );
}
