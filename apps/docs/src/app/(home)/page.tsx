import Link from "next/link";
import Image from "next/image";
import {
  AlertTriangle,
  ArrowRight,
  ArrowUpRight,
  Building2,
  CheckCircle2,
  Clock,
  CloudCog,
  Code2,
  ExternalLink,
  Heart,
  KeyRound,
  PackageCheck,
  QrCode,
  ShieldCheck,
  Smartphone,
  UserCheck,
  Webhook,
  Wifi,
  type LucideIcon,
} from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { GitHub, NPM } from "@/components/Icons";
import Footer from "@/components/Footer";
import { CopyButton } from "@/components/CopyButton";
import { CodeShowcase } from "@/components/CodeShowcase";
import { InstallCommand } from "@/components/InstallCommand";
import { FlipWords } from "@/components/FlipWords";
import { Card, CardContent } from "@/components/ui/card";
import { GridPattern } from "@/components/ui/grid-pattern";
import { Marquee } from "@/components/ui/marquee";
import * as Icons from "@/components/Icons";
import { EndpointStatusBadge } from "@/components/Badge";
import { getSponsors, getTopContributors } from "@/lib/github";
import AuraContainer from "@/components/AuraContainer";
import { Badge } from "@/components/ui/badge";

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
    <section className="relative isolate border-b border-zinc-200/80 dark:border-zinc-900">
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

      <div className="relative z-10 mx-auto flex min-h-[560px] w-full max-w-7xl flex-col items-center justify-center px-5 py-16 text-center sm:min-h-[640px] sm:px-6 sm:py-20 lg:px-8">
        <div className="flex max-w-4xl flex-col items-center">
          <h1 className="text-balance text-3xl font-bold tracking-tight text-zinc-950 dark:text-zinc-50 sm:text-5xl lg:text-6xl">
            Ship M-Pesa{" "}
            <FlipWords
              words={DARAJA_ENDPOINTS}
              className="font-extrabold text-[#00A651] dark:text-[#22C55E]"
            />
            <br />
            in Lines, Not Hours
          </h1>

          <p className="mx-auto mt-4 max-w-xl text-pretty text-sm leading-relaxed text-zinc-600 dark:text-zinc-400 sm:text-base">
            A zero-dependency TypeScript client for Safaricom&apos;s Daraja API
            that runs anywhere <code>fetch</code> does. It handles OAuth token
            refresh, EAT timestamp math, and payload validation, so you write
            the payment logic, not the plumbing.
          </p>
        </div>

        <div className="mx-auto mt-8 flex w-full max-w-[300px] flex-col items-center gap-3">
          <div className="w-full">
            <InstallCommand packageName="@lumierelabs/daraja" />
          </div>

          <div className="grid w-full grid-cols-2 gap-2">
            <Link
              href="/docs/sdk"
              className="group flex h-9 w-full items-center justify-center gap-1.5 rounded-lg bg-zinc-900 px-3 text-xs font-medium text-zinc-50 transition-colors hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white"
            >
              <span>SDK Docs</span>
              <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
            </Link>

            <Link
              href="/docs/daraja"
              className="group flex h-9 w-full items-center justify-center gap-1.5 rounded-lg border border-zinc-200/80 bg-white px-3 text-xs font-medium text-zinc-900 transition-colors hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800"
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

