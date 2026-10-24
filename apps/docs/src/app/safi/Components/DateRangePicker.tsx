"use client";

import type { Transition, Variants } from "framer-motion";
import {
  AnimatePresence,
  animate,
  motion,
  useIsPresent,
  useMotionValue,
  useReducedMotion,
  useTransform,
} from "framer-motion";
import {
  CalendarDays,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import type {
  CSSProperties,
  FocusEvent as ReactFocusEvent,
  KeyboardEvent as ReactKeyboardEvent,
  ReactNode,
} from "react";
import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/* -------------------------------------------------------------------------- */
/* Public API                                                                 */
/* -------------------------------------------------------------------------- */

/** An inclusive range of whole days. */
export interface DateRange {
  start: Date;
  end: Date;
}

/** A shortcut in the preset rail. `range` receives the viewer's local today. */
export interface DateRangePreset {
  label: string;
  range: (today: Date) => DateRange;
}

/**
 * A range picker whose trigger grows into the panel it opens. Two months sit
 * beside a preset rail, or one month with a scrolling preset row when space is
 * tight. The highlight stretches across each week as you hover or use the
 * keyboard, the range ends glide between days, months slide the way you travel,
 * and on Apply the label flies back into the trigger as the surface shrinks.
 */
export interface DateRangePickerProps {
  /** Controlled value. Pass `null` for no selection. */
  value?: DateRange | null;
  /** Uncontrolled starting value. */
  defaultValue?: DateRange | null;
  /** Called with the applied range. */
  onChange?: (range: DateRange | null) => void;
  /** Accessible name of the trigger and the dialog. */
  label?: string;
  placeholder?: string;
  presets?: DateRangePreset[];
  /** Earliest / latest selectable day. Days outside are disabled. */
  minDate?: Date;
  maxDate?: Date;
  /** Days to mark with a small dot, as "YYYY-MM-DD" keys (e.g. days with transactions). */
  markedDays?: ReadonlySet<string>;
  /** 0 is Sunday, 1 is Monday. */
  weekStartsOn?: 0 | 1;
  locale?: string;
  /** Force one or two months. `auto` picks two when there is room. */
  months?: "auto" | 1 | 2;
  /** The element the panel should stay inside. Defaults to the viewport. */
  boundary?: () => HTMLElement | null;
  className?: string;
}

/* -------------------------------------------------------------------------- */
/* Date helpers                                                               */
/* -------------------------------------------------------------------------- */

const DAY = 864e5;
const startOfDay = (d: Date) =>
  new Date(d.getFullYear(), d.getMonth(), d.getDate());
const monthStart = (d: Date) => new Date(d.getFullYear(), d.getMonth(), 1);
const monthEnd = (d: Date) => new Date(d.getFullYear(), d.getMonth() + 1, 0);
const addDays = (d: Date, n: number) =>
  new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
const addMonths = (d: Date, n: number) =>
  new Date(d.getFullYear(), d.getMonth() + n, 1);
const shiftMonths = (d: Date, n: number) =>
  new Date(
    d.getFullYear(),
    d.getMonth() + n,
    Math.min(
      d.getDate(),
      new Date(d.getFullYear(), d.getMonth() + n + 1, 0).getDate(),
    ),
  );
const dayDiff = (a: Date, b: Date) =>
  Math.round((startOfDay(a).getTime() - startOfDay(b).getTime()) / DAY);
const monthDiff = (a: Date, b: Date) =>
  (a.getFullYear() - b.getFullYear()) * 12 + a.getMonth() - b.getMonth();
const sameDay = (a?: Date | null, b?: Date | null) =>
  Boolean(a && b && dayDiff(a, b) === 0);
const keyOf = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const fromKey = (key: string) => {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y!, m! - 1, d!);
};
const ordered = (a: Date, b: Date): DateRange =>
  dayDiff(a, b) <= 0 ? { start: a, end: b } : { start: b, end: a };
const sameRange = (a?: DateRange | null, b?: DateRange | null) =>
  Boolean(a && b && sameDay(a.start, b.start) && sameDay(a.end, b.end));
const clampDate = (d: Date, min?: Date, max?: Date) =>
  min && dayDiff(d, min) < 0
    ? startOfDay(min)
    : max && dayDiff(d, max) > 0
      ? startOfDay(max)
      : d;

export const defaultDateRangePresets: DateRangePreset[] = [
  { label: "Today", range: (t) => ({ start: t, end: t }) },
  {
    label: "Yesterday",
    range: (t) => ({ start: addDays(t, -1), end: addDays(t, -1) }),
  },
  { label: "Last 7 days", range: (t) => ({ start: addDays(t, -6), end: t }) },
  { label: "Last 30 days", range: (t) => ({ start: addDays(t, -29), end: t }) },
  { label: "This month", range: (t) => ({ start: monthStart(t), end: t }) },
  {
    label: "Last month",
    range: (t) => ({
      start: addMonths(t, -1),
      end: monthEnd(addMonths(t, -1)),
    }),
  },
  {
    label: "This quarter",
    range: (t) => ({
      start: new Date(t.getFullYear(), Math.floor(t.getMonth() / 3) * 3, 1),
      end: t,
    }),
  },
  {
    label: "Year to date",
    range: (t) => ({ start: new Date(t.getFullYear(), 0, 1), end: t }),
  },
];

/**
 * Presets for data that has a fixed span, like a statement. Everything is
 * measured back from the last day of the data (not from today) and clipped to
 * the span, so "Last 30 days" always lands on days that actually exist.
 */
