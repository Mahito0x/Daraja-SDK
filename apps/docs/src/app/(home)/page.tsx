import AuraContainer from "@/components/AuraContainer";
import { EndpointStatusBadge } from "@/components/Badge";
import { CodeTabs } from "@/components/CodeTabs";
import { CopyButton } from "@/components/Copy";
import { FlipWords } from "@/components/FlipWords";
import Footer from "@/components/Footer";
import {
  Astro,
  Bun,
  CloudflareWorkers,
  Deno,
  Expressjs,
  Fastify,
  GitHub,
  NPM,
  Nextjs,
  Nodejs,
  Remix,
  Svelte,
  TypeScript,
  Vercel,
} from "@/components/Icons";
import { InstallCommand } from "@/components/InstallCommand";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { GridPattern } from "@/components/ui/grid-pattern";
import { Marquee } from "@/components/ui/marquee";
import { getSponsors, getTopContributors } from "@/lib/github";
import { cn } from "@/lib/utils";
import {
  AlertTriangle,
  ArrowRight,
  ArrowUpRight,
  BoxesIcon,
  Building2,
  CheckCircle2,
  Clock,
  CloudCog,
  Code2,
  Code2Icon,
  ExternalLink,
  FileCode,
  GlobeIcon,
  Heart,
  KeyRound,
  KeyRoundIcon,
  PackageCheck,
  PackageXIcon,
  QrCode,
  ShieldCheck,
  Smartphone,
  UserCheck,
  Webhook,
  Wifi,
  type LucideIcon,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import React from "react";

const AURA_COLORS = ["#16A34A", "#22C55E", "#4ADE80", "#065F46"];

function Hero() {
  const DARAJA_ENDPOINTS = [
    "STK Push",
    "C2B",
    "B2C",
    "B2B",
    "Reversals",
    "Dynamic QR",
  ];

  return (
    <section className="relative isolate overflow-hidden">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:32px_32px]"
        style={{
          maskImage:
            "radial-gradient(ellipse 70% 60% at 50% 35%, black 20%, transparent 100%)",
          WebkitMaskImage:
            "radial-gradient(ellipse 70% 60% at 50% 35%, black 20%, transparent 100%)",
        }}
      />

      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-0 z-0 h-[420px] w-[820px] max-w-full -translate-x-1/2 rounded-full bg-primary/15 blur-[120px] dark:bg-primary/20"
      />

      <div className="relative z-10 mx-auto flex min-h-[560px] w-full max-w-7xl flex-col items-center justify-center px-5 py-16 text-center sm:min-h-[640px] sm:px-6 sm:py-20 lg:px-8">
        <div className="mt-6 flex max-w-4xl flex-col items-center">
          <h1 className="text-balance text-3xl font-bold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
            Ship M-Pesa{" "}
            <FlipWords
              words={DARAJA_ENDPOINTS}
              className="font-extrabold text-primary"
            />
            <br />
            in Lines, Not Hours
          </h1>

          <p className="mx-auto mt-4 max-w-2xl text-pretty text-sm leading-relaxed text-muted-foreground sm:text-base">
            A lightweight TypeScript client for Safaricom&apos;s Daraja API that
            runs anywhere <code>fetch</code> does. Automatic OAuth token
            refresh, EAT timestamp math, and typed payload normalization so you
            write payments logic, not boilerplate.
          </p>
        </div>

        <div className="mx-auto mt-8 flex w-full max-w-[320px] flex-col items-center gap-3">
          <div className="w-full">
            <InstallCommand packageName="@lumierelabs/daraja" />
          </div>

          <div className="grid w-full grid-cols-2 gap-2">
            <Link
              href="/docs/sdk"
              className="group flex h-9 w-full items-center justify-center gap-1.5 rounded-lg bg-primary px-3 text-xs font-medium text-primary-foreground shadow-lg shadow-primary/20 transition-colors hover:bg-primary/90"
            >
              <span>SDK Docs</span>
              <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
            </Link>

            <Link
              href="/docs/daraja"
              className="group flex h-9 w-full items-center justify-center gap-1.5 rounded-lg border border-border bg-background px-3 text-xs font-medium text-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
            >
              <span>API Reference</span>
              <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

interface Metric {
  value: string;
  label: string;
  description: string;
  icon: React.ReactNode;
}

export function SpecsBar() {
  const metrics: Metric[] = [
    {
      value: "0",
      label: "Runtime dependencies",
      description: "Not even a fetch polyfill.",
      icon: <PackageXIcon />,
    },
    {
      value: "100%",
      label: "TypeScript",
      description: "Every request and response, typed.",
      icon: <Code2Icon />,
    },
    {
      value: "Edge",
      label: "Runtime ready",
      description: "No Node-only APIs, runs anywhere.",
      icon: <GlobeIcon />,
    },
    {
      value: "OAuth 2.0",
      label: "Authentication",
      description: "Cached and refreshed for you.",
      icon: <KeyRoundIcon />,
    },
    {
      value: "ESM + CJS",
      label: "Module support",
      description: "Import or require, either works.",
      icon: <BoxesIcon />,
    },
  ];

  return (
    <section className="border-y border-border bg-muted/30">
      <div className="mx-auto grid max-w-6xl grid-cols-2 gap-y-6 py-6 md:grid-cols-5">
        {metrics.map((metric, index) => (
          <div
            key={metric.label}
            className={cn(
              "relative flex flex-col items-center justify-center p-3 text-center",
              "after:absolute after:inset-y-0 after:right-0 after:h-full after:w-px after:bg-gradient-to-b after:from-foreground/5 after:via-foreground/20 after:to-foreground/5",
              "[&_svg]:size-5 [&_svg]:text-primary",
              {
                "after:hidden": index === metrics.length - 1,
                "after:hidden md:after:block": index % 2 === 1,
              },
            )}
          >
            {metric.icon}
            <div className="mt-3 flex items-baseline gap-1.5">
              <span className="font-mono text-sm font-bold text-foreground md:text-base">
                {metric.value}
              </span>
              <span className="text-xs font-medium text-foreground md:text-sm">
                {metric.label}
              </span>
            </div>
            <p className="mt-1 text-center text-[11px] text-muted-foreground md:text-xs">
              {metric.description}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}

function CoreEngine() {
  const Arc = [
    {
      title: "OAuth 2.0 Lifecycle",
      icon: KeyRound,
      description:
        "Automates token acquisition, in-memory caching, and proactive background refresh with a 60-second buffer before expiry.",
    },
    {
      title: "EAT Timezone Sync",
      icon: Clock,
      description:
        "Normalizes timestamps to East Africa Time (UTC+3) and handles Base64 password derivation to prevent drift rejections.",
    },
    {
      title: "Webhook Payload Parsing",
      icon: Webhook,
      description:
        "Flattens nested Daraja callback arrays and stringified booleans into strongly typed TypeScript domain models.",
    },
    {
      title: "Pre-Flight Validation",
      icon: ShieldCheck,
      description:
        "Validates request structures, callback URL formats, and phone number prefixes before executing network requests.",
    },
    {
      title: "Edge Runtime Compatible",
      icon: CloudCog,
      description:
        "Built strictly on native Fetch API and AbortController without Node.js standard library dependencies.",
    },
    {
      title: "Zero Dependencies & Dual Build",
      icon: PackageCheck,
      description:
        "Ships with ESM and CJS outputs, zero third-party runtime dependencies, and full TypeScript declarations.",
    },
  ];

  return (
    <section className="relative overflow-hidden py-16 sm:py-24">
      <div className="mx-auto max-w-7xl px-5 sm:px-6 lg:px-8">
        <div className="mb-12 flex flex-col gap-6 border-b border-border pb-10 md:flex-row md:items-end md:justify-between">
          <div className="max-w-2xl">
            <span className="font-mono text-xs font-semibold uppercase tracking-wider text-primary">
              Under The Hood
            </span>
            <h2 className="mt-2 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              Core Engine Design
            </h2>
            <p className="mt-3 text-sm leading-6 text-muted-foreground sm:text-base">
              The tricky parts of Daraja integrations handled before you write a
              single line of application logic.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Arc.map((feature) => {
            const Icon = feature.icon;

            return (
              <div
                key={feature.title}
                className="group relative flex flex-col justify-between overflow-hidden rounded-xl border border-border bg-card/60 p-6 transition-all duration-300 hover:border-primary/40 hover:bg-card hover:shadow-xl hover:shadow-primary/5"
              >
                <div className="pointer-events-none absolute inset-0 size-full opacity-40 transition-opacity duration-300 group-hover:opacity-80 [mask-image:radial-gradient(farthest-side_at_top_left,white,transparent)]">
                  <GridPattern
                    className="absolute inset-0 size-full stroke-foreground/20"
                    height={32}
                    width={32}
                    x={10}
                    y={10}
                  />
                </div>

                <div className="relative z-10 flex items-center justify-between">
                  <div className="flex size-11 items-center justify-center rounded-lg border border-border bg-muted/60 text-primary transition-colors duration-300 group-hover:border-primary/30 group-hover:bg-primary/10">
                    <Icon className="size-5" strokeWidth={1.8} />
                  </div>
                </div>

                <div className="relative z-10 mt-8">
                  <h3 className="text-base font-semibold tracking-tight text-foreground">
                    {feature.title}
                  </h3>

                  <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                    {feature.description}
                  </p>
                </div>

                <div className="absolute inset-x-0 bottom-0 h-0.5 w-full bg-gradient-to-r from-transparent via-primary to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function EndpointCoverage() {
  type EndpointStatus = "working" | "upstream-issue";

  interface Endpoint {
    title: string;
    description: string;
    status: EndpointStatus;
    icon: LucideIcon;
  }

  const ENDPOINTS: Endpoint[] = [
    {
      title: "Authentication",
      description:
        "OAuth 2.0 tokens cached in memory and refreshed automatically before expiration.",
      status: "working",
      icon: KeyRound,
    },
    {
      title: "M-Pesa Express (STK Push)",
      description:
        "Send prompt requests to customer phones and query status via CheckoutRequestID.",
      status: "working",
      icon: Smartphone,
    },
    {
      title: "C2B Payments",
      description:
        "Register callback URLs and simulate customer PayBill or Till transactions.",
      status: "upstream-issue",
      icon: Building2,
    },
    {
      title: "B2C Account Top Up",
      description:
        "Disburse payments from Working/MMF accounts to customer phones or utility shortcodes.",
      status: "working",
      icon: Building2,
    },
    {
      title: "B2B Hakikisha",
      description:
        "Verify recipient business names and account shortcodes prior to fund transfers.",
      status: "working",
      icon: ShieldCheck,
    },
    {
      title: "Dynamic QR",
      description:
        "Generate scannable M-Pesa QR codes for merchant store checkouts.",
      status: "upstream-issue",
      icon: QrCode,
    },
    {
      title: "Mobile Data Bundles",
      description:
        "Purchase and query status for Safaricom internet bundle offerings.",
      status: "upstream-issue",
      icon: Wifi,
    },
    {
      title: "SIM Swap & IMSI",
      description:
        "Fraud check tools: evaluate last SIM swap timestamp and network age.",
      status: "working",
      icon: ShieldCheck,
    },
    {
      title: "Mobile Number Validation",
      description:
        "Confirm whether a phone number is an active, reachable Safaricom subscriber.",
      status: "working",
      icon: UserCheck,
    },
  ];

  return (
    <section className="relative overflow-hidden py-16 sm:py-24">
      <div className="mx-auto max-w-7xl px-5 sm:px-6 lg:px-8">
        <div className="mb-12 flex flex-col gap-8 border-b border-border pb-10 md:flex-row md:items-end md:justify-between">
          <div className="max-w-2xl">
            <span className="font-mono text-xs font-semibold uppercase tracking-wider text-primary">
              API Coverage
            </span>
            <h2 className="mt-2 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              Every Endpoint We&apos;ve
              <br className="hidden sm:block" /> Actually Tested.
            </h2>

            <p className="mt-4 max-w-xl text-sm leading-6 text-muted-foreground sm:text-base">
              Tested end to end against Safaricom&apos;s sandbox. When something
              fails because Daraja&apos;s own upstream server is down,
              that&apos;s transparently status-flagged.
            </p>
          </div>
        </div>

        <div className="overflow-hidden rounded-xl border border-border">
          <div className="grid grid-cols-1 gap-px bg-border sm:grid-cols-2 md:grid-cols-3">
            {ENDPOINTS.map((endpoint, index) => {
              const Icon = endpoint.icon;
              const isWorking = endpoint.status === "working";

              return (
                <div
                  key={endpoint.title}
                  className="group relative min-h-[210px] overflow-hidden bg-background p-6 transition-colors duration-300 hover:bg-accent/50 sm:min-h-[230px]"
                >
                  <div className="pointer-events-none absolute left-1/2 top-0 -ml-20 -mt-2 size-full [mask-image:radial-gradient(farthest-side_at_top,white,transparent)]">
                    <GridPattern
                      className="absolute inset-0 size-full stroke-foreground/20"
                      height={40}
                      width={40}
                      x={20}
                    />
                  </div>

                  <div className="absolute right-4 top-4 z-20">
                    <EndpointStatusBadge status={endpoint.status} />
                  </div>

                  {isWorking && (
                    <div className="absolute right-0 top-0 h-px w-16 bg-primary opacity-60" />
                  )}

                  <div className="relative z-10 flex h-full flex-col justify-between">
                    <div className="flex items-start justify-between gap-4">
                      <div
                        className={`flex size-10 shrink-0 items-center justify-center rounded-lg border transition-colors duration-300 ${
                          isWorking
                            ? "border-primary/20 bg-primary/10 text-primary"
                            : "border-amber-500/20 bg-amber-500/10 text-amber-600 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-400"
                        }`}
                      >
                        <Icon className="size-[18px]" strokeWidth={1.7} />
                      </div>
                    </div>

                    <div className="pt-6">
                      <div className="mb-2 flex items-center gap-2">
                        <span className="font-mono text-[10px] text-muted-foreground/60">
                          {String(index + 1).padStart(2, "0")}
                        </span>

                        <span className="h-px w-4 bg-border" />
                      </div>

                      <h3 className="text-[15px] font-semibold tracking-tight text-foreground">
                        {endpoint.title}
                      </h3>

                      <p className="mt-2 max-w-sm text-xs leading-5 text-muted-foreground">
                        {endpoint.description}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="relative mt-8 overflow-hidden rounded-xl border border-border bg-background px-6 py-5">
          <div className="relative z-10 flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span className="size-1.5 rounded-full bg-primary" />
                <h4 className="text-sm font-semibold text-foreground">
                  Missing an endpoint?
                </h4>
              </div>
              <p className="mt-1.5 max-w-2xl text-xs leading-5 text-muted-foreground">
                Reversals, generic B2C, generic B2B, and Account Balance
                wrappers are being finalized for the next minor release.
              </p>
            </div>

            <a
              href="https://github.com/Mahito0x/Daraja-SDK"
              target="_blank"
              rel="noopener noreferrer"
              className="group/link inline-flex shrink-0 items-center gap-1.5 text-xs font-semibold text-primary transition-colors hover:text-primary/80"
            >
              Track roadmap
              <ArrowUpRight className="size-3.5 transition-transform group-hover/link:-translate-y-0.5 group-hover/link:translate-x-0.5" />
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}

const CODES = {
  TypeScript: {
    icon: <TypeScript className="size-4" />,
    code: `import { Daraja } from "@lumierelabs/daraja"

const daraja = Daraja({
  consumerKey: process.env.DARAJA_CONSUMER_KEY!,
  consumerSecret: process.env.DARAJA_CONSUMER_SECRET!,
  shortcode: "174379",
  passkey: process.env.MPESA_PASSKEY!,
  callbackUrl: "https://example.com/api/callbacks/stk",
  environment: "sandbox",
})

const push = await daraja.stkPush({
  transactionType: "CustomerPayBillOnline",
  amount: 1,
  partyA: "254708374149",
  phoneNumber: "254708374149",
  accountReference: "INV-1042",
  transactionDesc: "Order #1042",
})

console.log(push.CheckoutRequestID)`,
  },
  "Next.js App Router": {
    icon: <Nextjs className="size-4" />,
    code: `import { Daraja } from "@lumierelabs/daraja"
import { NextResponse } from "next/server"

const daraja = Daraja({
  consumerKey: process.env.DARAJA_CONSUMER_KEY!,
  consumerSecret: process.env.DARAJA_CONSUMER_SECRET!,
  shortcode: process.env.MPESA_SHORTCODE!,
  passkey: process.env.MPESA_PASSKEY!,
  callbackUrl: "https://yourdomain.com/api/mpesa/callback",
})

export async function POST(req: Request) {
  const { phone, amount } = await req.json()

  const response = await daraja.stkPush({
    transactionType: "CustomerPayBillOnline",
    amount,
    partyA: phone,
    phoneNumber: phone,
    accountReference: "Checkout",
    transactionDesc: "Order Payment",
  })

  return NextResponse.json(response)
}`,
  },
  Express: {
    icon: <Expressjs className="size-4" />,
    code: `import express from "express"
import { Daraja } from "@lumierelabs/daraja"

const app = express()
app.use(express.json())

const daraja = Daraja({
  consumerKey: process.env.DARAJA_CONSUMER_KEY!,
  consumerSecret: process.env.DARAJA_CONSUMER_SECRET!,
  shortcode: "174379",
  passkey: process.env.MPESA_PASSKEY!,
  callbackUrl: "https://api.myapp.com/stk-callback",
})

app.post("/checkout", async (req, res) => {
  const result = await daraja.stkPush(req.body)
  res.json(result)
})`,
  },
  "Callback Webhook": {
    icon: <FileCode className="size-4" />,
    code: `import { parseStkCallback } from "@lumierelabs/daraja"
import { NextResponse } from "next/server"

export async function POST(req: Request) {
  const body = await req.json()

  // Safely parses and flattens Safaricom's raw CallbackMetadata array
  const result = parseStkCallback(body)

  if (result.success) {
    console.log("Payment completed!", result.data.mpesaReceiptNumber)
    // Update order status in DB
  } else {
    console.error("Payment failed:", result.error)
  }

  return NextResponse.json({ ResultCode: 0, ResultDesc: "Accepted" })
}`,
  },
};

export function UsageExamples() {
  return (
    <section className="border-b border-border">
      <div className="mx-auto w-full max-w-7xl px-5 py-16 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <span className="font-mono text-xs font-semibold uppercase tracking-wider text-primary">
              Integration Examples
            </span>
            <h2 className="mt-1 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              Clean API. Zero Boilerplate.
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Usage patterns across TypeScript, Next.js App Router, Express, and
              Callback Webhooks.
            </p>
          </div>

          <Link
            href="/docs/sdk"
            className="group inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            <span>See full SDK documentation</span>
            <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>

        <div className="relative w-full overflow-hidden rounded-2xl border border-border bg-card shadow-2xl">
          <CodeTabs lang="typescript" codes={CODES} />
        </div>
      </div>
    </section>
  );
}

function ComparisonSection() {
  const comparisonData = [
    {
      feature: "Zero Runtime Dependencies",
      daraja: true,
      darajaText: "0 dependencies",
      rawFetch: true,
      rawFetchText: "0 dependencies",
      others: false,
      othersText: "Multiple deps",
    },
    {
      feature: "Edge Runtime & Multi-Runtime (Workers / Vercel / Deno)",
      daraja: true,
      darajaText: "Native web fetch",
      rawFetch: true,
      rawFetchText: "Native web fetch",
      others: false,
      othersText: "Node.js only",
    },
    {
      feature: "OAuth 2.0 Token Caching & Auto-Refresh",
      daraja: true,
      darajaText: "Automatic in-memory",
      rawFetch: "Manual boilerplate",
      rawFetchText: "Manual boilerplate",
      others: "Partial",
      othersText: "Basic / Manual",
    },
    {
      feature: "EAT (UTC+3) Timezone Auto-Parsing",
      daraja: true,
      darajaText: "Auto-normalized Date",
      rawFetch: false,
      rawFetchText: "Raw string",
      others: false,
      othersText: "Raw string",
    },
    {
      feature: "Callback Payload Metadata Unwrapper",
      daraja: true,
      darajaText: "Clean key-value object",
      rawFetch: false,
      rawFetchText: "Nested Array parsing",
      others: false,
      othersText: "Nested Array parsing",
    },
    {
      feature: "End-to-End TypeScript Definitions",
      daraja: true,
      darajaText: "Strict types & inference",
      rawFetch: false,
      rawFetchText: "Manual `any` casting",
      others: "Partial",
      othersText: "Outdated types",
    },
  ];

  const renderStatus = (
    value: boolean | string,
    label?: string,
    isPrimary: boolean = false,
  ) => {
    if (value === true) {
      return (
        <div className="flex items-center gap-2">
          <div
            className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full ${
              isPrimary
                ? "bg-primary text-primary-foreground ring-2 ring-primary/20"
                : "bg-muted text-foreground"
            }`}
          >
            <svg
              className="h-2.5 w-2.5 stroke-[3]"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M4.5 12.75l6 6 9-13.5"
              />
            </svg>
          </div>
          {label && (
            <span
              className={`text-xs ${
                isPrimary
                  ? "font-semibold text-foreground"
                  : "text-muted-foreground"
              }`}
            >
              {label}
            </span>
          )}
        </div>
      );
    }

    if (typeof value === "string") {
      return (
        <div className="flex items-center gap-2">
          <div className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full border border-dashed border-border">
            <span className="h-0.5 w-1.5 rounded-full bg-muted-foreground" />
          </div>
          <span className="text-xs text-muted-foreground">
            {label || value}
          </span>
        </div>
      );
    }

    return (
      <div className="flex items-center gap-2">
        <div className="flex h-4 w-4 shrink-0 items-center justify-center text-muted-foreground">
          <svg
            className="h-3.5 w-3.5 stroke-[2.5]"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </div>
        {label && (
          <span className="text-xs text-muted-foreground">{label}</span>
        )}
      </div>
    );
  };

  return (
    <section className="bg-background py-16 text-foreground sm:py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl lg:text-4xl">
              Built in, not bolted on
            </h2>
            <p className="mt-2 max-w-xl text-xs text-muted-foreground sm:text-sm">
              How{" "}
              <code className="rounded border border-border bg-muted px-1.5 py-0.5 font-mono text-foreground">
                @lumierelabs/daraja
              </code>{" "}
              compares with raw HTTP fetch implementations and legacy Node-only
              SDK packages.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
            <div className="flex items-center gap-2">
              <div className="flex h-4 w-4 items-center justify-center rounded-full bg-primary text-primary-foreground">
                <svg
                  className="h-2.5 w-2.5 stroke-[3]"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M4.5 12.75l6 6 9-13.5"
                  />
                </svg>
              </div>
              <span className="font-medium text-foreground">Included</span>
            </div>

            <div className="flex items-center gap-2">
              <div className="flex h-4 w-4 items-center justify-center rounded-full border border-dashed border-border">
                <span className="h-0.5 w-1.5 rounded-full bg-muted-foreground" />
              </div>
              <span>Partial / Custom</span>
            </div>

            <div className="flex items-center gap-2">
              <div className="flex h-4 w-4 items-center justify-center text-muted-foreground">
                <svg
                  className="h-3.5 w-3.5 stroke-[2.5]"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </div>
              <span>Not supported</span>
            </div>
          </div>
        </div>

        <div className="mt-8 overflow-hidden rounded-xl border border-border bg-card shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[680px] border-collapse text-left text-xs sm:text-sm">
              <thead>
                <tr className="border-b border-border bg-card">
                  <th className="sticky left-0 z-20 w-2/5 bg-card p-4 font-mono text-[10px] font-semibold tracking-wider text-muted-foreground uppercase sm:p-5">
                    CAPABILITY
                  </th>

                  <th className="relative w-1/5 border-x border-border bg-primary/[0.06] p-4 sm:p-5">
                    <div className="absolute inset-x-0 top-0 h-0.5 bg-primary" />
                    <span className="font-mono text-xs font-bold tracking-tight text-foreground sm:text-sm">
                      @lumierelabs/daraja
                    </span>
                    <p className="mt-1 text-[11px] font-medium text-muted-foreground">
                      Modern TypeScript SDK
                    </p>
                  </th>

                  <th className="w-1/5 border-l border-border bg-card p-4 sm:p-5">
                    <span className="font-medium text-foreground/80">
                      Manual Native Fetch
                    </span>
                    <p className="mt-1 text-[11px] font-normal text-muted-foreground">
                      Raw HTTP requests
                    </p>
                  </th>

                  <th className="w-1/5 border-l border-border bg-card p-4 sm:p-5">
                    <span className="font-medium text-foreground/80">
                      Legacy Node SDKs
                    </span>
                    <p className="mt-1 text-[11px] font-normal text-muted-foreground">
                      Node-only packages
                    </p>
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-border">
                {comparisonData.map((item, idx) => (
                  <tr key={idx} className="transition-colors hover:bg-muted/40">
                    <td className="sticky left-0 z-10 bg-card p-4 font-medium text-foreground sm:p-5">
                      {item.feature}
                    </td>

                    <td className="border-x border-border bg-primary/[0.05] p-4 sm:p-5">
                      {renderStatus(item.daraja, item.darajaText, true)}
                    </td>

                    <td className="border-l border-border p-4 sm:p-5">
                      {renderStatus(item.rawFetch, item.rawFetchText)}
                    </td>

                    <td className="border-l border-border p-4 sm:p-5">
                      {renderStatus(item.others, item.othersText)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <p className="mt-4 text-[11px] text-muted-foreground">
          Assessment based on package specifications and public developer
          documentation, April 2026.
        </p>
      </div>
    </section>
  );
}

function RuntimeCompatibility() {
  const LOGO_COLUMN_1 = [
    { icon: Nodejs, name: "Node.js" },
    { icon: Nextjs, name: "Next.js" },
    { icon: Astro, name: "Astro" },
    { icon: Remix, name: "Remix" },
    { icon: Svelte, name: "SvelteKit" },
    { icon: Expressjs, name: "Express" },
  ];

  const LOGO_COLUMN_2 = [
    { icon: Fastify, name: "Fastify" },
    { icon: Vercel, name: "Vercel Edge" },
    { icon: CloudflareWorkers, name: "Cloudflare Workers" },
    { icon: Deno, name: "Deno" },
    { icon: Bun, name: "Bun" },
  ];

  return (
    <section className="relative overflow-hidden py-16 sm:py-20">
      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-12 px-5 sm:px-6 md:grid-cols-2 md:items-start lg:px-8">
        <div className="max-w-xl space-y-4 pt-2">
          <span className="font-mono text-xs font-semibold uppercase tracking-wider text-primary">
            Runtimes
          </span>
          <h2 className="text-3xl font-black tracking-tight text-foreground sm:text-4xl md:text-5xl">
            One Client. Every Runtime You Ship On.
          </h2>
          <p className="text-sm leading-relaxed text-muted-foreground sm:text-base">
            There&apos;s no Node-specific API anywhere in the client. Whatever
            you deploy on, from a single VPS to Cloudflare&apos;s edge network,
            the same code runs unchanged.
          </p>
        </div>

        <div className="relative flex h-[320px] w-full flex-row items-center justify-center gap-4 overflow-hidden rounded-2xl border border-border bg-muted/30 p-4 sm:h-[420px] sm:gap-6 [mask-image:linear-gradient(to_bottom,transparent,black_15%,black_85%,transparent)]">
          <Marquee
            vertical
            className="[--duration:30s] [--gap:1.5rem]"
            pauseOnHover
            repeat={4}
          >
            {LOGO_COLUMN_1.map((item, index) => {
              const Icon = item.icon;
              return (
                <div
                  key={`${item.name}-${index}`}
                  title={item.name}
                  className="group relative flex size-16 items-center justify-center rounded-2xl border border-border bg-card p-3 shadow-xs backdrop-blur-md transition-all duration-300 hover:scale-105 hover:border-primary/40 hover:shadow-md sm:size-20 sm:p-4"
                >
                  <Icon className="size-6 text-foreground transition-transform duration-300 group-hover:scale-110 sm:size-8" />
                </div>
              );
            })}
          </Marquee>

          <Marquee
            vertical
            reverse
            className="[--duration:30s] [--gap:1.5rem]"
            pauseOnHover
            repeat={4}
          >
            {LOGO_COLUMN_2.map((item, index) => {
              const Icon = item.icon;
              return (
                <div
                  key={`${item.name}-${index}`}
                  title={item.name}
                  className="group relative flex size-16 items-center justify-center rounded-2xl border border-border bg-card p-3 shadow-xs backdrop-blur-md transition-all duration-300 hover:scale-105 hover:border-primary/40 hover:shadow-md sm:size-20 sm:p-4"
                >
                  <Icon className="size-6 text-foreground transition-transform duration-300 group-hover:scale-110 sm:size-8" />
                </div>
              );
            })}
          </Marquee>
        </div>
      </div>
    </section>
  );
}

function DocsSpotlight() {
  const docsFeatures = [
    {
      title: "Every Field, Documented",
      description:
        "Request parameters, response shapes, and exact Safaricom error codes laid out per endpoint.",
      icon: Code2,
      tag: "Field-Level",
    },
    {
      title: "Defects Marked, Not Hidden",
      description:
        "Where Safaricom's docs contradict themselves or misspell field names, it's explicitly called out.",
      icon: AlertTriangle,
      tag: "Called Out",
    },
    {
      title: "Tested, Not Just Transcribed",
      description:
        "Endpoints are categorized as sandbox-tested or blocked by upstream issues rather than assumed supported.",
      icon: CheckCircle2,
      tag: "Status-Tracked",
    },
  ];

  return (
    <section className="relative overflow-hidden py-16 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-2xl border border-border bg-background p-5 sm:p-8 md:p-12">
          <div className="pointer-events-none absolute right-0 top-0 size-full [mask-image:radial-gradient(farthest-side_at_top_right,white,transparent)]">
            <GridPattern
              className="absolute inset-0 size-full stroke-foreground/20"
              height={40}
              width={40}
              x={20}
            />
          </div>

          <div className="relative z-10 grid grid-cols-1 gap-10 lg:grid-cols-12 lg:items-center lg:gap-12">
            <div className="lg:col-span-7">
              <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl md:text-5xl">
                Safaricom&apos;s Docs,{" "}
                <span className="text-primary">Rebuilt Properly.</span>
              </h2>

              <p className="mt-4 text-sm leading-relaxed text-muted-foreground sm:text-base">
                No more digging through scattered PDFs and portal pages. Every
                endpoint gets one clean, searchable guide.
              </p>

              <div className="mt-8 flex flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:gap-4">
                <Link
                  href="/docs/daraja"
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition-all hover:bg-primary/90 hover:shadow-lg hover:shadow-primary/20"
                >
                  Explore Documentation
                  <ArrowRight className="size-4" />
                </Link>

                <Link
                  href="/docs/daraja"
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-muted/60 px-5 py-3 text-sm font-semibold text-foreground transition-colors hover:bg-accent"
                >
                  View All Endpoints
                  <ExternalLink className="size-4 text-muted-foreground" />
                </Link>
              </div>
            </div>

            <div className="space-y-4 lg:col-span-5">
              {docsFeatures.map((item) => {
                const Icon = item.icon;

                return (
                  <div
                    key={item.title}
                    className="group relative overflow-hidden rounded-xl border border-border bg-muted/40 p-4 transition-all duration-300 hover:border-primary/40 hover:bg-muted/80 sm:p-5"
                  >
                    <div className="flex items-start gap-3.5 sm:gap-4">
                      <div className="flex size-10 shrink-0 items-center justify-center rounded-lg border border-primary/25 bg-primary/10 text-primary">
                        <Icon className="size-5" />
                      </div>

                      <div className="min-w-0 flex-1 space-y-1.5">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <h3 className="truncate text-sm font-semibold text-foreground">
                            {item.title}
                          </h3>
                          <span className="shrink-0 rounded-md border border-border bg-background px-2 py-0.5 font-mono text-[10px] font-medium text-muted-foreground">
                            {item.tag}
                          </span>
                        </div>

                        <p className="text-xs leading-relaxed text-muted-foreground">
                          {item.description}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

async function Contributors() {
  const contributors = await getTopContributors(100, "Mahito0x", "Daraja-SDK");

  if (!contributors || contributors.length === 0) {
    return null;
  }

  const [featured, ...others] = contributors;

  const totalContributions = contributors.reduce(
    (sum, contributor) => sum + contributor.contributions,
    0,
  );

  const placeholderCount = Math.max(0, 16 - others.length);
  const visibleContributors = others.slice(0, 48);

  return (
    <section className="border-t border-border">
      <div className="mx-auto max-w-7xl px-5 py-24 sm:px-6 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-[1fr_auto] lg:items-end">
          <div>
            <div className="mb-5 flex items-center gap-2 text-xs font-medium text-muted-foreground">
              <GitHub className="size-3.5" />
              <span>Open source contributors</span>
            </div>

            <h2 className="max-w-3xl text-4xl font-semibold tracking-[-0.04em] text-foreground sm:text-5xl">
              Built in public.
              <br />
              <span className="text-muted-foreground">
                Improved by everyone.
              </span>
            </h2>

            <p className="mt-5 max-w-xl text-sm leading-6 text-muted-foreground sm:text-[15px]">
              Every contribution helps make Daraja SDK more reliable, resilient,
              and developer-friendly.
            </p>
          </div>

          <Link
            href="https://github.com/Mahito0x/Daraja-SDK/graphs/contributors"
            target="_blank"
            rel="noopener noreferrer"
            className="group inline-flex h-10 items-center gap-2 rounded-lg border border-border px-3.5 text-xs font-medium text-foreground transition-colors hover:bg-accent"
          >
            <span>View contribution graph</span>
            <ArrowUpRight className="size-3.5 text-muted-foreground transition-transform duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
          </Link>
        </div>

        <AuraContainer
          className="mt-16 rounded-2xl"
          colors={AURA_COLORS}
          glowRadius={450}
        >
          <Card className="overflow-hidden rounded-2xl border-0 bg-card shadow-none">
            <div className="grid lg:grid-cols-[1.05fr_0.95fr]">
              <div className="relative border-b border-border p-7 sm:p-10 lg:border-b-0 lg:border-r">
                <div className="flex h-full flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                        Lead contributor
                      </span>

                      <span className="font-mono text-[11px] text-muted-foreground">
                        01
                      </span>
                    </div>

                    <div className="mt-10 flex items-center gap-5">
                      <Image
                        src={featured.avatar_url}
                        alt={featured.login}
                        width={88}
                        height={88}
                        className="size-[72px] rounded-2xl border border-border object-cover shadow-xs sm:size-[88px]"
                      />

                      <div className="min-w-0">
                        <h3 className="truncate text-xl font-semibold tracking-tight text-foreground">
                          {featured.login}
                        </h3>

                        <p className="mt-1 text-sm text-muted-foreground">
                          Core contributor
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-12">
                    <div className="flex items-end justify-between gap-6">
                      <div>
                        <div className="font-mono text-4xl font-medium tracking-[-0.04em] text-foreground">
                          {featured.contributions.toLocaleString()}
                        </div>

                        <div className="mt-1 text-xs text-muted-foreground">
                          {featured.contributions === 1
                            ? "contribution"
                            : "contributions"}
                        </div>
                      </div>

                      <Link
                        href={featured.html_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group/cta inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground"
                      >
                        GitHub
                        <ArrowUpRight className="size-3.5 transition-transform duration-200 group-hover/cta:-translate-y-0.5 group-hover/cta:translate-x-0.5" />
                      </Link>
                    </div>

                    <div className="mt-7 h-px bg-border" />

                    <div className="mt-4 flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">
                        Repository contributors
                      </span>

                      <span className="font-mono text-foreground">
                        {contributors.length}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-7 sm:p-10">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                      The community
                    </span>

                    <p className="mt-2 text-sm text-muted-foreground">
                      {contributors.length === 1
                        ? "One developer behind the project. Spot open for contributors."
                        : `${contributors.length} developers contributing to the project.`}
                    </p>
                  </div>

                  <span className="font-mono text-[11px] text-muted-foreground">
                    {totalContributions.toLocaleString()} total
                  </span>
                </div>

                <div className="mt-8 grid grid-cols-6 gap-2.5 sm:grid-cols-8">
                  {visibleContributors.map((contributor) => (
                    <Link
                      key={contributor.id}
                      href={contributor.html_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      title={`${contributor.login} · ${
                        contributor.contributions
                      } ${
                        contributor.contributions === 1
                          ? "contribution"
                          : "contributions"
                      }`}
                      className="group relative aspect-square overflow-hidden rounded-xl border border-border bg-muted transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-xs"
                    >
                      <Image
                        src={contributor.avatar_url}
                        alt={contributor.login}
                        fill
                        sizes="64px"
                        className="object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                    </Link>
                  ))}

                  {Array.from({ length: placeholderCount }).map((_, i) => (
                    <div
                      key={`skeleton-${i}`}
                      className="relative flex aspect-square items-center justify-center overflow-hidden rounded-xl border border-dashed border-border bg-muted/30"
                    >
                      <div className="size-2 animate-pulse rounded-full bg-border" />
                    </div>
                  ))}
                </div>

                {others.length > visibleContributors.length ? (
                  <div className="mt-7 flex items-center justify-between border-t border-border pt-5">
                    <span className="text-xs text-muted-foreground">
                      Showing top {visibleContributors.length} contributors
                    </span>

                    <Link
                      href="https://github.com/Mahito0x/Daraja-SDK/graphs/contributors"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group inline-flex items-center gap-1.5 text-xs font-medium text-foreground"
                    >
                      +{others.length - visibleContributors.length} more
                      <ArrowUpRight className="size-3.5 text-muted-foreground transition-transform duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                    </Link>
                  </div>
                ) : (
                  <div className="mt-7 flex items-center justify-between border-t border-border pt-5 text-xs text-muted-foreground">
                    <span>Open community slots</span>
                    <Link
                      href="https://github.com/Mahito0x/Daraja-SDK"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-medium text-foreground hover:underline"
                    >
                      Be the next contributor →
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </Card>
        </AuraContainer>
      </div>
    </section>
  );
}

async function Sponsors() {
  const sponsors = await getSponsors(undefined, 20);

  if (!sponsors || sponsors.length === 0) {
    return null;
  }

  const [featured, ...others] = sponsors;
  const featuredName = featured.name || featured.login;

  return (
    <section className="border-t border-border">
      <div className="mx-auto max-w-7xl px-5 py-24 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <div className="mb-5 flex items-center gap-2.5 text-xs font-medium text-muted-foreground">
              <span className="flex size-5 items-center justify-center rounded-md border border-border bg-muted shadow-2xs">
                <Heart className="size-3 text-rose-500" />
              </span>

              <span>Supported by</span>

              <span className="font-mono text-[11px] font-semibold text-foreground">
                {sponsors.length}{" "}
                {sponsors.length === 1 ? "sponsor" : "sponsors"}
              </span>
            </div>

            <h2 className="text-4xl font-semibold tracking-[-0.05em] text-foreground sm:text-5xl">
              Backing open source.
              <br />
              <span className="text-primary">Supporting what comes next.</span>
            </h2>

            <p className="mt-5 max-w-xl text-sm leading-6 text-muted-foreground sm:text-[15px]">
              Daraja SDK is made possible by developers and companies supporting
              open-source software.
            </p>
          </div>

          <Link
            href="https://github.com/Mahito0x/Daraja-SDK"
            target="_blank"
            rel="noopener noreferrer"
            className="group inline-flex h-10 w-fit items-center gap-2 rounded-lg border border-border bg-muted/60 px-4 text-xs font-medium text-foreground shadow-xs transition-colors hover:bg-accent"
          >
            <span>Become a sponsor</span>
            <ArrowUpRight className="size-3.5 transition-transform duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
          </Link>
        </div>

        <div className="relative mt-16 pb-12">
          <div className="relative z-20">
            <AuraContainer
              className="rounded-2xl"
              colors={AURA_COLORS}
              glowRadius={450}
            >
              <Card className="rounded-2xl border-0 bg-card shadow-none">
                <CardContent className="relative p-0 pb-16">
                  <Link
                    href={featured.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`group relative block overflow-hidden ${
                      others.length > 0 ? "border-b border-border" : ""
                    }`}
                  >
                    <div className="relative z-10 flex min-h-[280px] flex-col items-center justify-center px-6 py-16 text-center sm:min-h-[320px] sm:px-10">
                      <div className="mb-8 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                        <span className="size-1.5 animate-pulse rounded-full bg-primary" />
                        Featured sponsor
                      </div>

                      <div className="size-24 overflow-hidden rounded-2xl shadow-md transition-transform duration-300 group-hover:-translate-y-1">
                        <Image
                          src={featured.avatarUrl}
                          alt={featuredName}
                          width={96}
                          height={96}
                          className="size-full object-cover"
                        />
                      </div>

                      <div className="mt-7 flex items-center gap-2">
                        <h3 className="text-xl font-semibold tracking-[-0.02em] text-foreground transition-colors group-hover:text-primary">
                          {featuredName}
                        </h3>
                      </div>

                      <p className="mt-1.5 font-mono text-xs text-muted-foreground">
                        @{featured.login}
                      </p>

                      {featured.tier && (
                        <Badge
                          variant="outline"
                          className="mt-4 text-[10px] font-medium"
                        >
                          {featured.tier.name}
                        </Badge>
                      )}
                    </div>
                  </Link>

                  {others.length > 0 && (
                    <div className="relative">
                      <div className="relative z-10">
                        <div className="flex items-center justify-between border-b border-border bg-card/50 px-6 py-4 backdrop-blur-xs sm:px-8">
                          <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                            More supporters
                          </span>

                          <span className="font-mono text-[10px] font-medium text-foreground">
                            {others.length}
                          </span>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                          {others.map((sponsor) => {
                            const name = sponsor.name || sponsor.login;

                            return (
                              <Link
                                key={sponsor.id}
                                href={sponsor.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                title={name}
                                className="group relative flex min-h-[150px] items-center justify-center border-b border-r border-border bg-card/80 transition-all hover:bg-muted/50"
                              >
                                <div className="flex flex-col items-center gap-3 px-4">
                                  <div className="size-12 overflow-hidden rounded-xl shadow-xs transition-transform duration-200 group-hover:scale-105">
                                    <Image
                                      src={sponsor.avatarUrl}
                                      alt={name}
                                      width={48}
                                      height={48}
                                      className="size-full object-cover"
                                    />
                                  </div>

                                  <span className="max-w-full truncate text-center text-xs font-medium text-foreground transition-colors">
                                    {name}
                                  </span>
                                </div>
                              </Link>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </AuraContainer>
          </div>
        </div>
      </div>
    </section>
  );
}

function TechnicalFAQ() {
  const questions = [
    {
      id: "item-1",
      title:
        "Is this SDK compatible with Edge runtimes (Vercel, Cloudflare Workers, Deno)?",
      content:
        "Yes. The SDK is built strictly using native Fetch API and AbortController with zero Node.js standard library dependencies, making it fully compatible with Vercel Edge, Cloudflare Workers, Deno, and Bun.",
    },
    {
      id: "item-2",
      title: "How does the SDK handle token expiration and automatic refresh?",
      content:
        "The SDK caches the OAuth 2.0 token in memory and proactively triggers a background refresh 60 seconds before expiration to eliminate request drops.",
    },
    {
      id: "item-3",
      title: "How does the SDK handle EAT (UTC+3) timestamp normalization?",
      content:
        "Daraja requires strict East Africa Time (UTC+3) timestamps for STK Push and security credential generation. The SDK normalizes dates to UTC+3 automatically regardless of your server's local timezone.",
    },
    {
      id: "item-4",
      title:
        "Why am I not receiving callbacks on my ResultURL or ConfirmationURL?",
      content:
        "Make sure your callback endpoint is publicly reachable over HTTPS with a valid domain or public IP. Localhost URLs, self-signed SSL certificates, or endpoints blocked by strict firewalls cause callback delivery to fail silently.",
    },
    {
      id: "item-5",
      title:
        "Why am I getting an 'initiator information is invalid' error on B2C or B2B?",
      content:
        "This indicates invalid API user credentials. Verify InitiatorName, ensure the API user password was activated on the M-PESA Organization Portal, and confirm encryption uses Safaricom's public certificate.",
    },
    {
      id: "item-6",
      title:
        "Why do I get an 'insufficient balance' error when sending B2C payouts?",
      content:
        "B2C debits your Utility account specifically, not your MMF or Working account. Transfer funds into the Utility account via the M-PESA portal or B2B API prior to disbursing payouts.",
    },
    {
      id: "item-7",
      title: "Can I use a Buy Goods Till Number for STK Push / M-PESA Express?",
      content:
        "Yes. Set BusinessShortCode to your store/head-office code, and set PartyB to the individual Till Number.",
    },
    {
      id: "item-8",
      title:
        "How often should I register C2B validation and confirmation URLs?",
      content:
        "In sandbox, re-register prior to test runs. In production, registration only needs to be executed once unless callback endpoints change.",
    },
  ];

  return (
    <section className="w-full py-16">
      <div className="mx-auto w-full max-w-7xl px-5 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 items-start gap-8 md:grid-cols-12 lg:gap-12">
          <div className="space-y-3 pb-6 md:sticky md:top-24 md:col-span-5 md:self-start lg:col-span-4">
            <span className="font-mono text-xs font-semibold uppercase tracking-wider text-primary">
              FAQ
            </span>
            <h2 className="text-3xl font-black tracking-tight text-foreground sm:text-4xl">
              Technical Questions
            </h2>
            <p className="text-xs leading-relaxed text-muted-foreground sm:text-sm">
              Common issues encountered during M-Pesa integrations and how to
              resolve them.
            </p>
          </div>

          <div className="md:col-span-7 lg:col-span-8">
            <Accordion className="w-full">
              {questions.map((item) => (
                <AccordionItem
                  className="border-b border-border px-1 last:border-b-0 sm:px-2"
                  key={item.id}
                  value={item.id}
                >
                  <AccordionTrigger className="py-4 text-left text-sm font-semibold text-foreground hover:no-underline focus-visible:underline focus-visible:ring-0 sm:text-base">
                    {item.title}
                  </AccordionTrigger>
                  <AccordionContent className="pb-4 text-xs leading-relaxed text-muted-foreground sm:text-sm">
                    {item.content}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </div>

        <div className="mt-16 flex items-center justify-center text-xs sm:text-sm">
          <p className="text-muted-foreground">
            Still stuck?{" "}
            <a
              className="font-medium text-primary underline underline-offset-2 hover:text-primary/80"
              href="https://github.com/Mahito0X/Daraja-SDK/issues"
              target="_blank"
              rel="noreferrer"
            >
              Open an issue on GitHub
            </a>
          </p>
        </div>
      </div>
    </section>
  );
}

function FinalCTA() {
  return (
    <section className="w-full px-2 py-6 sm:px-4 md:py-8">
      <Card className="relative mx-auto w-full overflow-hidden border-border bg-card text-center shadow-xl">
        <div className="pointer-events-none absolute inset-0 size-full opacity-35 [mask-image:radial-gradient(farthest-side_at_top,white,transparent)]">
          <GridPattern
            className="absolute inset-0 size-full stroke-foreground/20"
            height={40}
            width={40}
            x={20}
          />
        </div>

        <div
          aria-hidden="true"
          className="pointer-events-none absolute left-1/2 top-0 h-48 w-[600px] max-w-full -translate-x-1/2 rounded-full bg-primary/15 blur-[90px]"
        />

        <CardContent className="relative z-10 flex flex-col items-center px-4 py-12 sm:px-8 md:py-16">
          <h2 className="text-2xl font-bold tracking-tight text-card-foreground sm:text-4xl">
            Start Integrating M-Pesa Today
          </h2>

          <p className="mt-2 max-w-md text-xs leading-relaxed text-muted-foreground sm:text-sm">
            Install the package, configure your Daraja keys, and trigger your
            first STK payment.
          </p>

          <div className="mt-6 flex w-full flex-col items-center justify-center gap-3 sm:flex-row sm:flex-wrap">
            <Link
              href="/docs"
              className="group relative inline-flex h-12 w-full items-center justify-center overflow-hidden rounded-full border border-border bg-background px-6 py-1 ps-6 pe-14 font-medium text-foreground shadow-xs transition-all duration-500 hover:pe-6 hover:ps-14 sm:w-auto"
            >
              <span className="relative z-10 transition-all duration-500">
                Get started
              </span>
              <div className="absolute right-1 flex size-10 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-xs transition-all duration-500 group-hover:right-[calc(100%-44px)] group-hover:rotate-45">
                <ArrowRight className="size-4" />
              </div>
            </Link>

            <Link
              href="/docs/daraja"
              className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-full border border-border bg-muted/60 px-5 text-xs font-medium text-foreground transition-colors hover:bg-accent sm:w-auto"
            >
              <Image
                src="/safaricom.svg"
                alt="Safaricom"
                width={16}
                height={16}
                className="size-4 object-contain"
              />
              <span>API Reference</span>
            </Link>

            <Link
              href="https://github.com/Mahito0X/Daraja-SDK"
              target="_blank"
              rel="noreferrer"
              className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-full border border-border bg-muted/60 px-5 text-xs font-medium text-foreground transition-colors hover:bg-accent sm:w-auto"
            >
              <GitHub className="size-3.5 fill-current" />
              <span>GitHub Repository</span>
            </Link>
          </div>

          <div className="mt-8 flex items-center gap-2 rounded-full border border-border bg-muted/60 px-4 py-1.5 font-mono text-xs text-muted-foreground">
            <NPM className="size-3.5 shrink-0 text-red-500" />
            <span className="text-foreground">
              npm install @lumierelabs/daraja
            </span>
            <CopyButton
              content="npm install @lumierelabs/daraja"
              variant="ghost"
            />
          </div>
        </CardContent>
      </Card>
    </section>
  );
}

function SafiSpotlight() {
  return (
    <section className="relative overflow-hidden border-t border-border py-16 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-12 lg:items-center">
          <div className="space-y-6 lg:col-span-6">
            <span className="font-mono text-xs font-semibold uppercase tracking-wider text-primary">
              Ecosystem Spotlight
            </span>
            <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              Explore Safi: Private M-Pesa Statement Analytics
            </h2>
            <p className="text-sm leading-relaxed text-muted-foreground sm:text-base">
              A private, browser-based M-PESA statement analyzer and financial
              dashboard built with Next.js. Parse statements locally with
              complete privacy and instant insights.
            </p>
            <div className="flex items-center gap-4 pt-2">
              <Link
                href="/safi"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition-all hover:bg-primary/90 hover:shadow-lg hover:shadow-primary/20"
              >
                Launch Safi Analyzer
                <ArrowRight className="size-4" />
              </Link>
            </div>
          </div>

          <div className="lg:col-span-6">
            <div className="relative overflow-hidden rounded-2xl border border-border bg-card shadow-2xl">
              <Image
                src="/safi-demo.png" // Replace with your actual demo image path in public folder
                alt="Safi M-Pesa Statement Analyzer Demo"
                width={1200}
                height={800}
                className="w-full h-auto object-cover"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background text-foreground antialiased selection:bg-primary/30 selection:text-foreground">
      <main className="relative overflow-hidden">
        <Hero />
        <SpecsBar />
        <CoreEngine />
        <EndpointCoverage />
        <UsageExamples />
        <ComparisonSection />
        <RuntimeCompatibility />
        <DocsSpotlight />
        <SafiSpotlight />
        <Contributors />
        <Sponsors />
        <TechnicalFAQ />
        <FinalCTA />
      </main>

      <Footer />
    </div>
  );
}