function SpecsBar() {
  const metrics = [
    {
      value: "0",
      label: "Runtime dependencies",
      description: "Not even a fetch polyfill.",
    },
    {
      value: "100%",
      label: "TypeScript",
      description: "Every request and response, typed.",
    },
    {
      value: "Edge",
      label: "Runtime ready",
      description: "No Node-only APIs, anywhere.",
    },
    {
      value: "OAuth 2.0",
      label: "Authentication",
      description: "Cached and refreshed for you.",
    },
    {
      value: "ESM + CJS",
      label: "Module support",
      description: "Import or require, either works.",
    },
  ];

  return (
    <section className="relative py-10">
      <div className="mx-auto max-w-7xl px-5 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden border-y border-zinc-200 dark:border-zinc-800">
          <GridPattern
            width={32}
            height={32}
            className="opacity-[0.035] dark:opacity-[0.05]"
          />

          <div className="relative grid grid-cols-2 divide-x divide-y divide-zinc-200 dark:divide-zinc-800 md:grid-cols-5 md:divide-y-0">
            {metrics.map((metric, index) => (
              <div
                key={metric.label}
                className={`group relative px-5 py-6 transition-colors duration-200 hover:bg-zinc-50 dark:hover:bg-zinc-900/40 ${
                  index === 4 ? "col-span-2 md:col-span-1" : ""
                }`}
              >
                <div className="absolute left-5 top-0 h-px w-5 bg-[#00A651] opacity-0 transition-opacity duration-200 group-hover:opacity-100" />

                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="font-mono text-xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-100">
                      {metric.value}
                    </div>

                    <div className="mt-1 text-xs font-medium text-zinc-700 dark:text-zinc-300">
                      {metric.label}
                    </div>

                    <div className="mt-1 text-[11px] leading-4 text-zinc-500 dark:text-zinc-500">
                      {metric.description}
                    </div>
                  </div>

                  <span className="mt-1 font-mono text-[9px] text-zinc-300 dark:text-zinc-700">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function UsageExamples() {
  return (
    <section className="border-b border-zinc-200/80 dark:border-zinc-900">
      <div className="mx-auto w-full max-w-7xl px-5 py-16 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-zinc-950 dark:text-zinc-50 sm:text-3xl">
              Integration Examples
            </h2>
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
              Usage patterns across TypeScript, Next.js, Astro, and webhook
              route handlers.
            </p>
          </div>

          <Link
            href="/docs/sdk"
            className="group inline-flex items-center gap-1.5 text-xs font-medium text-zinc-600 transition-colors hover:text-zinc-950 dark:text-zinc-400 dark:hover:text-zinc-50"
          >
            <span>See the full API reference</span>
            <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>

        <CodeShowcase />
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
        "OAuth 2.0 tokens cached in memory and refreshed before they expire.",
      status: "working",
      icon: KeyRound,
    },
    {
      title: "M-Pesa Express (STK Push)",
      description:
        "Send a payment prompt straight to a customer's phone, then poll for the result.",
      status: "working",
      icon: Smartphone,
    },
    {
      title: "C2B Payments",
      description:
        "Register your callback URLs and simulate incoming customer payments in sandbox.",
      status: "upstream-issue",
      icon: Building2,
    },
    {
      title: "B2C Account Top Up",
      description:
        "Move funds from your MMF/Working account into a B2C shortcode's utility account.",
      status: "working",
      icon: Building2,
    },
    {
      title: "B2B Hakikisha",
      description:
        "Confirm a business's name and tariff before you send it money.",
      status: "working",
      icon: ShieldCheck,
    },
    {
      title: "Dynamic QR",
      description: "Generate a scannable M-Pesa QR code for instant checkout.",
      status: "upstream-issue",
      icon: QrCode,
    },
    {
      title: "Mobile Data Bundles",
      description:
        "Browse, purchase, and check the status of Safaricom data bundle offers.",
      status: "upstream-issue",
      icon: Wifi,
    },
    {
      title: "SIM Swap & IMSI",
      description:
        "Fraud checks: verify last SIM swap date, hashed IMSI, and network registration age.",
      status: "working",
      icon: ShieldCheck,
    },
    {
      title: "Mobile Number Validation",
      description:
        "Confirm a number is an active subscriber before you send anything to it.",
      status: "working",
      icon: UserCheck,
    },
  ];

  return (
    <section className="relative overflow-hidden py-16 sm:py-24">
      <div className="mx-auto max-w-7xl px-5 sm:px-6 lg:px-8">
        <div className="mb-12 flex flex-col gap-8 border-b border-zinc-200 pb-10 dark:border-zinc-800 md:flex-row md:items-end md:justify-between">
          <div className="max-w-2xl">
            <h2 className="text-3xl font-bold tracking-tight text-zinc-950 dark:text-white sm:text-4xl">
              Every Endpoint We&apos;ve
              <br className="hidden sm:block" /> Actually Tested.
            </h2>

            <p className="mt-4 max-w-xl text-sm leading-6 text-zinc-600 dark:text-zinc-400 sm:text-base">
              Nine services, tested end to end against Safaricom&apos;s sandbox.
              When something fails because Daraja&apos;s own upstream is down,
              that&apos;s flagged here instead of left for you to debug blind.
            </p>
          </div>
        </div>

        <div className="overflow-hidden rounded-xl border border-zinc-200/80 dark:border-zinc-800">
          <div className="grid grid-cols-1 gap-px bg-border sm:grid-cols-2 md:grid-cols-3">
            {ENDPOINTS.map((endpoint, index) => {
              const Icon = endpoint.icon;
              const isWorking = endpoint.status === "working";

              return (
                <div
                  key={endpoint.title}
                  className="group relative min-h-[210px] overflow-hidden bg-background p-6 transition-colors duration-300 hover:bg-zinc-50 sm:min-h-[230px] dark:hover:bg-zinc-900/80"
                >
                  <div className="pointer-events-none absolute top-0 left-1/2 -mt-2 -ml-20 size-full [mask-image:radial-gradient(farthest-side_at_top,white,transparent)]">
                    <GridPattern
                      className="absolute inset-0 size-full stroke-foreground/20"
                      height={40}
                      width={40}
                      x={20}
                    />
                  </div>

                  <div className="absolute top-4 right-4 z-20">
                    <EndpointStatusBadge status={endpoint.status} />
                  </div>

                  {isWorking && (
                    <div className="absolute right-0 top-0 h-px w-16 bg-[#00A651] opacity-60" />
                  )}

                  <div className="relative z-10 flex h-full flex-col justify-between">
                    <div className="flex items-start justify-between gap-4">
                      <div
                        className={`flex size-10 shrink-0 items-center justify-center rounded-lg border transition-colors duration-300 ${
                          isWorking
                            ? "border-[#00A651]/20 bg-[#00A651]/10 text-[#00A651] dark:border-[#00A651]/30 dark:bg-[#00A651]/10 dark:text-[#22C55E]"
                            : "border-amber-500/20 bg-amber-500/10 text-amber-600 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-400"
                        }`}
                      >
                        <Icon className="size-[18px]" strokeWidth={1.7} />
                      </div>
                    </div>

                    <div className="pt-6">
                      <div className="mb-2 flex items-center gap-2">
                        <span className="font-mono text-[10px] text-zinc-400 dark:text-zinc-600">
                          {String(index + 1).padStart(2, "0")}
                        </span>

                        <span className="h-px w-4 bg-zinc-200 dark:bg-zinc-800" />
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

        <div className="relative mt-8 overflow-hidden rounded-xl border border-zinc-200/80 bg-background px-6 py-5 dark:border-zinc-800">
          <div className="pointer-events-none absolute top-0 left-1/2 -mt-2 -ml-20 size-full [mask-image:radial-gradient(farthest-side_at_top,white,transparent)]">
            <GridPattern
              className="absolute inset-0 size-full stroke-foreground/20"
              height={40}
              width={40}
              x={20}
            />
          </div>

          <div className="relative z-10 flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span className="size-1.5 rounded-full bg-[#00A651]" />

                <h4 className="text-sm font-semibold text-foreground">
                  Missing an endpoint?
                </h4>
              </div>

              <p className="mt-1.5 max-w-2xl text-xs leading-5 text-muted-foreground">
                Reversals, generic B2C, generic B2B, and Account Balance
                aren&apos;t wrapped yet. Everything else on this page is.
              </p>
            </div>

            <a
              href="https://github.com"
              target="_blank"
              rel="noopener noreferrer"
              className="group/link inline-flex shrink-0 items-center gap-1.5 text-xs font-semibold text-[#00A651] transition-colors hover:text-[#008f46]"
            >
              Track roadmap
              <ArrowUpRight className="size-3.5 transition-transform group-hover/link:translate-x-0.5 group-hover/link:-translate-y-0.5" />
            </a>
          </div>
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
        "Request parameters, response shapes, and the exact error codes Safaricom returns, laid out per endpoint instead of summarized away.",
      icon: Code2,
      tag: "Field-Level",
    },
    {
      title: "Defects Marked, Not Hidden",
      description:
        "Where Safaricom's own docs contradict themselves, misspell a field, or copy-paste from a different endpoint, that's called out right where it happens.",
      icon: AlertTriangle,
      tag: "Called Out",
    },
    {
      title: "Tested, Not Just Transcribed",
      description:
        "Endpoints are marked as documented, sandbox-tested, or blocked by an upstream Daraja issue, never lumped together as one generic 'supported'.",
      icon: CheckCircle2,
      tag: "Status-Tracked",
    },
  ];

  return (
    <section className="relative overflow-hidden py-16 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-2xl border border-zinc-200/80 bg-background p-5 sm:p-8 md:p-12 dark:border-zinc-800">
          <div className="pointer-events-none absolute top-0 right-0 size-full [mask-image:radial-gradient(farthest-side_at_top_right,white,transparent)]">
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
                <span className="text-[#00A651] dark:text-[#22C55E]">
                  Rebuilt Properly.
                </span>
              </h2>

              <p className="mt-4 text-sm leading-relaxed text-muted-foreground sm:text-base">
                No more hunting through Safaricom&apos;s own scattered PDFs and
                portal pages. Every endpoint gets one clean guide, with the
                documentation&apos;s own defects marked instead of hidden.
              </p>

              <div className="mt-8 flex flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:gap-4">
                <Link
                  href="/docs"
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#00A651] px-5 py-3 text-sm font-semibold text-white transition-all hover:bg-[#008f46] hover:shadow-lg hover:shadow-[#00A651]/20"
                >
                  Explore Documentation
                  <ArrowRight className="size-4" />
                </Link>

                <Link
                  href="/docs/daraja"
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-zinc-200 bg-zinc-50 px-5 py-3 text-sm font-semibold text-foreground transition-colors hover:bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-900/80 dark:hover:bg-zinc-800"
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
                    className="group relative overflow-hidden rounded-xl border border-zinc-200/80 bg-zinc-50/50 p-4 transition-all duration-300 hover:border-[#00A651]/40 hover:bg-zinc-100/60 sm:p-5 dark:border-zinc-800/80 dark:bg-zinc-900/40 dark:hover:bg-zinc-900/80"
                  >
                    <div className="flex items-start gap-3.5 sm:gap-4">
                      <div className="flex size-10 shrink-0 items-center justify-center rounded-lg border border-[#00A651]/20 bg-[#00A651]/10 text-[#00A651] dark:border-[#00A651]/30 dark:text-[#22C55E]">
                        <Icon className="size-5" />
                      </div>

                      <div className="min-w-0 flex-1 space-y-1.5">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <h3 className="truncate text-sm font-semibold text-foreground">
                            {item.title}
                          </h3>
                          <span className="shrink-0 rounded-md border border-zinc-200 bg-white px-2 py-0.5 font-mono text-[10px] font-medium text-zinc-600 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-400">
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
        <div className="mb-12 flex flex-col gap-6 border-b border-zinc-200 pb-10 dark:border-zinc-800 md:flex-row md:items-end md:justify-between">
          <div className="max-w-2xl">
            <h2 className="mt-4 text-3xl font-bold tracking-tight text-zinc-950 dark:text-white sm:text-4xl">
              Core Engine Design
            </h2>
            <p className="mt-3 text-sm leading-6 text-zinc-600 dark:text-zinc-400 sm:text-base">
              The parts of a Daraja integration that go wrong in production,
              handled before you ever see them.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Arc.map((feature) => {
            const Icon = feature.icon;

            return (
              <div
                key={feature.title}
                className="group relative flex flex-col justify-between overflow-hidden rounded-xl border border-zinc-200/80 bg-white/60 p-6 transition-all duration-300 hover:border-[#00A651]/40 hover:bg-white hover:shadow-xl hover:shadow-[#00A651]/5 dark:border-zinc-800/80 dark:bg-zinc-950/60 dark:hover:border-[#00A651]/40 dark:hover:bg-zinc-900/90"
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
                  <div className="flex size-11 items-center justify-center rounded-lg border border-zinc-200/80 bg-zinc-50/80 text-[#00A651] transition-colors duration-300 group-hover:border-[#00A651]/30 group-hover:bg-[#00A651]/10 dark:border-zinc-800 dark:bg-zinc-900/80 dark:text-[#22C55E]">
                    <Icon className="size-5" strokeWidth={1.8} />
                  </div>
                </div>

                <div className="relative z-10 mt-8">
                  <h3 className="text-base font-semibold tracking-tight text-zinc-950 dark:text-zinc-100">
                    {feature.title}
                  </h3>

                  <p className="mt-2 text-xs leading-relaxed text-zinc-600 dark:text-zinc-400">
                    {feature.description}
                  </p>
                </div>

                <div className="absolute inset-x-0 bottom-0 h-0.5 w-full bg-gradient-to-r from-transparent via-[#00A651] to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function RuntimeCompatibility() {
  const LOGO_COLUMN_1 = [
    { icon: Icons.Nodejs, name: "Node.js" },
    { icon: Icons.Nextjs, name: "Next.js" },
    { icon: Icons.Astro, name: "Astro" },
    { icon: Icons.Remix, name: "Remix" },
    { icon: Icons.Svelte, name: "SvelteKit" },
    { icon: Icons.Expressjs, name: "Express" },
  ];

  const LOGO_COLUMN_2 = [
    { icon: Icons.Fastify, name: "Fastify" },
    { icon: Icons.Vercel, name: "Vercel Edge" },
    { icon: Icons.CloudflareWorkers, name: "Cloudflare Workers" },
    { icon: Icons.Deno, name: "Deno" },
    { icon: Icons.Bun, name: "Bun" },
  ];

  return (
    <section className="relative overflow-hidden py-16 sm:py-20">
      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-12 px-5 sm:px-6 md:grid-cols-2 md:items-start lg:px-8">
        <div className="max-w-xl space-y-4 pt-2">
          <span className="font-mono text-xs font-semibold uppercase tracking-wider text-[#00A651] dark:text-[#22C55E]">
            Runtimes
          </span>
          <h2 className="text-3xl font-black tracking-tight text-zinc-950 dark:text-zinc-50 sm:text-4xl md:text-5xl">
            One Client. Every Runtime You Ship On.
          </h2>
          <p className="text-sm leading-relaxed text-zinc-600 dark:text-zinc-400 sm:text-base">
            There&apos;s no Node-specific API anywhere in the client. Whatever
            you deploy on, from a single VPS to Cloudflare&apos;s edge network,
            the same code runs unchanged.
          </p>
        </div>

        <div className="relative flex h-[320px] w-full flex-row items-center justify-center gap-4 overflow-hidden rounded-2xl border border-zinc-200/80 bg-zinc-50/50 p-4 sm:h-[420px] sm:gap-6 dark:border-zinc-800/80 dark:bg-zinc-950/40 [mask-image:linear-gradient(to_bottom,transparent,black_15%,black_85%,transparent)]">
          <Marquee
            vertical
            className="[--duration:30s] [--gap:1.5rem]"
            pauseOnHover
            repeat={4}
          >
            {LOGO_COLUMN_1.map((item, index) => {
              const Icon = item.icon;
              if (!Icon) return null;
              return (
                <div
                  key={`${item.name}-${index}`}
                  title={item.name}
                  className="group relative flex size-16 items-center justify-center rounded-2xl border border-zinc-200/80 bg-white p-3 shadow-xs backdrop-blur-md transition-all duration-300 hover:scale-105 hover:border-zinc-300 hover:shadow-md sm:size-20 sm:p-4 dark:border-zinc-800/80 dark:bg-zinc-900/80 dark:hover:border-zinc-700"
                >
                  <Icon className="size-6 text-zinc-900 transition-transform duration-300 group-hover:scale-110 sm:size-8 dark:text-zinc-100" />
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
              if (!Icon) return null;
              return (
                <div
                  key={`${item.name}-${index}`}
                  title={item.name}
                  className="group relative flex size-16 items-center justify-center rounded-2xl border border-zinc-200/80 bg-white p-3 shadow-xs backdrop-blur-md transition-all duration-300 hover:scale-105 hover:border-zinc-300 hover:shadow-md sm:size-20 sm:p-4 dark:border-zinc-800/80 dark:bg-zinc-900/80 dark:hover:border-zinc-700"
                >
                  <Icon className="size-6 text-zinc-900 transition-transform duration-300 group-hover:scale-110 sm:size-8 dark:text-zinc-100" />
                </div>
              );
            })}
          </Marquee>
        </div>
      </div>
    </section>
  );
}

async function Contributors() {
  const contributors = await getTopContributors(100, "Mahito0x", "Daraja-SDK");

  if (contributors.length === 0) {
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
    <section className="border-t border-zinc-200 dark:border-zinc-800">
      <div className="mx-auto max-w-7xl px-5 py-24 sm:px-6 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-[1fr_auto] lg:items-end">
          <div>
            <div className="mb-5 flex items-center gap-2 text-xs font-medium text-zinc-500 dark:text-zinc-400">
              <GitHub className="size-3.5" />
              <span>Open source contributors</span>
            </div>

            <h2 className="max-w-3xl text-4xl font-semibold tracking-[-0.04em] text-zinc-950 dark:text-white sm:text-5xl">
              Built in public.
              <br />
              <span className="text-zinc-400 dark:text-zinc-600">
                Improved by everyone.
              </span>
            </h2>

            <p className="mt-5 max-w-xl text-sm leading-6 text-zinc-500 dark:text-zinc-400 sm:text-[15px]">
              Every contribution helps make Daraja more reliable, more capable,
              and easier for developers to build with.
            </p>
          </div>

          <Link
            href="https://github.com/Mahito0x/Daraja-SDK/graphs/contributors"
            target="_blank"
            rel="noopener noreferrer"
            className="group inline-flex h-10 items-center gap-2 rounded-lg border border-zinc-200 px-3.5 text-xs font-medium text-zinc-700 transition-colors hover:bg-zinc-50 dark:border-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-900"
          >
            <span>View contribution graph</span>
            <ArrowUpRight className="size-3.5 text-zinc-400 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </Link>
        </div>

        <AuraContainer
          className="mt-16 rounded-2xl"
          colors={["#4F46E5", "#06B6D4", "#10B981", "#8B5CF6"]}
          glowRadius={450}
        >
          <Card className="overflow-hidden rounded-2xl border-0 bg-white dark:bg-zinc-950 shadow-none">
            <div className="grid lg:grid-cols-[1.05fr_0.95fr]">
              <div className="relative border-b border-zinc-200 p-7 dark:border-zinc-800 sm:p-10 lg:border-b-0 lg:border-r">
                <div className="flex h-full flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-zinc-400 dark:text-zinc-600">
                        Lead contributor
                      </span>

                      <span className="font-mono text-[11px] text-zinc-400 dark:text-zinc-600">
                        01
                      </span>
                    </div>

                    <div className="mt-10 flex items-center gap-5">
                      <Image
                        src={featured.avatar_url}
                        alt={featured.login}
                        width={88}
                        height={88}
                        className="size-[72px] rounded-2xl border border-zinc-200 object-cover shadow-sm sm:size-[88px] dark:border-zinc-800"
                      />

                      <div className="min-w-0">
                        <h3 className="truncate text-xl font-semibold tracking-tight text-zinc-950 dark:text-white">
                          {featured.login}
                        </h3>

                        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                          Core contributor
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-12">
                    <div className="flex items-end justify-between gap-6">
                      <div>
                        <div className="font-mono text-4xl font-medium tracking-[-0.04em] text-zinc-950 dark:text-white">
                          {featured.contributions.toLocaleString()}
                        </div>

                        <div className="mt-1 text-xs text-zinc-400 dark:text-zinc-600">
                          {featured.contributions === 1
                            ? "contribution"
                            : "contributions"}
                        </div>
                      </div>

                      <Link
                        href={featured.html_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group/cta inline-flex items-center gap-1.5 text-xs font-medium text-zinc-600 hover:text-zinc-950 dark:text-zinc-400 dark:hover:text-white"
                      >
                        GitHub
                        <ArrowUpRight className="size-3.5 transition-transform duration-200 group-hover/cta:-translate-y-0.5 group-hover/cta:translate-x-0.5" />
                      </Link>
                    </div>

                    <div className="mt-7 h-px bg-zinc-200 dark:bg-zinc-800" />

                    <div className="mt-4 flex items-center justify-between text-xs">
                      <span className="text-zinc-400 dark:text-zinc-600">
                        Repository contributors
                      </span>

                      <span className="font-mono text-zinc-700 dark:text-zinc-300">
                        {contributors.length}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-7 sm:p-10">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-zinc-400 dark:text-zinc-600">
                      The community
                    </span>

                    <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
                      {contributors.length === 1
                        ? "One developer behind the project. Spot open for contributors."
                        : `${contributors.length} developers contributing to the project.`}
                    </p>
                  </div>

                  <span className="font-mono text-[11px] text-zinc-400 dark:text-zinc-600">
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
                      className="group relative aspect-square overflow-hidden rounded-xl border border-zinc-200 bg-zinc-100 transition-all duration-200 hover:-translate-y-0.5 hover:border-zinc-300 hover:shadow-sm dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-700"
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
                      className="relative aspect-square overflow-hidden rounded-xl border border-dashed border-zinc-200 bg-zinc-50/50 dark:border-zinc-800/80 dark:bg-zinc-900/40 flex items-center justify-center"
                    >
                      <div className="size-2 rounded-full bg-zinc-200 dark:bg-zinc-800 animate-pulse" />
                    </div>
                  ))}
                </div>

                {others.length > visibleContributors.length ? (
                  <div className="mt-7 flex items-center justify-between border-t border-zinc-200 pt-5 dark:border-zinc-800">
                    <span className="text-xs text-zinc-400 dark:text-zinc-600">
                      Showing top {visibleContributors.length} contributors
                    </span>

                    <Link
                      href="https://github.com/Mahito0x/Daraja-SDK/graphs/contributors"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group inline-flex items-center gap-1.5 text-xs font-medium text-zinc-700 dark:text-zinc-300"
                    >
                      +{others.length - visibleContributors.length} more
                      <ArrowUpRight className="size-3.5 text-zinc-400 transition-transform duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                    </Link>
                  </div>
                ) : (
                  <div className="mt-7 flex items-center justify-between border-t border-zinc-200 pt-5 dark:border-zinc-800 text-xs text-zinc-400 dark:text-zinc-600">
                    <span>Open community slots</span>
                    <Link
                      href="https://github.com/Mahito0x/Daraja-SDK"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-medium text-zinc-700 hover:text-zinc-950 dark:text-zinc-300 dark:hover:text-white"
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

  if (sponsors.length === 0) {
    return null;
  }

  const [featured, ...others] = sponsors;
  const featuredName = featured.name || featured.login;

  return (
    <section className="border-t border-zinc-200/70 dark:border-zinc-800/70">
      <div className="mx-auto max-w-7xl px-5 py-24 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <div className="mb-5 flex items-center gap-2.5 text-xs font-medium text-zinc-600 dark:text-zinc-300">
              <span className="flex size-5 items-center justify-center rounded-md border border-zinc-200 bg-zinc-50 shadow-2xs dark:border-zinc-800 dark:bg-zinc-900">
                <Heart className="size-3 text-rose-500" />
              </span>

              <span>Supported by</span>

              <span className="font-mono text-[11px] text-zinc-900 dark:text-white font-semibold">
                {sponsors.length}{" "}
                {sponsors.length === 1 ? "sponsor" : "sponsors"}
              </span>
            </div>

            <h2 className="text-4xl font-semibold tracking-[-0.05em] text-zinc-950 dark:text-white sm:text-5xl">
              Backing open source.
              <br />
              <span className="text-[#00A651] dark:text-[#22C55E]">
                Supporting what comes next.
              </span>
            </h2>

            <p className="mt-5 max-w-xl text-sm leading-6 text-zinc-500 dark:text-zinc-400 sm:text-[15px]">
              Daraja is made possible by individuals and organizations that
              support its continued development.
            </p>
          </div>

          <Link
            href="https://github.com/Mahito0x/Daraja-SDK"
            target="_blank"
            rel="noopener noreferrer"
            className="group inline-flex h-10 w-fit items-center gap-2 rounded-lg border border-zinc-200 bg-zinc-50 px-4 text-xs font-medium text-zinc-800 shadow-sm transition-colors hover:bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
          >
            <span>Become a sponsor</span>
            <ArrowUpRight className="size-3.5 transition-transform duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
          </Link>
        </div>

        <div className="mt-16 pb-12 relative">
          <div className="relative z-20">
            <AuraContainer
              className="rounded-2xl"
              colors={["#4F46E5", "#06B6D4", "#10B981", "#8B5CF6"]}
              glowRadius={450}
            >
              <Card className="rounded-2xl border-0 bg-white dark:bg-zinc-950 shadow-none">
                <CardContent className="p-0 relative pb-16">
                  <Link
                    href={featured.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`group relative block overflow-hidden ${
                      others.length > 0
                        ? "border-b border-zinc-200 dark:border-zinc-800"
                        : ""
                    }`}
                  >
                    <div className="relative z-10 flex min-h-[280px] flex-col items-center justify-center px-6 py-16 text-center sm:min-h-[320px] sm:px-10">
                      <div className="mb-8 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-600 dark:text-zinc-300">
                        <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
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
                        <h3 className="text-xl font-semibold tracking-[-0.02em] text-zinc-950 transition-colors group-hover:text-zinc-900 dark:text-white">
                          {featuredName}
                        </h3>
                      </div>

                      <p className="mt-1.5 font-mono text-xs text-zinc-500 dark:text-zinc-400">
                        @{featured.login}
                      </p>

                      {featured.tier && (
                        <Badge
                          variant="outline"
                          className="mt-4 border-zinc-200 bg-zinc-50 text-[10px] font-medium text-zinc-700 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300"
                        >
                          {featured.tier.name}
                        </Badge>
                      )}
                    </div>
                  </Link>

                  {others.length > 0 && (
                    <div className="relative">
                      <div className="relative z-10">
                        <div className="flex items-center justify-between border-b border-zinc-200 px-6 py-4 dark:border-zinc-800 sm:px-8 bg-white/50 dark:bg-zinc-950/50 backdrop-blur-xs">
                          <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-zinc-500 dark:text-zinc-400">
                            More supporters
                          </span>

                          <span className="font-mono text-[10px] font-medium text-zinc-700 dark:text-zinc-300">
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
                                className="group relative flex min-h-[150px] items-center justify-center border-b border-r border-zinc-200 bg-white/80 transition-all hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950/80 dark:hover:bg-zinc-900/50"
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

                                  <span className="max-w-full truncate text-center text-xs font-medium text-zinc-700 transition-colors group-hover:text-zinc-950 dark:text-zinc-300 dark:group-hover:text-white">
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

          <div className="relative -mt-6 z-10 w-full flex items-center justify-between rounded-xl border border-zinc-200/80 bg-white/90 px-6 py-6 shadow-xl backdrop-blur-md dark:border-zinc-800/80 dark:bg-zinc-900/90"></div>
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
        "Yes. The SDK is built strictly using the native Fetch API and AbortController with zero Node.js standard library dependencies, making it fully compatible with Vercel Edge, Cloudflare Workers, Deno, and Bun.",
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
        "Daraja requires strict East Africa Time (UTC+3) timestamps for requests like STK Push and security credential generation. The SDK normalizes all dates to UTC+3 automatically regardless of your server's local timezone.",
    },
    {
      id: "item-4",
      title:
        "Why am I not receiving callbacks on my ResultURL or ConfirmationURL?",
      content:
        "Make sure your callback endpoint is publicly reachable over HTTPS with a valid domain or public IP. Localhost URLs, self-signed SSL certificates, or endpoints blocked by a strict firewall will all cause callback delivery to fail silently.",
    },
    {
      id: "item-5",
      title:
        "Why am I getting an 'initiator information is invalid' error on B2C or B2B?",
      content:
        "This means your API user credentials are wrong somewhere. Check your InitiatorName, confirm the API user's password was actually activated on the M-PESA Organization Portal, and confirm you're encrypting it with Safaricom's public certificate, not your own.",
    },
    {
      id: "item-6",
      title:
        "Why do I get an 'insufficient balance' error when sending B2C payouts?",
      content:
        "B2C debits your Utility account specifically, not your MMF or Working account, even if the Working account has plenty of funds. Move money into the Utility account via the M-PESA portal or the B2B API first.",
    },
    {
      id: "item-7",
      title: "Can I use a Buy Goods Till Number for STK Push / M-PESA Express?",
      content:
        "Yes. Set BusinessShortCode to your Go-Live store/head-office code, and set PartyB to the individual Till Number itself.",
    },
    {
      id: "item-8",
      title:
        "How often should I register C2B validation and confirmation URLs?",
      content:
        "In sandbox, before every test run. In production, once, unless you delete and re-register them yourself from Self Service on the Daraja Portal.",
    },
  ];

  return (
    <section className="w-full py-16">
      <div className="mx-auto w-full max-w-7xl px-5 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 items-start gap-8 md:grid-cols-12 lg:gap-12">
          <div className="space-y-3 pb-6 md:sticky md:top-24 md:col-span-5 md:self-start lg:col-span-4">
            <span className="font-mono text-xs font-semibold uppercase tracking-wider text-[#00A651] dark:text-[#22C55E]">
              FAQ
            </span>
            <h2 className="text-3xl font-black tracking-tight text-zinc-950 dark:text-zinc-50 sm:text-4xl">
              Technical Questions
            </h2>
            <p className="text-xs leading-relaxed text-muted-foreground sm:text-sm">
              The errors you&apos;ll actually hit integrating M-Pesa, and why
              they happen.
            </p>
          </div>

          <div className="md:col-span-7 lg:col-span-8">
            <Accordion className="w-full">
              {questions.map((item) => (
                <AccordionItem
                  className="border-b px-1 last:border-b-0 sm:px-2"
                  key={item.id}
                  value={item.id}
                >
                  <AccordionTrigger className="py-4 text-left text-sm font-semibold text-zinc-900 hover:no-underline focus-visible:underline focus-visible:ring-0 dark:text-zinc-100 sm:text-base">
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
              className="font-medium text-[#00A651] underline underline-offset-2 hover:text-emerald-600 dark:text-[#22C55E]"
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
      <Card className="relative mx-auto w-full overflow-hidden border-zinc-800 bg-zinc-950 text-center shadow-xl dark:border-zinc-200 dark:bg-white">
        <div className="pointer-events-none absolute inset-0 size-full opacity-30 [mask-image:radial-gradient(farthest-side_at_top,white,transparent)]">
          <GridPattern
            className="absolute inset-0 size-full stroke-zinc-700 dark:stroke-zinc-300"
            height={40}
            width={40}
            x={20}
          />
        </div>

        <CardContent className="relative z-10 flex flex-col items-center px-4 py-12 sm:px-8 md:py-16">
          <h2 className="text-2xl font-bold tracking-tight text-zinc-50 dark:text-zinc-950 sm:text-4xl">
            Start Integrating M-Pesa
          </h2>

          <p className="mt-2 max-w-md text-xs leading-relaxed text-zinc-400 dark:text-zinc-600 sm:text-sm">
            Install the package, drop in your Daraja credentials, and make your
            first call.
          </p>

          <div className="mt-6 flex w-full flex-col items-center justify-center gap-3 sm:flex-row sm:flex-wrap">
            <Link
              href="/docs"
              className="group relative inline-flex h-12 w-full items-center justify-center overflow-hidden rounded-full border border-zinc-200 bg-white px-6 py-1 ps-6 pe-14 font-medium text-zinc-900 shadow-sm transition-all duration-500 hover:ps-14 hover:pe-6 sm:w-auto dark:border-zinc-800 dark:bg-zinc-900 dark:text-white"
            >
              <span className="relative z-10 transition-all duration-500">
                Get started
              </span>
              <div className="absolute right-1 flex size-10 items-center justify-center rounded-full bg-zinc-900 text-white shadow-sm transition-all duration-500 group-hover:right-[calc(100%-44px)] group-hover:rotate-45 dark:bg-white dark:text-zinc-900">
                <ArrowRight className="size-4" />
              </div>
            </Link>

            <Link
              href="/docs/daraja"
              className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-full border border-zinc-800 bg-zinc-900/80 px-5 text-xs font-medium text-zinc-100 transition-colors hover:bg-zinc-800 sm:w-auto dark:border-zinc-200 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
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
              className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-full border border-zinc-800 bg-zinc-900/80 px-5 text-xs font-medium text-zinc-100 transition-colors hover:bg-zinc-800 sm:w-auto dark:border-zinc-200 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
            >
              <GitHub className="size-3.5 fill-current" />
              <span>GitHub Repository</span>
            </Link>
          </div>

          <div className="mt-8 flex items-center gap-2 rounded-full border border-zinc-800 bg-zinc-900/80 px-4 py-1.5 font-mono text-xs text-zinc-400 dark:border-zinc-200 dark:bg-zinc-100 dark:text-zinc-600">
            <NPM className="size-3.5 shrink-0 text-red-500" />
            <span className="text-zinc-200 dark:text-zinc-800">
              npm install @lumierelabs/daraja
            </span>
            <CopyButton
              text="npm install @lumierelabs/daraja"
              className="ml-1 shrink-0 text-zinc-500 hover:text-zinc-100 dark:hover:text-zinc-900"
            />
          </div>
        </CardContent>
      </Card>
    </section>
  );
}

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white text-zinc-900 antialiased selection:bg-zinc-900 selection:text-white dark:bg-black dark:text-zinc-100 dark:selection:bg-white dark:selection:text-zinc-900">
      <main className="relative overflow-hidden">
        <Hero />
        <SpecsBar />
        <UsageExamples />
        <EndpointCoverage />
        <Contributors />
        <Sponsors />
        <DocsSpotlight />
        <CoreEngine />
        <RuntimeCompatibility />
        <TechnicalFAQ />
        <FinalCTA />
      </main>

      <Footer />
    </div>
  );
}