export function createCoveragePresets(
  minDate: Date,
  maxDate: Date,
): DateRangePreset[] {
  const lo = startOfDay(minDate);
  const hi = startOfDay(maxDate);
  const clip = (start: Date, end: Date): DateRange => ({
    start: clampDate(start, lo, hi),
    end: clampDate(end, lo, hi),
  });
  const latest = monthStart(hi);
  const previous = addMonths(latest, -1);
  return [
    { label: "Full statement", range: () => ({ start: lo, end: hi }) },
    { label: "Last 7 days", range: () => clip(addDays(hi, -6), hi) },
    { label: "Last 30 days", range: () => clip(addDays(hi, -29), hi) },
    { label: "Last 90 days", range: () => clip(addDays(hi, -89), hi) },
    { label: "Latest month", range: () => clip(latest, monthEnd(latest)) },
    {
      label: "Previous month",
      range: () => clip(previous, monthEnd(previous)),
    },
  ];
}

/* -------------------------------------------------------------------------- */
/* Hooks                                                                      */
/* -------------------------------------------------------------------------- */

/**
 * The viewer's local date. `null` on the server and the first client render, so
 * markup matches during hydration; it updates itself when midnight passes.
 */
function useToday() {
  const [today, setToday] = useState<Date | null>(null);
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    const tick = () => {
      const now = new Date();
      setToday(startOfDay(now));
      const next = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate() + 1,
        0,
        0,
        1,
      );
      timer = setTimeout(tick, next.getTime() - now.getTime());
    };
    tick();
    return () => clearTimeout(timer);
  }, []);
  return today;
}

const noop = () => () => {};
/** Reduced-motion preference, false until hydrated so server and client agree. */
function useReducedFlag() {
  const hydrated = useSyncExternalStore(
    noop,
    () => true,
    () => false,
  );
  return !!useReducedMotion() && hydrated;
}

/** Remembers which way a range moved, so labels roll in time's direction. */
function useDirection(range: DateRange | null) {
  const time = range ? range.start.getTime() * 2 + range.end.getTime() : null;
  const [previous, setPrevious] = useState(time);
  const [direction, setDirection] = useState(1);
  if (time !== previous) {
    setPrevious(time);
    setDirection(
      time === null || previous === null || time >= previous ? 1 : -1,
    );
  }
  return direction;
}

/* -------------------------------------------------------------------------- */
/* Motion tokens                                                              */
/* -------------------------------------------------------------------------- */

type Bezier = [number, number, number, number];
type Size = { w: number; h: number };

const BLUR = { subtle: 2, soft: 4 };
const ENTER_EASE: Bezier = [0.16, 1, 0.3, 1];
const STANDARD_EASE: Bezier = [0.4, 0, 0.2, 1];

/** Duration springs restated as stiffness and damping, so retargets keep their velocity. */
const physical = (visualDuration: number, bounce: number): Transition => {
  const root = (2 * Math.PI) / (visualDuration * 1.2);
  return {
    type: "spring",
    stiffness: root * root,
    damping: 2 * (1 - bounce) * root,
    mass: 1,
  };
};
const GROW = physical(0.48, 0);
const SHRINK = physical(0.38, 0);
const STRETCH = physical(0.3, 0);
const GLIDE = physical(0.3, 0);
const SLIDE = physical(0.4, 0);
const MORPH = physical(0.42, 0);

const TRIGGER_RADIUS = 8;
const PANEL_RADIUS = 14;
const WIDE_CELL = 36;
const WIDE_MIN = 712;
const EDGE = 8;

const roll: Variants = {
  enter: (d: number) => ({
    opacity: 0,
    y: `${d * 0.45}em`,
    filter: `blur(${BLUR.subtle}px)`,
  }),
  center: {
    opacity: 1,
    y: "0em",
    filter: "blur(0px)",
    transition: { duration: 0.26, ease: ENTER_EASE },
  },
  exit: (d: number) => ({
    opacity: 0,
    y: `${d * -0.45}em`,
    filter: `blur(${BLUR.subtle}px)`,
    transition: { duration: 0.14, ease: STANDARD_EASE },
  }),
};
const fade: Variants = {
  enter: { opacity: 0 },
  center: {
    opacity: 1,
    y: "0em",
    filter: "blur(0px)",
    transition: { duration: 0.12 },
  },
  exit: { opacity: 0, transition: { duration: 0.08 } },
};
/** Panel content arrives just behind the growing surface and leaves ahead of it. */
const faceIn: Variants = {
  hidden: { opacity: 0, y: -4, filter: `blur(${BLUR.soft}px)` },
  shown: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { duration: 0.26, ease: ENTER_EASE, delay: 0.07 },
  },
  gone: {
    opacity: 0,
    y: -2,
    filter: `blur(${BLUR.soft}px)`,
    transition: { duration: 0.12, ease: STANDARD_EASE },
  },
};
const faceFade: Variants = {
  hidden: { opacity: 0 },
  shown: { opacity: 1, transition: { duration: 0.12 } },
  gone: { opacity: 0, transition: { duration: 0.08 } },
};
const slide: Variants = {
  enter: (d: number) => ({ opacity: 0, x: d * 48 }),
  center: {
    opacity: 1,
    x: 0,
    transition: { x: SLIDE, opacity: { duration: 0.22, ease: ENTER_EASE } },
  },
  exit: (d: number) => ({
    opacity: 0,
    x: d * -36,
    transition: { x: SLIDE, opacity: { duration: 0.14, ease: STANDARD_EASE } },
  }),
};

/* -------------------------------------------------------------------------- */
/* Small animated pieces                                                      */
/* -------------------------------------------------------------------------- */

/** Words roll one by one: a later date rises from below, an earlier one drops from above. */
function Rolling({
  text,
  direction,
  reduced,
}: {
  text: string;
  direction: number;
  reduced: boolean;
}) {
  const words = text.split(/\s+/).filter(Boolean);
  return (
    <span
      className="inline-flex gap-[0.28em] whitespace-nowrap"
      aria-hidden="true"
    >
      {words.map((word, index) => (
        <span key={index} className="relative inline-block">
          <AnimatePresence initial={false} mode="popLayout" custom={direction}>
            <motion.span
              key={word}
              className="inline-block"
              custom={direction}
              variants={reduced ? fade : roll}
              initial="enter"
              animate="center"
              exit="exit"
            >
              {word}
            </motion.span>
          </AnimatePresence>
        </span>
      ))}
    </span>
  );
}

