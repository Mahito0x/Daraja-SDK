"use client";

import { format, isWithinInterval } from "date-fns";
import {
  ArrowDownLeft,
  ArrowUpRight,
  Banknote,
  Filter,
  Info,
  LayoutDashboard,
  ListOrdered,
  PieChart,
  Receipt,
  RefreshCw,
  Search,
  Sparkles,
  TrendingDown,
  TrendingUp,
  Users,
  Wallet,
} from "lucide-react";
import { useId, useMemo, useState, type ReactNode } from "react";

import Footer from "@/components/Footer";
import { Logo } from "@/components/Logo";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { Charts, isInternalTransfer } from "./Components/Charts";
import { buildConnections, ConnectionsTab } from "./Components/ConnectionsTab";
import { DateRangePicker, type DateRange } from "./Components/DateRangePicker";
import PrivacyDialog from "./Components/Dialog";
import LoadingState from "./Components/LoadingState";
import PinInput from "./Components/PinInput";
import { ShareDialog, type ShareData } from "./Components/ShareCard";
import { StatementUploadModal } from "./Components/StatementUploadModal";
import { mockMpesaStatement, type MpesaStatementData } from "./data/data";
import {
  parseStatement,
  PinRequiredError,
  WrongPinError,
} from "./lib/ParseStatement";

/* ------------------------------------------------------------------ */
/* Design helpers                                                      */
/* ------------------------------------------------------------------ */

type Tone = "emerald" | "rose" | "amber" | "primary";

const TONES: Record<Tone, { chip: string; text: string; bar: string }> = {
  emerald: {
    chip: "bg-emerald-500/12 text-emerald-700 dark:text-emerald-400",
    text: "text-emerald-700 dark:text-emerald-400",
    bar: "bg-emerald-500",
  },
  rose: {
    chip: "bg-rose-500/12 text-rose-700 dark:text-rose-400",
    text: "text-rose-700 dark:text-rose-400",
    bar: "bg-rose-500",
  },
  amber: {
    chip: "bg-amber-500/15 text-amber-700 dark:text-amber-400",
    text: "text-amber-700 dark:text-amber-400",
    bar: "bg-amber-500",
  },
  primary: {
    chip: "bg-primary/10 text-primary",
    text: "text-primary",
    bar: "bg-primary",
  },
};

const BAR_COLORS = [
  "bg-primary",
  "bg-emerald-500",
  "bg-sky-500",
  "bg-amber-500",
  "bg-violet-500",
  "bg-rose-500",
  "bg-muted-foreground",
];

const money = (n: number, digits = 2) =>
  n.toLocaleString(undefined, {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });

const initials = (name: string) =>
  name
    .replace(/[^a-zA-Z\s]/g, " ")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("") || "#";

function HelpIcon({
  content,
  className,
}: {
  content: ReactNode;
  className?: string;
}) {
  return (
    <Tooltip>
      <TooltipTrigger
        aria-label="What is this?"
        className={cn(
          "cursor-help rounded-full p-1 text-muted-foreground/70 outline-none transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/60",
          className,
        )}
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

/** Card wrapper: tooltip appears only when hovering the ⓘ in the corner. */
function Tip({
  content,
  children,
  className,
}: {
  content: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("relative h-full", className)}>
      {children}
      <HelpIcon content={content} className="absolute right-3 top-3 z-10" />
    </div>
  );
}

function IconChip({ tone, children }: { tone: Tone; children: ReactNode }) {
  return (
    <div
      className={cn(
        "flex size-9 shrink-0 items-center justify-center rounded-xl",
        TONES[tone].chip,
      )}
    >
      {children}
    </div>
  );
}

function StatCard({
  tip,
  icon,
  tone,
  label,
  value,
  hint,
}: {
  tip: ReactNode;
  icon: ReactNode;
  tone: Tone;
  label: string;
  value: ReactNode;
  hint: string;
}) {
  return (
    <Tip content={tip}>
      <div className="group h-full rounded-2xl border bg-card p-5 transition-colors hover:border-foreground/20">
        <div className="flex items-center gap-3 pr-6">
          <IconChip tone={tone}>{icon}</IconChip>
          <span className="text-sm text-muted-foreground">{label}</span>
        </div>
        <p className="mt-4 text-2xl font-semibold tracking-tight tabular-nums">
          {value}
        </p>
        <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
      </div>
    </Tip>
  );
}

function SectionCard({
  title,
  description,
  tip,
  action,
  children,
  className,
}: {
  title: string;
  description: string;
  tip: ReactNode;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("rounded-2xl border bg-card p-5 sm:p-6", className)}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-semibold tracking-tight">{title}</h2>
            <Tooltip>
              <TooltipTrigger
                aria-label={`About ${title}`}
                className="cursor-help rounded-full text-muted-foreground outline-none transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/60"
              >
                <Info className="size-3.5" />
              </TooltipTrigger>
              <TooltipContent
                side="top"
                className="max-w-64 text-pretty text-xs leading-relaxed"
              >
                {tip}
              </TooltipContent>
            </Tooltip>
          </div>
          <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
        </div>
        {action}
      </div>
      <div className="mt-5">{children}</div>
    </section>
  );
}

function StatusPill({ status }: { status: string }) {
  const ok = /complet/i.test(status);
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-medium",
        ok ? TONES.emerald.chip : TONES.amber.chip,
      )}
    >
      <span
        className={cn(
          "size-1.5 rounded-full",
          ok ? "bg-emerald-500" : "bg-amber-500",
        )}
      />
      {status}
    </span>
  );
}