type Segment = { left: number; width: number } | null;
const cellIn = (date: Date, first: Date) => {
  const index = dayDiff(date, first);
  return { row: Math.floor(index / 7), col: index % 7 };
};

/** One week's slice of the highlight. It grows from the edge the range arrives from. */
function Bar({
  row,
  segment,
  reduced,
}: {
  row: number;
  segment: Segment;
  reduced: boolean;
}) {
  const left = useMotionValue(segment?.left ?? 0);
  const width = useMotionValue(segment?.width ?? 0);
  const opacity = useMotionValue(segment ? 1 : 0);
  const leftPct = useTransform(left, (v) => `${v}%`);
  const widthPct = useTransform(width, (v) => `${v}%`);
  const wasEmpty = useRef(!segment);

  useLayoutEffect(() => {
    if (!segment) {
      wasEmpty.current = true;
      animate(opacity, 0, { duration: reduced ? 0 : 0.14 });
      return;
    }
    if (wasEmpty.current || reduced) {
      left.jump(segment.left);
      width.jump(segment.width);
    } else {
      animate(left, segment.left, STRETCH);
      animate(width, segment.width, STRETCH);
    }
    wasEmpty.current = false;
    animate(opacity, 1, { duration: reduced ? 0 : 0.16 });
  }, [left, opacity, reduced, segment, width]);

  return (
    <motion.span
      className="absolute rounded-full bg-primary/15"
      style={{
        left: leftPct,
        width: widthPct,
        opacity,
        top: `calc(${row} * var(--cell) + 3px)`,
        height: "calc(var(--cell) - 6px)",
      }}
    />
  );
}

/** A solid end of the range. It glides from day to day and fades when it leaves this month. */
function Thumb({
  cell,
  reduced,
}: {
  cell: { row: number; col: number } | null;
  reduced: boolean;
}) {
  const x = useMotionValue(cell?.col ?? 0);
  const y = useMotionValue(cell?.row ?? 0);
  const opacity = useMotionValue(cell ? 1 : 0);
  const scale = useMotionValue(cell ? 1 : 0.8);
  const transform = useTransform(
    () =>
      `translate(${x.get() * 100}%, ${y.get() * 100}%) scale(${scale.get()})`,
  );
  const hidden = useRef(!cell);

  useLayoutEffect(() => {
    if (!cell) {
      hidden.current = true;
      animate(opacity, 0, { duration: reduced ? 0 : 0.12 });
      animate(scale, 0.8, { duration: reduced ? 0 : 0.12 });
      return;
    }
    if (hidden.current || reduced) {
      x.jump(cell.col);
      y.jump(cell.row);
    } else {
      animate(x, cell.col, GLIDE);
      animate(y, cell.row, GLIDE);
    }
    hidden.current = false;
    animate(opacity, 1, { duration: reduced ? 0 : 0.16 });
    animate(scale, 1, reduced ? { duration: 0 } : GLIDE);
  }, [cell, opacity, reduced, scale, x, y]);

  return (
    <motion.span
      className="absolute left-0 top-0 h-[var(--cell)] w-[var(--cell)] after:absolute after:inset-[3px] after:rounded-full after:bg-primary after:content-['']"
      style={{ transform, opacity }}
    />
  );
}

/* -------------------------------------------------------------------------- */
/* One month                                                                  */
/* -------------------------------------------------------------------------- */

interface MonthProps {
  month: Date;
  range: DateRange | null;
  tabbable: string;
  today?: Date;
  minDate?: Date;
  maxDate?: Date;
  marked?: ReadonlySet<string>;
  weekStartsOn: 0 | 1;
  reduced: boolean;
  formatters: {
    title: Intl.DateTimeFormat;
    day: Intl.DateTimeFormat;
    weekday: Intl.DateTimeFormat;
    weekdayLong: Intl.DateTimeFormat;
  };
  onPick: (date: Date) => void;
  onHover: (date: Date) => void;
  onKey: (event: ReactKeyboardEvent<HTMLButtonElement>, date: Date) => void;
  onFocusDay: (date: Date) => void;
  idBase: string;
}

function Month({
  month,
  range,
  tabbable,
  today,
  minDate,
  maxDate,
  marked,
  weekStartsOn,
  reduced,
  formatters,
  onPick,
  onHover,
  onKey,
  onFocusDay,
  idBase,
}: MonthProps) {
  const first = useMemo(
    () => addDays(month, -((month.getDay() - weekStartsOn + 7) % 7)),
    [month, weekStartsOn],
  );
  const rows = useMemo(
    () =>
      Array.from({ length: 6 }, (_, row) =>
        Array.from({ length: 7 }, (_, col) => addDays(first, row * 7 + col)),
      ),
    [first],
  );
  const titleId = `${idBase}-${keyOf(month)}`;
  const inMonth = (date: Date) => monthDiff(date, month) === 0;

  const lo = range?.start;
  const hi = range?.end;
  const loKey = lo ? keyOf(lo) : "";
  const hiKey = hi ? keyOf(hi) : "";

  /** Each week's slice of the range, in percent of the row. */
  const segments = useMemo<Segment[]>(() => {
    if (!loKey || !hiKey) return rows.map(() => null);
    const start = fromKey(loKey);
    const end = fromKey(hiKey);
    const unit = 100 / 7;
    const colOf = (date: Date) => dayDiff(date, first) % 7;
    return rows.map((row) => {
      const days = row.filter((date) => monthDiff(date, month) === 0);
      if (!days.length) return null;
      const rowFirst = days[0]!;
      const rowLast = days[days.length - 1]!;
      const from = dayDiff(start, rowFirst) > 0 ? start : rowFirst;
      const to = dayDiff(end, rowLast) < 0 ? end : rowLast;
      if (dayDiff(from, to) <= 0) {
        const a = colOf(from);
        const b = colOf(to);
        return { left: a * unit, width: (b - a + 1) * unit };
      }
      // Week sits wholly before or after the range: collapse at the edge it would grow from.
      if (dayDiff(rowLast, start) < 0)
        return { left: (colOf(rowLast) + 1) * unit, width: 0 };
      return { left: colOf(rowFirst) * unit, width: 0 };
    });
  }, [first, hiKey, loKey, month, rows]);

  const startCell = useMemo(
    () =>
      loKey && monthDiff(fromKey(loKey), month) === 0
        ? cellIn(fromKey(loKey), first)
        : null,
    [loKey, month, first],
  );
  const endCell = useMemo(
    () =>
      hiKey && hiKey !== loKey && monthDiff(fromKey(hiKey), month) === 0
        ? cellIn(fromKey(hiKey), first)
        : null,
    [hiKey, loKey, month, first],
  );

  return (
    <div className="flex w-[calc(var(--cell)*7)] flex-col">
      <p
        id={titleId}
        className="flex h-7 items-center justify-center text-sm font-medium"
      >
        {formatters.title.format(month)}
      </p>
      <div role="grid" aria-labelledby={titleId}>
        <div
          role="row"
          className="grid h-8 grid-cols-7 items-center text-center text-xs text-muted-foreground"
        >
          {rows[0]!.map((date) => (
            <span
              key={date.getDay()}
              role="columnheader"
              aria-label={formatters.weekdayLong.format(date)}
            >
              {formatters.weekday.format(date).slice(0, 2)}
            </span>
          ))}
        </div>
        <div className="relative">
          <span
            className="pointer-events-none absolute inset-0 z-0"
            aria-hidden="true"
          >
            {segments.map((segment, row) => (
              <Bar key={row} row={row} segment={segment} reduced={reduced} />
            ))}
            <Thumb cell={startCell} reduced={reduced} />
            <Thumb cell={endCell} reduced={reduced} />
          </span>
          {rows.map((row, index) => (
            <div
              key={index}
              role="row"
              className="relative z-10 grid h-[var(--cell)] grid-cols-7"
            >
              {row.map((date) => {
                if (!inMonth(date)) {
                  return <span key={keyOf(date)} role="gridcell" />;
                }
                const key = keyOf(date);
                const disabled = Boolean(
                  (minDate && dayDiff(date, minDate) < 0) ||
                  (maxDate && dayDiff(date, maxDate) > 0),
                );
                const inRange = Boolean(
                  lo && hi && dayDiff(date, lo) >= 0 && dayDiff(date, hi) <= 0,
                );
                const edge = sameDay(date, lo) || sameDay(date, hi);
                const isToday = sameDay(date, today);
                return (
                  <span
                    key={key}
                    role="gridcell"
                    aria-selected={inRange}
                    className="p-[3px]"
                  >
                    <button
                      type="button"
                      data-date={key}
                      data-edge={edge || undefined}
                      data-range={inRange || undefined}
                      data-today={isToday || undefined}
                      tabIndex={key === tabbable ? 0 : -1}
                      disabled={disabled}
                      aria-current={isToday ? "date" : undefined}
                      aria-label={formatters.day.format(date)}
                      onClick={() => onPick(date)}
                      onPointerEnter={() => {
                        if (!disabled) onHover(date);
                      }}
                      onFocus={() => onFocusDay(date)}
                      onKeyDown={(event) => onKey(event, date)}
                      className={cn(
                        "relative flex size-full items-center justify-center rounded-full text-sm tabular-nums outline-none transition-colors",
                        "hover:bg-accent focus-visible:ring-[3px] focus-visible:ring-ring/50",
                        "data-[edge]:text-primary-foreground data-[edge]:hover:bg-transparent",
                        "data-[today]:font-semibold data-[today]:underline data-[today]:underline-offset-4",
                        "disabled:pointer-events-none disabled:opacity-30",
                      )}
                    >
                      <span>{date.getDate()}</span>
                      {marked?.has(key) && (
                        <span
                          aria-hidden="true"
                          className="absolute bottom-[3px] size-1 rounded-full bg-current opacity-60"
                        />
                      )}
                    </button>
                  </span>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/** The visible months travel together; a leaving set turns inert so focus only finds the current one. */
function Months({
  children,
  direction,
  reduced,
}: {
  children: ReactNode;
  direction: number;
  reduced: boolean;
}) {
  const present = useIsPresent();
  return (
    <motion.div
      className="flex gap-4"
      data-current={present || undefined}
      inert={!present || undefined}
      custom={direction}
      variants={reduced ? fade : slide}
      initial="enter"
      animate="center"
      exit="exit"
    >
      {children}
    </motion.div>
  );
}

/* -------------------------------------------------------------------------- */
/* Picker                                                                     */
/* -------------------------------------------------------------------------- */

export function DateRangePicker({
  value,
  defaultValue = null,
  onChange,
  label = "Date range",
  placeholder = "Select dates",
  presets = defaultDateRangePresets,
  minDate,
  maxDate,
  markedDays,
  weekStartsOn = 0,
  locale = "en-US",
  months = "auto",
  boundary,
  className,
}: DateRangePickerProps) {
  const reduced = useReducedFlag();
  const today = useToday();
  const uid = useId();
  const [inner, setInner] = useState<DateRange | null>(defaultValue);
  const committed = value !== undefined ? value : inner;

  const [open, setOpen] = useState(false);
  const [compact, setCompact] = useState(false);
  const [panelWidth, setPanelWidth] = useState(0);
  const [view, setView] = useState<Date>(() =>
    monthStart(committed?.end ?? maxDate ?? new Date(2000, 0, 1)),
  );
  const [direction, setDirection] = useState(1);
  const [draft, setDraft] = useState<DateRange | null>(committed);
  const [anchor, setAnchor] = useState<Date | null>(null);
  const [hover, setHover] = useState<Date | null>(null);
  const [focusKey, setFocusKey] = useState("");

  const formatters = useMemo(
    () => ({
      label: new Intl.DateTimeFormat(locale, {
        month: "short",
        day: "numeric",
        year: "numeric",
      }),
      title: new Intl.DateTimeFormat(locale, {
        month: "long",
        year: "numeric",
      }),
      day: new Intl.DateTimeFormat(locale, {
        weekday: "long",
        month: "long",
        day: "numeric",
        year: "numeric",
      }),
      weekday: new Intl.DateTimeFormat(locale, { weekday: "short" }),
      weekdayLong: new Intl.DateTimeFormat(locale, { weekday: "long" }),
    }),
    [locale],
  );
  const format = useCallback(
    (range: DateRange | null) =>
      !range
        ? placeholder
        : sameDay(range.start, range.end)
          ? formatters.label.format(range.start)
          : formatters.label.formatRange(range.start, range.end),
    [formatters, placeholder],
  );

  const count = compact ? 1 : 2;
  const visible = useMemo(
    () => Array.from({ length: count }, (_, index) => addMonths(view, index)),
    [count, view],
  );
  const shown = anchor ? ordered(anchor, hover ?? anchor) : draft;
  const activePreset =
    today && !anchor
      ? presets.findIndex((p) => sameRange(p.range(today), draft))
      : -1;
  const days = shown ? dayDiff(shown.end, shown.start) + 1 : 0;
  const committedDirection = useDirection(committed);
  const shownDirection = useDirection(shown);

  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const railRef = useRef<HTMLDivElement>(null);
  const pendingFocus = useRef<"trigger" | "day" | null>(null);

  /* ---------- One surface: the trigger's box springs to the panel's box and back ---------- */
  // Before the first measurement the surface fills the root and the root wraps
  // the trigger, so server markup already looks right.
  const width = useMotionValue<number | string>("100%");
  const height = useMotionValue<number | string>("100%");
  const radius = useMotionValue(TRIGGER_RADIUS);
  const x = useMotionValue(0);
  const rootWidth = useMotionValue<number | string>("auto");
  const sizes = useRef<{ trigger: Size; panel: Size | null }>({
    trigger: { w: 0, h: 0 },
    panel: null,
  });
  const live = useRef({ open: false, reduced: false, ready: false });
  const queued = useRef(false);
  const boundaryRef = useRef(boundary);
  useLayoutEffect(() => {
    boundaryRef.current = boundary;
  }, [boundary]);

  const bounds = useCallback(() => {
    const element = boundaryRef.current?.();
    const viewport = { left: 0, right: document.documentElement.clientWidth };
    if (!element) return viewport;
    const rect = element.getBoundingClientRect();
    return {
      left: Math.max(viewport.left, rect.left),
      right: Math.min(viewport.right, rect.right),
    };
  }, []);

  const update = useCallback(() => {
    queued.current = false;
    const { trigger, panel } = sizes.current;
    const state = live.current;
    if (!trigger.w) return;
    const openPanel = state.open && panel ? panel : null;
    const target = openPanel ?? trigger;
    let offset = 0;
    if (openPanel && rootRef.current) {
      const rect = rootRef.current.getBoundingClientRect();
      const box = bounds();
      offset = Math.min(0, box.right - EDGE - (rect.left + openPanel.w));
      offset = Math.max(offset, box.left + EDGE - rect.left);
    }
    const r = openPanel ? PANEL_RADIUS : TRIGGER_RADIUS;
    if (!state.ready || state.reduced) {
      width.jump(target.w);
      height.jump(target.h);
      radius.jump(r);
      x.jump(offset);
      rootWidth.jump(trigger.w);
      state.ready = true;
      return;
    }
    const spring = state.open ? GROW : SHRINK;
    animate(width, target.w, spring);
    animate(height, target.h, spring);
    animate(radius, r, spring);
    animate(x, offset, spring);
    animate(rootWidth, trigger.w, MORPH);
  }, [bounds, height, radius, rootWidth, width, x]);

  const schedule = useCallback(() => {
    if (queued.current) return;
    queued.current = true;
    queueMicrotask(update);
  }, [update]);

  useLayoutEffect(() => {
    live.current.open = open;
    live.current.reduced = reduced;
    if (!open) sizes.current.panel = null;
    schedule();
  }, [open, reduced, schedule]);

  useLayoutEffect(() => {
    const node = triggerRef.current;
    if (!node) return;
    const read = () => {
      sizes.current.trigger = { w: node.offsetWidth, h: node.offsetHeight };
      schedule();
    };
    read();
    if (typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(read);
    observer.observe(node);
    return () => observer.disconnect();
  }, [schedule]);

  useLayoutEffect(() => {
    const node = panelRef.current;
    if (!open || !node) return;
    const read = () => {
      sizes.current.panel = { w: node.offsetWidth, h: node.offsetHeight };
      schedule();
    };
    read();
    if (typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(read);
    observer.observe(node);
    return () => observer.disconnect();
  }, [open, schedule]);

  // On a short screen the panel can open below the fold with Apply out of reach.
  // Scroll just enough to bring its bottom into view, never past its top.
  useEffect(() => {
    if (!open) return;
    const frame = requestAnimationFrame(() => {
      const node = panelRef.current;
      if (!node) return;
      const rect = node.getBoundingClientRect();
      const overflow = rect.bottom - (window.innerHeight - EDGE);
      if (overflow <= 0) return;
      window.scrollBy({
        top: Math.min(overflow, Math.max(0, rect.top - EDGE)),
        behavior: reduced ? "instant" : "smooth",
      });
    });
    return () => cancelAnimationFrame(frame);
  }, [open, reduced]);

  /* ---------- Layout: two months when there is room, one compact month otherwise ---------- */
  const measureLayout = useCallback(() => {
    const box = bounds();
    const available = Math.max(0, box.right - box.left - EDGE * 2);
    const single = months === 1 || (months === "auto" && available < WIDE_MIN);
    return { single, width: Math.min(352, available) };
  }, [bounds, months]);

  useEffect(() => {
    if (!open) return;
    const onResize = () => {
      const next = measureLayout();
      setCompact(next.single);
      setPanelWidth(next.width);
      schedule();
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [measureLayout, open, schedule]);

  const viewFor = (
    range: DateRange | null,
    single: boolean,
    fallback: Date,
  ) => {
    const end = monthStart(range?.end ?? fallback);
    return single ? end : addMonths(end, -1);
  };

  const openPanel = () => {
    if (!today) return;
    const layout = measureLayout();
    setCompact(layout.single);
    setPanelWidth(layout.width);
    setDraft(committed);
    setAnchor(null);
    setHover(null);
    // With no selection yet, open on the data's own span, not on today.
    const fallback = clampDate(today, minDate, maxDate);
    setView(viewFor(committed, layout.single, fallback));
    setDirection(0);
    setFocusKey(keyOf(committed?.start ?? fallback));
    pendingFocus.current = "day";
    setOpen(true);
  };

  const close = useCallback((focus: boolean) => {
    if (focus) pendingFocus.current = "trigger";
    setDirection(0);
    setOpen(false);
    setAnchor(null);
    setHover(null);
  }, []);

  const apply = () => {
    const next = anchor ? { start: anchor, end: anchor } : draft;
    if (!next) return;
    if (value === undefined) setInner(next);
    onChange?.(next);
    close(true);
  };

  const clearRange = () => {
    setDraft(null);
    setAnchor(null);
    setHover(null);
    if (value === undefined) setInner(null);
    onChange?.(null);
  };

  /* ---------- Focus management ---------- */
  useLayoutEffect(() => {
    const target = pendingFocus.current;
    if (!target) return;
    if (target === "trigger" && !open) {
      pendingFocus.current = null;
      triggerRef.current?.focus({ preventScroll: true });
      return;
    }
    if (target === "day" && open) {
      const node = panelRef.current?.querySelector<HTMLButtonElement>(
        `[data-current] [data-date="${focusKey}"]`,
      );
      if (node) {
        pendingFocus.current = null;
        node.focus({ preventScroll: true });
      }
    }
  }, [focusKey, open, view, compact]);

  useEffect(() => {
    if (!open) return;
    const down = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) close(false);
    };
    document.addEventListener("pointerdown", down);
    return () => document.removeEventListener("pointerdown", down);
  }, [close, open]);

  const onRootKey = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Escape" && open) {
      event.preventDefault();
      event.stopPropagation();
      close(true);
    }
  };
  const onRootBlur = (event: ReactFocusEvent<HTMLDivElement>) => {
    const next = event.relatedTarget as Node | null;
    if (open && next && !event.currentTarget.contains(next)) close(false);
  };

  /* ---------- Month navigation and picking ---------- */
  const goTo = (next: Date) => {
    const delta = monthDiff(next, view);
    if (!delta) return;
    setDirection(Math.sign(delta));
    setView(next);
  };

  /** Keeps a range on screen: nothing moves when it already fits. */
  const reveal = (range: DateRange) => {
    const first = view;
    const last = addMonths(view, count - 1);
    if (monthDiff(range.start, first) >= 0 && monthDiff(range.end, last) <= 0)
      return;
    goTo(viewFor(range, compact, range.end));
  };

  const pick = (date: Date) => {
    setFocusKey(keyOf(date));
    if (!anchor) {
      setAnchor(date);
      setHover(date);
      return;
    }
    setDraft(ordered(anchor, date));
    setAnchor(null);
    setHover(null);
  };

  const choosePreset = (preset: DateRangePreset) => {
    if (!today) return;
    const range = preset.range(today);
    setDraft(range);
    setAnchor(null);
    setHover(null);
    setFocusKey(keyOf(range.start));
    reveal(range);
  };

  const onDayKey = (
    event: ReactKeyboardEvent<HTMLButtonElement>,
    date: Date,
  ) => {
    const weekday = (date.getDay() - weekStartsOn + 7) % 7;
    const moves: Record<string, () => Date> = {
      ArrowLeft: () => addDays(date, -1),
      ArrowRight: () => addDays(date, 1),
      ArrowUp: () => addDays(date, -7),
      ArrowDown: () => addDays(date, 7),
      Home: () => addDays(date, -weekday),
      End: () => addDays(date, 6 - weekday),
      PageUp: () => shiftMonths(date, event.shiftKey ? -12 : -1),
      PageDown: () => shiftMonths(date, event.shiftKey ? 12 : 1),
    };
    const move = moves[event.key];
    if (!move) return;
    event.preventDefault();
    const next = clampDate(move(), minDate, maxDate);
    setFocusKey(keyOf(next));
    if (anchor) setHover(next);
    pendingFocus.current = "day";
    const first = view;
    const last = addMonths(view, count - 1);
    if (monthDiff(next, first) < 0) goTo(monthStart(next));
    else if (monthDiff(next, last) > 0)
      goTo(addMonths(monthStart(next), -(count - 1)));
  };

  const onRailKey = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    const keys = compact
      ? ["ArrowLeft", "ArrowRight"]
      : ["ArrowUp", "ArrowDown"];
    if (!keys.includes(event.key)) return;
    const buttons = Array.from(
      event.currentTarget.querySelectorAll<HTMLButtonElement>("[data-preset]"),
    );
    const at = buttons.indexOf(document.activeElement as HTMLButtonElement);
    if (at < 0) return;
    event.preventDefault();
    buttons[
      (at + (event.key === keys[1] ? 1 : -1) + buttons.length) % buttons.length
    ]?.focus();
  };

  /** The day that owns the tab stop: the focused day if visible, else the range start, else the 1st. */
  const tabbable = useMemo(() => {
    const onScreen = (date: Date) =>
      visible.some((m) => monthDiff(date, m) === 0);
    if (focusKey && onScreen(fromKey(focusKey))) return focusKey;
    if (shown && onScreen(shown.start)) return keyOf(shown.start);
    return keyOf(visible[0]!);
  }, [focusKey, shown, visible]);

  /* ---------- Preset highlight glides between presets ---------- */
  const gx = useMotionValue(0);
  const gy = useMotionValue(0);
  const gw = useMotionValue(0);
  const gh = useMotionValue(0);
  const go = useMotionValue(0);
  useLayoutEffect(() => {
    const rail = railRef.current;
    const node =
      activePreset < 0
        ? null
        : rail?.querySelector<HTMLElement>(`[data-preset="${activePreset}"]`);
    if (!rail || !node) {
      animate(go, 0, { duration: reduced ? 0 : 0.14 });
      return;
    }
    const place = [
      node.offsetLeft,
      node.offsetTop,
      node.offsetWidth,
      node.offsetHeight,
    ] as const;
    if (go.get() < 0.05 || reduced) {
      gx.jump(place[0]);
      gy.jump(place[1]);
      gw.jump(place[2]);
      gh.jump(place[3]);
    } else {
      animate(gx, place[0], GLIDE);
      animate(gy, place[1], GLIDE);
      animate(gw, place[2], GLIDE);
      animate(gh, place[3], GLIDE);
    }
    animate(go, 1, { duration: reduced ? 0 : 0.16 });
    if (
      compact &&
      (node.offsetLeft < rail.scrollLeft ||
        node.offsetLeft + node.offsetWidth > rail.scrollLeft + rail.clientWidth)
    ) {
      rail.scrollTo({
        left: node.offsetLeft - 12,
        behavior: reduced ? "auto" : "smooth",
      });
    }
  }, [activePreset, compact, go, gh, gw, gx, gy, open, reduced]);

  /* ---------- Copy ---------- */
  const committedText = format(committed);
  const shownText = shown ? format(shown) : "No dates";
  const countText = shown ? `${days} ${days === 1 ? "day" : "days"}` : "";
  const status = !open
    ? ""
    : anchor
      ? `Start ${formatters.label.format(anchor)}. Choose an end date.`
      : shown
        ? `${shownText}, ${countText}`
        : "";
  const layoutId = reduced ? undefined : `${uid}-value`;

  const cellSize =
    compact && panelWidth
      ? Math.max(32, Math.min(42, Math.floor((panelWidth - 24) / 7)))
      : WIDE_CELL;

  const quiet = open
    ? reduced
      ? { opacity: 0 }
      : { opacity: 0, filter: `blur(${BLUR.subtle}px)` }
    : { opacity: 1, filter: "blur(0px)" };
  const quietTransition = open
    ? { duration: 0.12, ease: STANDARD_EASE }
    : { duration: 0.22, ease: ENTER_EASE, delay: reduced ? 0 : 0.1 };

  const valueClass =
    "text-sm font-medium data-[empty]:font-normal data-[empty]:text-muted-foreground";

  return (
    <motion.div
      ref={rootRef}
      className={cn(
        "relative inline-block align-top data-[open]:z-50",
        className,
      )}
      style={{ width: rootWidth }}
      data-open={open || undefined}
      onKeyDown={onRootKey}
      onBlur={onRootBlur}
    >
      {/* The trigger stays in place over the surface. Its icons fade, while the value itself flies to the panel footer and back. */}
      <button
        ref={triggerRef}
        type="button"
        className="peer relative z-10 inline-flex h-9 items-center gap-2 whitespace-nowrap rounded-[inherit] bg-transparent px-3 text-foreground outline-none disabled:pointer-events-none disabled:opacity-50 data-[open]:pointer-events-none"
        data-open={open || undefined}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={open ? `${uid}-panel` : undefined}
        aria-label={`${label}: ${committedText}`}
        disabled={!today}
        inert={open || undefined}
        onClick={openPanel}
      >
        <motion.span
          className="text-muted-foreground"
          initial={false}
          animate={quiet}
          transition={quietTransition}
        >
          <CalendarDays
            className="size-4"
            strokeWidth={1.75}
            aria-hidden="true"
          />
        </motion.span>
        {open || !layoutId ? (
          <motion.span
            key="resting"
            className={valueClass}
            data-empty={!committed || undefined}
            initial={false}
            animate={open ? { opacity: 0 } : { opacity: 1 }}
            transition={quietTransition}
          >
            <Rolling
              text={committedText}
              direction={committedDirection}
              reduced={reduced}
            />
          </motion.span>
        ) : (
          <motion.span
            key="shared"
            layoutId={layoutId}
            layout="position"
            className={valueClass}
            data-empty={!committed || undefined}
            transition={SHRINK}
          >
            <Rolling
              text={committedText}
              direction={committedDirection}
              reduced={reduced}
            />
          </motion.span>
        )}
        <motion.span
          className="text-muted-foreground"
          initial={false}
          animate={quiet}
          transition={quietTransition}
        >
          <ChevronDown
            className="size-4"
            strokeWidth={1.75}
            aria-hidden="true"
          />
        </motion.span>
      </button>

      <motion.div
        data-open={open || undefined}
        className={cn(
          "pointer-events-none absolute left-0 top-0 z-0 overflow-hidden border border-input bg-background text-popover-foreground shadow-xs transition-[background-color,box-shadow,border-color]",
          "peer-hover:bg-accent/60 peer-focus-visible:border-ring peer-focus-visible:ring-[3px] peer-focus-visible:ring-ring/50 peer-disabled:opacity-50",
          "data-[open]:pointer-events-auto data-[open]:bg-popover data-[open]:shadow-lg",
        )}
        style={{ width, height, borderRadius: radius, x }}
      >
        <AnimatePresence>
          {open && today && (
            <motion.div
              key="panel"
              ref={panelRef}
              id={`${uid}-panel`}
              role="dialog"
              aria-label={label}
              data-compact={compact || undefined}
              className="group/panel absolute left-0 top-0 w-max"
              style={
                {
                  "--cell": `${cellSize}px`,
                  width: compact && panelWidth ? panelWidth : undefined,
                } as CSSProperties
              }
              exit={{ opacity: 1, transition: { duration: 0.14 } }}
            >
              <motion.div
                className="flex group-data-[compact]/panel:flex-col"
                variants={reduced ? faceFade : faceIn}
                initial="hidden"
                animate="shown"
                exit="gone"
              >
                <div
                  ref={railRef}
                  role="group"
                  aria-label="Presets"
                  onKeyDown={onRailKey}
                  className={cn(
                    "relative flex w-36 shrink-0 flex-col gap-0.5 border-r p-2",
                    "group-data-[compact]/panel:w-auto group-data-[compact]/panel:flex-row group-data-[compact]/panel:gap-1 group-data-[compact]/panel:overflow-x-auto group-data-[compact]/panel:border-b group-data-[compact]/panel:border-r-0",
                    "[scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
                  )}
                >
                  <motion.span
                    aria-hidden="true"
                    className="pointer-events-none absolute left-0 top-0 rounded-md bg-accent"
                    style={{ x: gx, y: gy, width: gw, height: gh, opacity: go }}
                  />
                  {presets.map((preset, index) => (
                    <button
                      key={preset.label}
                      type="button"
                      data-preset={index}
                      aria-pressed={index === activePreset}
                      onClick={() => choosePreset(preset)}
                      className={cn(
                        "relative z-10 shrink-0 whitespace-nowrap rounded-md px-3 py-1.5 text-left text-sm text-muted-foreground outline-none transition-colors",
                        "hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50 aria-pressed:font-medium aria-pressed:text-foreground",
                      )}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>

                <div
                  className="relative p-3"
                  onPointerLeave={() => {
                    if (anchor) setHover(null);
                  }}
                >
                  <button
                    type="button"
                    aria-label="Previous month"
                    onClick={() => goTo(addMonths(view, -1))}
                    disabled={Boolean(minDate && monthDiff(view, minDate) <= 0)}
                    className="absolute left-3 top-3 z-10 flex size-7 items-center justify-center rounded-md text-muted-foreground outline-none transition-colors hover:bg-accent hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-30"
                  >
                    <ChevronLeft
                      className="size-4"
                      strokeWidth={1.75}
                      aria-hidden="true"
                    />
                  </button>
                  <button
                    type="button"
                    aria-label="Next month"
                    onClick={() => goTo(addMonths(view, 1))}
                    disabled={Boolean(
                      maxDate &&
                      monthDiff(addMonths(view, count - 1), maxDate) >= 0,
                    )}
                    className="absolute right-3 top-3 z-10 flex size-7 items-center justify-center rounded-md text-muted-foreground outline-none transition-colors hover:bg-accent hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-30"
                  >
                    <ChevronRight
                      className="size-4"
                      strokeWidth={1.75}
                      aria-hidden="true"
                    />
                  </button>
                  {/* Fixed six-week height; leaving and arriving months stack in one cell so the panel never resizes mid-slide. */}
                  <div className="grid overflow-hidden [&>*]:col-start-1 [&>*]:row-start-1">
                    <AnimatePresence initial={false} custom={direction}>
                      <Months
                        key={`${keyOf(view)}-${count}`}
                        direction={direction}
                        reduced={reduced}
                      >
                        {visible.map((month) => (
                          <Month
                            key={keyOf(month)}
                            month={month}
                            range={shown}
                            tabbable={tabbable}
                            today={today}
                            minDate={minDate}
                            maxDate={maxDate}
                            marked={markedDays}
                            weekStartsOn={weekStartsOn}
                            reduced={reduced}
                            formatters={formatters}
                            idBase={uid}
                            onPick={pick}
                            onHover={(date) => {
                              if (anchor) setHover(date);
                            }}
                            onKey={onDayKey}
                            onFocusDay={(date) => setFocusKey(keyOf(date))}
                          />
                        ))}
                      </Months>
                    </AnimatePresence>
                  </div>
                </div>
              </motion.div>

              <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-t px-4 py-3">
                <div className="flex min-w-0 flex-col">
                  <motion.span
                    layoutId={layoutId}
                    layout={layoutId ? "position" : undefined}
                    className="text-sm font-medium"
                    transition={GROW}
                    variants={layoutId ? undefined : faceFade}
                    initial={layoutId ? undefined : "hidden"}
                    animate={layoutId ? undefined : "shown"}
                    exit={layoutId ? undefined : "gone"}
                  >
                    <Rolling
                      text={shownText}
                      direction={shownDirection}
                      reduced={reduced}
                    />
                  </motion.span>
                  <motion.span
                    className="h-4 text-xs text-muted-foreground"
                    variants={reduced ? faceFade : faceIn}
                    initial="hidden"
                    animate="shown"
                    exit="gone"
                  >
                    {countText && (
                      <Rolling
                        text={
                          anchor && sameDay(anchor, hover)
                            ? "Pick an end date"
                            : countText
                        }
                        direction={shownDirection}
                        reduced={reduced}
                      />
                    )}
                  </motion.span>
                </div>
                <motion.div
                  className="flex items-center gap-2"
                  variants={reduced ? faceFade : faceIn}
                  initial="hidden"
                  animate="shown"
                  exit="gone"
                >
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="text-destructive border-destructive/30 hover:bg-destructive/10 hover:text-destructive"
                    onClick={clearRange}
                  >
                    Clear
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => close(true)}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    onClick={apply}
                    disabled={!shown}
                  >
                    Apply
                  </Button>
                </motion.div>
              </div>
              <p className="sr-only" aria-live="polite">
                {status}
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
}

export default DateRangePicker;