/* ------------------------------------------------------------------ */
/* Page                                                                */
/* ------------------------------------------------------------------ */

const PARSE_STEPS = [
  "Reading your statement",
  "Breaking down transactions",
  "Analyzing cash flow",
  "Crunching the numbers",
];

export default function SafiPage() {
  const searchInputId = useId();

  // Core Upload & Security States
  const [statementFile, setStatementFile] = useState<File | null>(null);
  const [isLocked, setIsLocked] = useState<boolean>(false);
  const [isParsing, setIsParsing] = useState<boolean>(false);

  // Start with mock data by default until user uploads/unlocks their own statement
  const [statementData, setStatementData] =
    useState<MpesaStatementData>(mockMpesaStatement);
  const [isCustomUploaded, setIsCustomUploaded] = useState<boolean>(false);
  const [shareOpen, setShareOpen] = useState(false);

  // Time of day greeting calculation
  const currentHour = new Date().getHours();
  const greeting =
    currentHour < 12
      ? "Good morning"
      : currentHour < 18
        ? "Good afternoon"
        : "Good evening";

  // Date Range Filter State
  const [dateRange, setDateRange] = useState<DateRange | null>(null);

  // Transaction Ledger States
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<"all" | "in" | "out" | "fees">(
    "all",
  );
  const [sortBy, setSortBy] = useState<
    "date-desc" | "date-asc" | "amount-desc" | "amount-asc"
  >("date-desc");
  const [activeTab, setActiveTab] = useState<
    "overview" | "transactions" | "contacts" | "insights"
  >("overview");

  // Handle file acceptance from modal/upload
  const handleFileAccepted = async (file: File) => {
    setStatementFile(file);
    setIsLocked(false);
    setIsParsing(true);

    try {
      const parsed = await parseStatement(file);
      adaptAndSetStatement(parsed);
    } catch (err) {
      if (err instanceof PinRequiredError) {
        setIsLocked(true);
      } else {
        console.error("Statement parsing error:", err);
      }
    } finally {
      setIsParsing(false);
    }
  };

  // Handle PIN submission using your robust parser
  const handlePinSubmit = async (pin: string): Promise<boolean> => {
    if (!statementFile) return false;

    try {
      const parsed = await parseStatement(statementFile, pin);
      adaptAndSetStatement(parsed);
      setIsLocked(false);
      return true;
    } catch (err) {
      if (err instanceof WrongPinError) {
        return false;
      }
      console.error("PIN unlock error:", err);
      throw err;
    }
  };

  // Map parsed statements into your component's expected MpesaStatementData format
  const adaptAndSetStatement = (parsed: any) => {
    const formattedData: MpesaStatementData = {
      customerName: parsed.meta.customerName || "VALUED CUSTOMER",
      mobileNumber: parsed.meta.mobile || "07XXXXXXXX",
      email: parsed.meta.email || "user@local.dev",
      statementPeriod: `${parsed.meta.periodStart || ""} - ${parsed.meta.periodEnd || ""}`,
      requestDate: parsed.meta.requestDate || format(new Date(), "dd MMM yyyy"),
      summary: parsed.summary?.rows
        ? parsed.summary.rows.map((r: any) => ({
            category: r.label.toUpperCase(),
            paidIn: r.paidIn,
            paidOut: r.paidOut,
          }))
        : [],
      totals: {
        paidIn: parsed.summary?.totalPaidIn || 0,
        paidOut: parsed.summary?.totalPaidOut || 0,
      },
      transactions: parsed.transactions.map((tx: any) => ({
        receiptNo: tx.receipt,
        completionTime: `${tx.date} ${tx.time}`,
        details: tx.details,
        status: tx.status,
        paidIn: tx.paidIn,
        withdrawn: tx.paidOut,
        balance: tx.balance ?? 0,
      })),
    };

    setStatementData(formattedData);
    setIsCustomUploaded(true);
  };

  // Reset back to mock data or initial state
  const clearStatement = () => {
    setStatementFile(null);
    setIsLocked(false);
    setStatementData(mockMpesaStatement);
    setIsCustomUploaded(false);
  };

  // Compute available date boundaries from dataset
  const allDates = useMemo(() => {
    if (!statementData || !statementData.transactions) return [];
    return statementData.transactions
      .map((tx) => new Date(tx.completionTime.replace(" ", "T")))
      .sort((a, b) => a.getTime() - b.getTime());
  }, [statementData]);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const minDate = allDates[0] || new Date();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const maxDate = allDates[allDates.length - 1] || new Date();

  const activeInterval = useMemo(() => {
    if (dateRange?.start && dateRange?.end) {
      return { start: dateRange.start, end: dateRange.end };
    }
    return { start: minDate, end: maxDate };
  }, [dateRange, minDate, maxDate]);

  const dateFilteredTransactions = useMemo(() => {
    if (!statementData) return [];
    return statementData.transactions.filter((tx) => {
      if (isInternalTransfer(tx.details)) return false;
      const txDate = new Date(tx.completionTime.replace(" ", "T"));
      return isWithinInterval(txDate, {
        start: activeInterval.start,
        end: activeInterval.end,
      });
    });
  }, [statementData, activeInterval]);

  const metrics = useMemo(() => {
    let totalPaidIn = 0;
    let totalPaidOut = 0;
    let totalFees = 0;
    let outgoingCount = 0;

    dateFilteredTransactions.forEach((tx) => {
      totalPaidIn += tx.paidIn;
      totalPaidOut += tx.withdrawn;
      if (
        tx.details.toLowerCase().includes("charge") ||
        tx.details.toLowerCase().includes("fee")
      ) {
        totalFees += tx.withdrawn;
      }
      if (tx.withdrawn > 0) outgoingCount++;
    });

    const netCashFlow = totalPaidIn - totalPaidOut;
    const avgOutgoing = outgoingCount > 0 ? totalPaidOut / outgoingCount : 0;

    return {
      totalPaidIn,
      totalPaidOut,
      netCashFlow,
      totalFees,
      transactionCount: dateFilteredTransactions.length,
      avgOutgoing,
    };
  }, [dateFilteredTransactions]);

  const spendingCategories = useMemo(() => {
    const cats: Record<string, { amount: number; count: number }> = {
      "Send Money": { amount: 0, count: 0 },
      "Merchant Payments": { amount: 0, count: 0 },
      PayBill: { amount: 0, count: 0 },
      "Airtime & Bundles": { amount: 0, count: 0 },
      Withdrawals: { amount: 0, count: 0 },
      "Transaction Charges": { amount: 0, count: 0 },
      "Other Transactions": { amount: 0, count: 0 },
    };

    dateFilteredTransactions.forEach((tx) => {
      if (tx.withdrawn <= 0) return;
      const details = tx.details.toLowerCase();

      if (details.includes("charge") || details.includes("fee")) {
        cats["Transaction Charges"].amount += tx.withdrawn;
        cats["Transaction Charges"].count++;
      } else if (
        details.includes("transfer to") ||
        details.includes("customer transfer")
      ) {
        cats["Send Money"].amount += tx.withdrawn;
        cats["Send Money"].count++;
      } else if (
        details.includes("merchant payment") ||
        details.includes("card pay bill")
      ) {
        cats["Merchant Payments"].amount += tx.withdrawn;
        cats["Merchant Payments"].count++;
      } else if (details.includes("pay bill") || details.includes("paybill")) {
        cats["PayBill"].amount += tx.withdrawn;
        cats["PayBill"].count++;
      } else if (details.includes("bundle") || details.includes("airtime")) {
        cats["Airtime & Bundles"].amount += tx.withdrawn;
        cats["Airtime & Bundles"].count++;
      } else if (details.includes("withdrawal")) {
        cats["Withdrawals"].amount += tx.withdrawn;
        cats["Withdrawals"].count++;
      } else {
        cats["Other Transactions"].amount += tx.withdrawn;
        cats["Other Transactions"].count++;
      }
    });

    return Object.entries(cats)
      .map(([name, data]) => ({
        name,
        amount: data.amount,
        count: data.count,
        percentage:
          metrics.totalPaidOut > 0
            ? (data.amount / metrics.totalPaidOut) * 100
            : 0,
      }))
      .filter((c) => c.amount > 0)
      .sort((a, b) => b.amount - a.amount);
  }, [dateFilteredTransactions, metrics.totalPaidOut]);

  const shareData = useMemo<ShareData>(
    () => ({
      name: statementData.customerName,
      mobileNumber: statementData.mobileNumber,
      period:
        dateRange?.start && dateRange?.end
          ? `${format(dateRange.start, "yyyy-MM-dd")} - ${format(dateRange.end, "yyyy-MM-dd")}`
          : statementData.statementPeriod,
      totalIn: metrics.totalPaidIn,
      totalOut: metrics.totalPaidOut,
      fees: metrics.totalFees,
      categories: spendingCategories.map((c) => ({
        name: c.name,
        amount: c.amount,
      })),
      isDemo: !isCustomUploaded,
    }),
    [statementData, dateRange, metrics, spendingCategories, isCustomUploaded],
  );

  const filteredLedgerTransactions = useMemo(() => {
    if (!statementData) return [];
    let list = [...dateFilteredTransactions];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (tx) =>
          tx.details.toLowerCase().includes(q) ||
          tx.receiptNo.toLowerCase().includes(q),
      );
    }

    if (typeFilter === "in") list = list.filter((tx) => tx.paidIn > 0);
    if (typeFilter === "out") list = list.filter((tx) => tx.withdrawn > 0);
    if (typeFilter === "fees")
      list = list.filter((tx) => tx.details.toLowerCase().includes("charge"));

    list.sort((a, b) => {
      const dateA = new Date(a.completionTime.replace(" ", "T")).getTime();
      const dateB = new Date(b.completionTime.replace(" ", "T")).getTime();
      if (sortBy === "date-desc") return dateB - dateA;
      if (sortBy === "date-asc") return dateA - dateB;
      if (sortBy === "amount-desc")
        return (
          Math.max(b.paidIn, b.withdrawn) - Math.max(a.paidIn, a.withdrawn)
        );
      if (sortBy === "amount-asc")
        return (
          Math.max(a.paidIn, a.withdrawn) - Math.max(b.paidIn, b.withdrawn)
        );
      return 0;
    });

    return list;
  }, [
    dateFilteredTransactions,
    searchQuery,
    typeFilter,
    sortBy,
    statementData,
  ]);

  /* ---------------- derived view values ---------------- */

  const flowTotal = metrics.totalPaidIn + metrics.totalPaidOut;
  const inPct = flowTotal > 0 ? (metrics.totalPaidIn / flowTotal) * 100 : 50;
  const feeShare =
    metrics.totalPaidOut > 0
      ? (metrics.totalFees / metrics.totalPaidOut) * 100
      : 0;

  const contactsAnalysis = useMemo(
    () => buildConnections(dateFilteredTransactions),
    [dateFilteredTransactions],
  );

  const tabTrigger =
    "gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm sm:px-4";

  return (
    <TooltipProvider>
      <main className="relative flex min-h-screen flex-col overflow-x-clip bg-background text-foreground selection:bg-primary/20">
        <PrivacyDialog />
        <ShareDialog
          open={shareOpen}
          onOpenChange={setShareOpen}
          data={shareData}
        />

        {/* Ambient glow, purely atmospheric */}
        <div
          aria-hidden
          className={cn(
            "pointer-events-none absolute inset-x-0 top-0 -z-10 h-[420px] overflow-hidden",
            isParsing && "hidden",
          )}
        >
          <div className="absolute -top-32 left-1/2 h-72 w-[42rem] -translate-x-1/2 rounded-full bg-primary/15 blur-3xl dark:bg-primary/20" />
          <div className="absolute -top-20 right-0 h-56 w-80 rounded-full bg-emerald-500/10 blur-3xl" />
        </div>

        {/* Top Navigation Header */}
        <header className="sticky top-0 z-40 border-b border-border/50 bg-background/75 backdrop-blur-xl">
          <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
            <div className="flex min-w-0 items-center gap-3">
              <Logo size={32} showText={true} />
              <span className="hidden border-l border-border/60 pl-3 text-xs text-muted-foreground md:inline">
                Private analysis, nothing leaves your device
              </span>
            </div>

            <div className="flex items-center gap-2 sm:gap-3">
              <StatementUploadModal onFileAccepted={handleFileAccepted} />

              {isCustomUploaded && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="gap-2 text-muted-foreground hover:text-destructive"
                  onClick={clearStatement}
                  aria-label="Reset to demo data"
                >
                  <RefreshCw className="size-4" />
                  <span className="hidden sm:inline">Reset to demo data</span>
                </Button>
              )}
            </div>
          </div>
        </header>

        {/* Main Container */}
        <div className="mx-auto w-full max-w-7xl flex-1 space-y-8 px-4 py-6 sm:px-6 sm:py-10 lg:px-8">
          {isParsing ? (
            <div className="flex min-h-[calc(100dvh-9rem)] items-center justify-center">
              <LoadingState labels={PARSE_STEPS} />
            </div>
          ) : isLocked && statementFile ? (
            <div className="mx-auto w-full max-w-md py-12">
              <PinInput
                fileName={statementFile.name}
                onSubmit={handlePinSubmit}
                onCancel={clearStatement}
              />
            </div>
          ) : (
            <div className="w-full space-y-8 animate-in fade-in-50 duration-500">
              {/* Greeting */}
              <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
                <div className="space-y-1.5">
                  <h1 className="text-balance text-3xl font-semibold tracking-tight sm:text-4xl">
                    {greeting},{" "}
                    <span className="text-muted-foreground">
                      {statementData.customerName}
                    </span>
                  </h1>
                  <p className="text-sm text-muted-foreground">
                    {isCustomUploaded
                      ? "Showing your uploaded statement."
                      : "You're viewing sample data. Upload your statement to see your own."}
                  </p>
                </div>

                <div className="flex w-fit max-w-full flex-wrap items-center gap-x-2.5 gap-y-1 rounded-2xl border bg-card/80 py-2 pl-3.5 pr-2 text-xs text-muted-foreground backdrop-blur">
                  <Receipt className="size-3.5 shrink-0 text-foreground" />
                  <span className="whitespace-nowrap font-medium text-foreground">
                    M-PESA statement
                  </span>
                  <span className="whitespace-nowrap tabular-nums">
                    {statementData.statementPeriod}
                  </span>
                  <Badge
                    variant={isCustomUploaded ? "default" : "secondary"}
                    className="shrink-0 text-[10px]"
                  >
                    {isCustomUploaded ? "Live parse" : "Demo mode"}
                  </Badge>
                  <HelpIcon content="The statement currently loaded. 'Demo mode' is sample data; 'Live parse' is your own uploaded statement, processed in your browser." />
                </div>
              </div>

              {/* Tabs & Date range */}
              <Tabs
                defaultValue="overview"
                value={activeTab}
                className="flex w-full flex-col gap-6"
                onValueChange={(v) => setActiveTab(v as any)}
              >
                <div className="flex flex-col items-stretch justify-between gap-3 sm:flex-row sm:items-center">
                  <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:overflow-visible sm:px-0">
                    <TabsList className="inline-flex h-11 items-center justify-start gap-1 rounded-xl bg-muted/70 p-1 text-muted-foreground">
                      <TabsTrigger value="overview" className={tabTrigger}>
                        <LayoutDashboard className="size-3.5" />
                        Overview
                      </TabsTrigger>
                      <TabsTrigger value="transactions" className={tabTrigger}>
                        <ListOrdered className="size-3.5" />
                        Ledger
                      </TabsTrigger>
                      <TabsTrigger value="contacts" className={tabTrigger}>
                        <Users className="size-3.5" />
                        Connections
                      </TabsTrigger>
                      <TabsTrigger value="insights" className={tabTrigger}>
                        <Sparkles className="size-3.5" />
                        Insights
                      </TabsTrigger>
                    </TabsList>
                  </div>

                  <DateRangePicker
                    value={dateRange}
                    onChange={(range) => setDateRange(range)}
                  />
                </div>

                {/* --- TAB 1: OVERVIEW --- */}
                <TabsContent
                  value="overview"
                  className="mt-0 w-full space-y-6 animate-in fade-in-50"
                >
                  {/* Hero: where you stand */}
                  <div className="overflow-hidden rounded-3xl border bg-card">
                    <div className="grid lg:grid-cols-[1.25fr_1fr]">
                      <Tip
                        content="Net cash flow is money received minus money sent in the selected period. Positive means you took in more than you spent."
                        className="rounded-none rounded-t-3xl lg:rounded-l-3xl lg:rounded-tr-none"
                      >
                        <div className="relative h-full p-6 sm:p-8">
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            {metrics.netCashFlow >= 0 ? (
                              <TrendingUp
                                className={cn("size-4", TONES.emerald.text)}
                              />
                            ) : (
                              <TrendingDown
                                className={cn("size-4", TONES.rose.text)}
                              />
                            )}
                            Net cash flow
                          </div>
                          <p
                            className={cn(
                              "mt-3 text-4xl font-semibold tracking-tight tabular-nums sm:text-5xl",
                              metrics.netCashFlow >= 0
                                ? TONES.emerald.text
                                : TONES.rose.text,
                            )}
                          >
                            <span className="mr-2 text-lg font-medium text-muted-foreground sm:text-xl">
                              KSh
                            </span>
                            {money(Math.abs(metrics.netCashFlow))}
                          </p>
                          <p className="mt-2 text-xs text-muted-foreground">
                            {metrics.netCashFlow >= 0
                              ? "You received more than you sent"
                              : "You sent more than you received"}
                            {" · "}
                            {metrics.transactionCount} transactions
                          </p>

                          {/* In vs out split */}
                          <div className="mt-8 space-y-2">
                            <div className="flex h-2.5 w-full overflow-hidden rounded-full bg-muted">
                              <div
                                className="h-full bg-emerald-500 transition-all duration-700"
                                style={{ width: `${inPct}%` }}
                              />
                              <div
                                className="h-full bg-rose-500 transition-all duration-700"
                                style={{ width: `${100 - inPct}%` }}
                              />
                            </div>
                            <div className="flex justify-between text-xs text-muted-foreground tabular-nums">
                              <span>{inPct.toFixed(0)}% in</span>
                              <span>{(100 - inPct).toFixed(0)}% out</span>
                            </div>
                          </div>
                        </div>
                      </Tip>

                      <div className="grid grid-cols-2 border-t lg:grid-cols-1 lg:border-l lg:border-t-0">
                        <Tip
                          content="Everything that came into your M-PESA in this period: transfers received, deposits, reversals."
                          className="rounded-none"
                        >
                          <div className="flex h-full flex-col justify-center border-r p-5 sm:p-6 lg:border-b lg:border-r-0">
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <IconChip tone="emerald">
                                <ArrowDownLeft className="size-4" />
                              </IconChip>
                              Received
                            </div>
                            <p
                              className={cn(
                                "mt-3 break-all text-xl font-semibold tabular-nums sm:text-2xl",
                                TONES.emerald.text,
                              )}
                            >
                              <span className="mx-1 text-xs font-medium opacity-70">
                                KSh
                              </span>
                              {money(metrics.totalPaidIn)}
                            </p>
                          </div>
                        </Tip>
                        <Tip
                          content="Everything that left your M-PESA in this period: sends, payments, withdrawals, airtime and charges."
                          className="rounded-none rounded-br-3xl"
                        >
                          <div className="flex h-full flex-col justify-center p-5 sm:p-6">
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <IconChip tone="rose">
                                <ArrowUpRight className="size-4" />
                              </IconChip>
                              Sent
                            </div>
                            <p
                              className={cn(
                                "mt-3 break-all text-xl font-semibold tabular-nums sm:text-2xl",
                                TONES.rose.text,
                              )}
                            >
                              <span className="mx-1 text-xs font-medium opacity-70">
                                KSh
                              </span>
                              {money(metrics.totalPaidOut)}
                            </p>
                          </div>
                        </Tip>
                      </div>
                    </div>
                  </div>

                  {/* Secondary stats */}
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                    <StatCard
                      tone="amber"
                      icon={<Banknote className="size-4" />}
                      label="Transaction fees"
                      value={`KSh ${money(metrics.totalFees)}`}
                      hint="Charges and tariffs paid"
                      tip="The total M-PESA charged you in transaction fees and tariffs (send, withdraw, pay bill) during this period."
                    />
                    <StatCard
                      tone="primary"
                      icon={<Receipt className="size-4" />}
                      label="Transactions"
                      value={`${metrics.transactionCount}`}
                      hint="Recorded in this range"
                      tip="The number of individual entries on your statement within the selected date range, including both money in and out."
                    />
                    <StatCard
                      tone="primary"
                      icon={<Wallet className="size-4" />}
                      label="Average payment"
                      value={`KSh ${money(metrics.avgOutgoing)}`}
                      hint="Typical size of money sent"
                      tip="Total money sent divided by the number of outgoing transactions. It shows how large your typical payment is."
                    />
                  </div>

                  <Charts transactions={dateFilteredTransactions} />

                  <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                    <SectionCard
                      title="Where your money goes"
                      description="Money sent, grouped by what it was used for"
                      tip="Each outgoing transaction is sorted into a type (Send Money, PayBill, Airtime, Withdrawals, Charges...) and shown as a share of everything you sent."
                    >
                      {spendingCategories.length === 0 ? (
                        <p className="py-10 text-center text-sm text-muted-foreground">
                          No outgoing transactions in this period.
                        </p>
                      ) : (
                        <>
                          {/* Stacked overview bar */}
                          <div className="mb-6 flex h-2.5 w-full overflow-hidden rounded-full bg-muted">
                            {spendingCategories.map((cat, i) => (
                              <div
                                key={cat.name}
                                className={cn(
                                  "h-full",
                                  BAR_COLORS[i % BAR_COLORS.length],
                                )}
                                style={{ width: `${cat.percentage}%` }}
                              />
                            ))}
                          </div>
                          <ul className="space-y-4">
                            {spendingCategories.map((cat, i) => (
                              <li key={cat.name} className="space-y-1.5">
                                <div className="flex items-center justify-between gap-3 text-sm">
                                  <span className="flex min-w-0 items-center gap-2 font-medium">
                                    <span
                                      className={cn(
                                        "size-2.5 shrink-0 rounded-full",
                                        BAR_COLORS[i % BAR_COLORS.length],
                                      )}
                                    />
                                    <span className="truncate">{cat.name}</span>
                                    <span className="text-xs font-normal text-muted-foreground">
                                      {cat.count}
                                    </span>
                                  </span>
                                  <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
                                    KSh {money(cat.amount)}{" "}
                                    <span className="text-foreground">
                                      {cat.percentage.toFixed(1)}%
                                    </span>
                                  </span>
                                </div>
                                <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                                  <div
                                    className={cn(
                                      "h-full rounded-full transition-all duration-500",
                                      BAR_COLORS[i % BAR_COLORS.length],
                                    )}
                                    style={{ width: `${cat.percentage}%` }}
                                  />
                                </div>
                              </li>
                            ))}
                          </ul>
                        </>
                      )}
                    </SectionCard>

                    <SectionCard
                      title="Official statement summary"
                      description="Totals as printed by Safaricom on your statement"
                      tip="These figures come straight from the summary block of your PDF, not from our calculations. Use them to cross-check the numbers above."
                    >
                      <div className="-mx-1 overflow-x-auto">
                        <table className="w-full min-w-[320px] text-left text-xs">
                          <thead className="border-b border-border/60 text-muted-foreground">
                            <tr>
                              <th className="px-3 py-2.5 font-medium">
                                Category
                              </th>
                              <th className="px-3 py-2.5 text-right font-medium">
                                Paid in
                              </th>
                              <th className="px-3 py-2.5 text-right font-medium">
                                Paid out
                              </th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-border/40 tabular-nums">
                            {statementData.summary.length === 0 ? (
                              <tr>
                                <td
                                  colSpan={3}
                                  className="py-10 text-center text-muted-foreground"
                                >
                                  No summary rows provided.
                                </td>
                              </tr>
                            ) : (
                              statementData.summary.map((row) => (
                                <tr
                                  key={row.category}
                                  className="transition-colors hover:bg-muted/40"
                                >
                                  <td className="px-3 py-2.5 font-medium">
                                    {row.category}
                                  </td>
                                  <td
                                    className={cn(
                                      "px-3 py-2.5 text-right",
                                      row.paidIn > 0
                                        ? TONES.emerald.text
                                        : "text-muted-foreground",
                                    )}
                                  >
                                    {row.paidIn > 0
                                      ? money(row.paidIn)
                                      : "0.00"}
                                  </td>
                                  <td
                                    className={cn(
                                      "px-3 py-2.5 text-right",
                                      row.paidOut > 0
                                        ? TONES.rose.text
                                        : "text-muted-foreground",
                                    )}
                                  >
                                    {row.paidOut > 0
                                      ? money(row.paidOut)
                                      : "0.00"}
                                  </td>
                                </tr>
                              ))
                            )}
                          </tbody>
                        </table>
                      </div>
                    </SectionCard>
                  </div>
                </TabsContent>

                {/* --- TAB 2: TRANSACTION LEDGER --- */}
                <TabsContent
                  value="transactions"
                  className="mt-0 w-full animate-in fade-in-50"
                >
                  <div className="overflow-hidden rounded-2xl border bg-card">
                    <div className="flex flex-col gap-3 border-b border-border/60 p-4 sm:p-5 lg:flex-row lg:items-center lg:justify-between">
                      <div className="relative w-full lg:max-w-sm">
                        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          id={searchInputId}
                          placeholder="Search details or receipt number"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="pl-9 text-sm"
                        />
                      </div>

                      <div className="flex items-center gap-2">
                        <div className="-mx-1 flex flex-1 items-center gap-2 overflow-x-auto px-1 lg:flex-none">
                          {(
                            [
                              ["all", "All"],
                              ["in", "Money in"],
                              ["out", "Money out"],
                              ["fees", "Fees"],
                            ] as const
                          ).map(([key, label]) => (
                            <Button
                              key={key}
                              variant={
                                typeFilter === key ? "default" : "outline"
                              }
                              size="sm"
                              onClick={() => setTypeFilter(key)}
                              className="shrink-0 rounded-full text-xs"
                            >
                              {label}
                            </Button>
                          ))}
                        </div>

                        <DropdownMenu>
                          <DropdownMenuTrigger
                            render={
                              <Button
                                variant="outline"
                                size="sm"
                                className="gap-1.5 text-xs"
                              />
                            }
                          >
                            <Filter className="size-3.5" />
                            Sort
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => setSortBy("date-desc")}
                            >
                              Newest first
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => setSortBy("date-asc")}
                            >
                              Oldest first
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => setSortBy("amount-desc")}
                            >
                              Highest amount
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => setSortBy("amount-asc")}
                            >
                              Lowest amount
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>

                    {filteredLedgerTransactions.length === 0 ? (
                      <p className="py-16 text-center text-sm text-muted-foreground">
                        No transactions match your filters. Try clearing the
                        search or widening the date range.
                      </p>
                    ) : (
                      <>
                        {/* Mobile: stacked rows */}
                        <ul className="divide-y divide-border/40 md:hidden">
                          {filteredLedgerTransactions.map((tx, idx) => {
                            const isIn = tx.paidIn > 0;
                            return (
                              <li key={idx} className="flex gap-3 p-4">
                                <IconChip tone={isIn ? "emerald" : "rose"}>
                                  {isIn ? (
                                    <ArrowDownLeft className="size-4" />
                                  ) : (
                                    <ArrowUpRight className="size-4" />
                                  )}
                                </IconChip>
                                <div className="min-w-0 flex-1">
                                  <p className="line-clamp-2 text-sm font-medium leading-snug">
                                    {tx.details}
                                  </p>
                                  <p className="mt-1 text-xs text-muted-foreground">
                                    {tx.completionTime}
                                  </p>
                                  <div className="mt-2 flex items-center gap-2">
                                    <span className="font-mono text-[11px] text-muted-foreground">
                                      {tx.receiptNo}
                                    </span>
                                    <StatusPill status={tx.status} />
                                  </div>
                                </div>
                                <div className="shrink-0 text-right">
                                  <p
                                    className={cn(
                                      "text-sm font-semibold tabular-nums",
                                      isIn
                                        ? TONES.emerald.text
                                        : TONES.rose.text,
                                    )}
                                  >
                                    {money(isIn ? tx.paidIn : tx.withdrawn)}
                                  </p>
                                  <p className="mt-1 text-[11px] tabular-nums text-muted-foreground">
                                    Bal {money(tx.balance)}
                                  </p>
                                </div>
                              </li>
                            );
                          })}
                        </ul>

                        {/* Desktop: table */}
                        <div className="hidden max-h-[640px] overflow-auto md:block">
                          <table className="w-full text-left text-sm">
                            <thead className="sticky top-0 z-10 bg-muted/80 text-xs text-muted-foreground backdrop-blur">
                              <tr>
                                <th className="px-4 py-3 font-medium">
                                  Receipt
                                </th>
                                <th className="px-4 py-3 font-medium">
                                  Completed
                                </th>
                                <th className="px-4 py-3 font-medium">
                                  Details
                                </th>
                                <th className="px-4 py-3 font-medium">
                                  Status
                                </th>
                                <th className="px-4 py-3 text-right font-medium">
                                  Paid in
                                </th>
                                <th className="px-4 py-3 text-right font-medium">
                                  Withdrawn
                                </th>
                                <th className="px-4 py-3 text-right font-medium">
                                  Balance
                                </th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-border/40">
                              {filteredLedgerTransactions.map((tx, idx) => (
                                <tr
                                  key={idx}
                                  className="transition-colors hover:bg-muted/40"
                                >
                                  <td className="px-4 py-3 font-mono text-xs font-medium">
                                    {tx.receiptNo}
                                  </td>
                                  <td className="whitespace-nowrap px-4 py-3 text-xs text-muted-foreground">
                                    {tx.completionTime}
                                  </td>
                                  <td
                                    className="max-w-xs truncate px-4 py-3 text-xs"
                                    title={tx.details}
                                  >
                                    {tx.details}
                                  </td>
                                  <td className="px-4 py-3">
                                    <StatusPill status={tx.status} />
                                  </td>
                                  <td
                                    className={cn(
                                      "px-4 py-3 text-right font-mono text-xs tabular-nums",
                                      TONES.emerald.text,
                                    )}
                                  >
                                    {tx.paidIn > 0 ? money(tx.paidIn) : "–"}
                                  </td>
                                  <td
                                    className={cn(
                                      "px-4 py-3 text-right font-mono text-xs tabular-nums",
                                      TONES.rose.text,
                                    )}
                                  >
                                    {tx.withdrawn > 0
                                      ? money(tx.withdrawn)
                                      : "–"}
                                  </td>
                                  <td className="px-4 py-3 text-right font-mono text-xs font-semibold tabular-nums">
                                    KSh {money(tx.balance)}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </>
                    )}

                    <div className="border-t border-border/60 bg-muted/30 px-4 py-2.5 text-xs text-muted-foreground sm:px-5">
                      Showing {filteredLedgerTransactions.length} of{" "}
                      {dateFilteredTransactions.length} transactions
                    </div>
                  </div>
                </TabsContent>

                {/* --- TAB 3: CONNECTIONS --- */}
                <TabsContent
                  value="contacts"
                  className="mt-0 w-full animate-in fade-in-50"
                >
                  {" "}
                  <ConnectionsTab connections={contactsAnalysis} />
                </TabsContent>

                {/* --- TAB 4: INSIGHTS --- */}
                <TabsContent
                  value="insights"
                  className="mt-0 w-full animate-in fade-in-50"
                >
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <Tip content="The person or business that sent you the most money in this period.">
                      <div className="h-full rounded-2xl border bg-card p-6 transition-colors hover:border-foreground/20">
                        <div className="flex items-center gap-3">
                          <IconChip tone="emerald">
                            <ArrowDownLeft className="size-4" />
                          </IconChip>
                          <span className="text-sm font-semibold">
                            Biggest sender
                          </span>
                        </div>
                        {contactsAnalysis.topReceived[0] ? (
                          <>
                            <div className="mt-5 flex items-center gap-3">
                              <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                                {initials(contactsAnalysis.topReceived[0].name)}
                              </div>
                              <div className="min-w-0">
                                <p className="truncate text-lg font-semibold tracking-tight">
                                  {contactsAnalysis.topReceived[0].name}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {contactsAnalysis.topReceived[0].count}{" "}
                                  {contactsAnalysis.topReceived[0].count === 1
                                    ? "transfer"
                                    : "transfers"}
                                </p>
                              </div>
                            </div>
                            <p
                              className={cn(
                                "mt-4 text-3xl font-semibold tracking-tight tabular-nums",
                                TONES.emerald.text,
                              )}
                            >
                              <span className="mx-1.5 text-base font-medium opacity-70">
                                KSh
                              </span>
                              {money(contactsAnalysis.topReceived[0].amount)}
                            </p>
                            <p
                              className={cn(
                                "mt-4 rounded-xl px-3 py-2 text-xs leading-relaxed",
                                TONES.emerald.chip,
                              )}
                            >
                              🙏 This one deserves a big thank-you. Maybe even a
                              coffee.
                            </p>
                          </>
                        ) : (
                          <p className="mt-5 text-sm leading-relaxed text-muted-foreground">
                            Nobody sent you money in this range. Time to drop
                            some hints.
                          </p>
                        )}
                      </div>
                    </Tip>

                    <Tip content="The person or business you sent the most money to in this period.">
                      <div className="h-full rounded-2xl border bg-card p-6 transition-colors hover:border-foreground/20">
                        <div className="flex items-center gap-3">
                          <IconChip tone="rose">
                            <ArrowUpRight className="size-4" />
                          </IconChip>
                          <span className="text-sm font-semibold">
                            Biggest recipient
                          </span>
                        </div>
                        {contactsAnalysis.topSent[0] ? (
                          <>
                            <div className="mt-5 flex items-center gap-3">
                              <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                                {initials(contactsAnalysis.topSent[0].name)}
                              </div>
                              <div className="min-w-0">
                                <p className="truncate text-lg font-semibold tracking-tight">
                                  {contactsAnalysis.topSent[0].name}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {contactsAnalysis.topSent[0].count}{" "}
                                  {contactsAnalysis.topSent[0].count === 1
                                    ? "transfer"
                                    : "transfers"}
                                </p>
                              </div>
                            </div>
                            <p
                              className={cn(
                                "mt-4 text-3xl font-semibold tracking-tight tabular-nums",
                                TONES.rose.text,
                              )}
                            >
                              <span className="mx-1.5 text-base font-medium opacity-70">
                                KSh
                              </span>
                              {money(contactsAnalysis.topSent[0].amount)}
                            </p>
                            <p
                              className={cn(
                                "mt-4 rounded-xl px-3 py-2 text-xs leading-relaxed",
                                TONES.rose.chip,
                              )}
                            >
                              💸 Your most loyal customer. Hope they at least
                              say thanks.
                            </p>
                          </>
                        ) : (
                          <p className="mt-5 text-sm leading-relaxed text-muted-foreground">
                            You haven&apos;t sent anyone money in this range.
                            Wallet intact, respect.
                          </p>
                        )}
                      </div>
                    </Tip>

                    <Tip content="Fees are what you pay M-PESA to move money. A lower share of your spending going to fees means you're sending more efficiently.">
                      <div className="h-full rounded-2xl border bg-card p-6 transition-colors hover:border-foreground/20">
                        <div className="flex items-center gap-3">
                          <IconChip tone="amber">
                            <Banknote className="size-4" />
                          </IconChip>
                          <span className="text-sm font-semibold">
                            Fee efficiency
                          </span>
                        </div>
                        <p
                          className={cn(
                            "mt-4 text-3xl font-semibold tracking-tight tabular-nums",
                            TONES.rose.text,
                          )}
                        >
                          KSh {money(metrics.totalFees)}
                        </p>
                        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                          paid in transaction tariffs, which is{" "}
                          <span className="font-medium text-foreground tabular-nums">
                            {feeShare.toFixed(1)}%
                          </span>{" "}
                          of everything you sent.
                        </p>
                      </div>
                    </Tip>

                    <Tip content="The category where most of your outgoing money went, and its share of total money sent.">
                      <div className="h-full rounded-2xl border bg-card p-6 transition-colors hover:border-foreground/20">
                        <div className="flex items-center gap-3">
                          <IconChip tone="primary">
                            <PieChart className="size-4" />
                          </IconChip>
                          <span className="text-sm font-semibold">
                            Top spending category
                          </span>
                        </div>
                        <p className="mt-4 text-3xl font-semibold tracking-tight">
                          {spendingCategories[0]?.name || "N/A"}
                        </p>
                        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                          accounts for{" "}
                          <span className="font-medium text-foreground tabular-nums">
                            {spendingCategories[0]?.percentage.toFixed(1) || 0}%
                          </span>{" "}
                          of the money you sent.
                        </p>
                      </div>
                    </Tip>

                    <Tip
                      className="md:col-span-2"
                      content="A quick health check: are you taking in more than you send out? Positive means you're building up, negative means you're drawing down."
                    >
                      <div className="h-full rounded-2xl border bg-card p-6 transition-colors hover:border-foreground/20">
                        <div className="flex items-center gap-3">
                          <IconChip
                            tone={metrics.netCashFlow >= 0 ? "emerald" : "rose"}
                          >
                            {metrics.netCashFlow >= 0 ? (
                              <TrendingUp className="size-4" />
                            ) : (
                              <TrendingDown className="size-4" />
                            )}
                          </IconChip>
                          <span className="text-sm font-semibold">
                            Cash flow health
                          </span>
                        </div>
                        <p
                          className={cn(
                            "mt-4 text-3xl font-semibold tracking-tight tabular-nums",
                            metrics.netCashFlow >= 0
                              ? TONES.emerald.text
                              : TONES.rose.text,
                          )}
                        >
                          KSh {metrics.netCashFlow.toLocaleString()}
                        </p>
                        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                          net across {metrics.transactionCount} recorded
                          transactions in the selected range.
                        </p>
                      </div>
                    </Tip>
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          )}
        </div>

        {!isParsing && <Footer />}
      </main>
    </TooltipProvider>
  );
}
