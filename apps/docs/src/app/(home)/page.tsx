"use client";

import Link from "next/link";
import {
  ArrowRight,
  Braces,
  Check,
  Clock,
  CloudCog,
  KeyRound,
  PackageCheck,
  PackageX,
  ShieldAlert,
  ShieldCheck,
  TimerReset,
  Webhook,
  Workflow,
} from "lucide-react";
import { GitHub, NPM } from "@/components/Icons";
import Footer from "@/components/Footer";
import { CopyButton } from "@/components/CopyButton";
import { CodeShowcase } from "@/components/CodeShowcase";
import { InstallCommand } from "@/components/InstallCommand";

const Features = [
  {
    title: "End-to-End Strict TypeScript Payloads",
    description:
      "Every interaction across the M-Pesa ecosystem is strongly typed, from STK Push, C2B, B2C Account Top Up, B2B Hakikisha, Dynamic QR, and Mobile Data Bundles to synchronous responses and asynchronous webhooks. Daraja quirks and legacy property names are represented accurately, giving you reliable autocomplete and compile-time guarantees.",
    icon: Braces,
    tags: ["STK Push", "C2B", "B2C", "B2B", "QR", "Data Bundles"],
  },
  {
    title: "Automated OAuth 2.0 Token Lifecycle & Caching",
    description:
      "Authentication is handled for you. Consumer credentials are exchanged automatically, access tokens are cached in memory according to their server-defined TTL, and a proactive 60-second refresh window prevents expiring credentials from turning into intermittent 401 responses.",
    icon: KeyRound,
    tags: ["OAuth 2.0", "In-memory cache", "Auto refresh", "60s buffer"],
  },
  {
    title: "Upstream Quirk Normalization & Pre-Flight Validation",
    description:
      "Daraja-specific protocol details are normalized before a request leaves your server. The SDK handles EAT timestamp generation, Base64 password derivation, required parameter formatting, URL checks, payload constraints, and local validation so invalid requests fail early with useful errors.",
    icon: ShieldCheck,
    tags: ["UTC+3 / EAT", "Base64", "Validation", "Early errors"],
  },
  {
    title: "Runtime-Agnostic & Multi-Framework Compatibility",
    description:
      "Built entirely on standard Web APIs such as fetch and AbortController. Run the same SDK across Node.js, Vercel Edge, Cloudflare Workers, Deno, and Bun, with clean integration into Next.js, Remix, Astro, SvelteKit, Express, and Fastify.",
    icon: CloudCog,
    tags: ["Node.js", "Vercel Edge", "Cloudflare", "Deno", "Bun"],
  },
  {
    title: "Ergonomic Callback Parsing & Data Transformation",
    description:
      "Turn deeply nested Daraja callback payloads into usable typed data. Static parsing utilities unpack ResultParameter arrays, coerce string-encoded values, and expose discriminated success and failure states for predictable webhook processing.",
    icon: Webhook,
    tags: ["Webhooks", "Parsing", "Type coercion", "Discriminated unions"],
  },
  {
    title: "Zero Heavy Dependencies & Dual-Module Packaging",
    description:
      "No Axios, node-fetch, or heavyweight runtime wrappers. The package stays small, minimizes serverless cold starts, reduces supply-chain exposure, and ships ESM, CommonJS, and bundled TypeScript declarations for modern and legacy toolchains.",
    icon: PackageCheck,
    tags: ["Zero dependencies", "ESM", "CommonJS", ".d.ts", "Tree-shaking"],
  },
];

const architecturalSolutions = [
  {
    icon: KeyRound,
    number: "01",
    title: "Automated OAuth 2.0 Token Lifecycle",
    description:
      "Eliminates manual Basic auth encoding, credential fetching, and race conditions. Manages token rotation with a proactive 60-second safety buffer to prevent mid-flight 401s.",
    span: "lg:col-span-2",
  },
  {
    icon: Clock,
    number: "02",
    title: "EAT Timezone & Hashing Correction",
    description:
      "Automatically synchronizes timestamps to East Africa Time (UTC+3) and handles Base64 shortcode derivation, eliminating silent STK Push rejections from time drift.",
    span: "lg:col-span-1",
  },
  {
    icon: Workflow,
    number: "03",
    title: "Webhook ResultParameter Flattening",
    description:
      "Transforms nested Daraja callback arrays and string-encoded booleans into strongly typed domain models with discriminated union states.",
    span: "lg:col-span-1",
  },
  {
    icon: ShieldAlert,
    number: "04",
    title: "Client-Side Pre-Flight Validation",
    description:
      "Validates payload structures, callback URLs, and phone prefixes locally before network dispatch, cutting out sandbox trial-and-error.",
    span: "lg:col-span-1",
  },
  {
    icon: CloudCog,
    number: "05",
    title: "Edge-First Web Standards Core",
    description:
      "Built strictly on native fetch and AbortController without Node.js core locks. Runs seamlessly on Vercel Edge, Cloudflare Workers, Deno, and Bun.",
    span: "lg:col-span-1",
  },
  {
    icon: TimerReset,
    number: "06",
    title: "Native Timeout & Cancellation Control",
    description:
      "Protects server resources during upstream sandbox degradation with built-in AbortSignal support, preventing hanging requests.",
    span: "lg:col-span-1",
  },
  {
    icon: PackageX,
    number: "07",
    title: "Zero-Dependency Footprint",
    description:
      "Ships with zero third-party runtime dependencies, dual ESM/CJS outputs, and a single bundled declaration file for clean bundle hygiene.",
    span: "lg:col-span-2",
  },
];

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white text-zinc-900 antialiased selection:bg-zinc-900 selection:text-white dark:bg-[#000000] dark:text-zinc-100 dark:selection:bg-white dark:selection:text-zinc-900">
      <main className="relative overflow-hidden">
        <section className="relative isolate overflow-hidden border-b border-zinc-200/80 dark:border-zinc-900">
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

          <div className="relative z-10 mx-auto flex min-h-[780px] w-full max-w-7xl flex-col items-center justify-center px-5 py-28 text-center sm:px-6 lg:px-8">
            <div className="flex max-w-4xl flex-col items-center">
              <h1 className="text-balance text-5xl font-bold tracking-tight sm:text-6xl md:text-7xl lg:text-[5.5rem] leading-[1.02] text-zinc-950 dark:text-zinc-50">
                M-Pesa payments,
                <br />
                <span className="bg-gradient-to-r from-zinc-900 via-zinc-600 to-zinc-400 bg-clip-text text-transparent dark:from-white dark:via-zinc-200 dark:to-zinc-500">
                  engineered for TypeScript.
                </span>
              </h1>

              <p className="mx-auto mt-6 max-w-2xl text-pretty text-base leading-relaxed text-zinc-600 dark:text-zinc-400 sm:text-lg">
                Stop hand-crafting PascalCase payloads, wrestling EAT timestamp
                drift, and managing OAuth tokens manually. @lumierelabs/daraja
                provides strict end-to-end types, client-side pre-flight
                validation, and native edge compatibility with zero
                dependencies.
              </p>
            </div>

            <div className="mx-auto mt-10 flex w-full max-w-[280px] flex-col items-stretch gap-3 sm:max-w-[320px]">
              <InstallCommand packageName="@lumierelabs/daraja" />

              <Link
                href="/docs/sdk"
                className="group flex h-11 w-full items-center justify-between rounded-xl bg-zinc-900 px-4 text-xs font-medium text-zinc-50 shadow-sm transition-all duration-200 hover:bg-zinc-800 hover:shadow-md sm:text-sm dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white"
              >
                <span>Explore Documentation</span>
                <ArrowRight className="size-4 text-zinc-400 transition-transform duration-200 group-hover:translate-x-1 dark:text-zinc-500" />
              </Link>
            </div>

            <div className="mt-12 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-xs font-medium text-zinc-500 dark:text-zinc-400">
              <span className="inline-flex items-center gap-2">
                <Check className="size-3.5 text-emerald-500 stroke-[2.5]" />
                No runtime dependencies
              </span>
              <span className="hidden h-3 w-px bg-zinc-200 dark:bg-zinc-800 sm:block" />
              <span className="inline-flex items-center gap-2">
                <Check className="size-3.5 text-emerald-500 stroke-[2.5]" />
                Fully typed payloads
              </span>
              <span className="hidden h-3 w-px bg-zinc-200 dark:bg-zinc-800 sm:block" />
              <span className="inline-flex items-center gap-2">
                <Check className="size-3.5 text-emerald-500 stroke-[2.5]" />
                Server &amp; Edge ready
              </span>
            </div>
          </div>
        </section>

        <section className="relative overflow-hidden border-b border-zinc-200/80 bg-zinc-50/40 dark:border-zinc-900 dark:bg-[#000000]">
          <div className="relative mx-auto w-full max-w-7xl px-5 py-24 sm:px-6 md:py-32 lg:px-8">
            <div className="mb-16 max-w-3xl">
              <div className="mb-4 inline-flex items-center gap-2.5">
                <span className="font-mono text-xs font-semibold uppercase tracking-widest text-[#00A651]">
                  Architectural Solutions
                </span>
                <span className="h-px w-10 bg-zinc-300 dark:bg-zinc-800" />
              </div>

              <h2 className="text-3xl font-bold tracking-tight text-zinc-950 dark:text-zinc-50 sm:text-4xl lg:text-5xl">
                Daraja is straightforward.
                <br />
                <span className="text-zinc-400 dark:text-zinc-600">
                  Integrating it cleanly isn&apos;t.
                </span>
              </h2>

              <p className="mt-5 max-w-2xl text-base leading-relaxed text-zinc-600 dark:text-zinc-400">
                The hard part of an M-Pesa integration is rarely calling the API
                endpoints. It&apos;s managing token lifecycles, timezone drift,
                callback parsing, validation, and multi-runtime compatibility.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:gap-5 lg:grid-cols-3">
              {architecturalSolutions.map((item) => {
                const Icon = item.icon;

                return (
                  <article
                    key={item.number}
                    className={`group relative flex min-h-[240px] flex-col justify-between overflow-hidden rounded-2xl border border-zinc-200/80 bg-white p-6 transition-all duration-300 hover:border-[#00A651]/40 dark:border-zinc-800/80 dark:bg-zinc-900/40 dark:hover:border-[#00A651]/50 sm:p-7 ${item.span}`}
                  >
                    <div>
                      <div className="mb-6 flex items-start justify-between">
                        <div className="card-icon flex size-11 items-center justify-center rounded-xl border border-zinc-200/80 bg-zinc-50 text-[#00A651] transition-transform duration-300 dark:border-zinc-800 dark:bg-zinc-950/80">
                          <Icon className="size-5 stroke-[1.8]" />
                        </div>

                        <span className="font-mono text-xs font-semibold tracking-wider text-zinc-400 dark:text-zinc-600">
                          {item.number}
                        </span>
                      </div>

                      <h3 className="text-base font-semibold tracking-tight text-zinc-900 dark:text-zinc-100 sm:text-lg">
                        {item.title}
                      </h3>

                      <p className="mt-2.5 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
                        {item.description}
                      </p>
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        </section>

        <section className="border-b border-zinc-200/80 dark:border-zinc-900">
          <div className="mx-auto w-full max-w-7xl px-5 py-24 sm:px-6 md:py-32 lg:px-8">
            <div className="mb-12 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
              <div className="max-w-2xl">
                <h2 className="text-3xl font-bold tracking-tight text-zinc-950 dark:text-zinc-50 sm:text-4xl">
                  Built for the environments
                  <br className="hidden sm:block" />
                  you already use.
                </h2>

                <p className="mt-4 max-w-xl text-sm leading-relaxed text-zinc-600 dark:text-zinc-400 sm:text-base">
                  One clean API across TypeScript, Next.js, Astro, and webhook
                  infrastructure. Keep your code predictable and let the SDK
                  handle the complexity.
                </p>
              </div>

              <Link
                href="/docs/sdk/sdk"
                className="group inline-flex w-fit shrink-0 items-center gap-2 text-sm font-medium text-zinc-600 transition-colors hover:text-zinc-950 dark:text-zinc-400 dark:hover:text-zinc-50"
              >
                <span>Read the documentation</span>
                <ArrowRight className="size-4 transition-transform duration-200 group-hover:translate-x-1" />
              </Link>
            </div>

            <div>
              <CodeShowcase />
            </div>
          </div>
        </section>

        <section className="border-b border-border">
          <div className="mx-auto w-full max-w-7xl px-5 py-24 sm:px-6 md:py-32 lg:px-8">
            <div className="grid gap-14 lg:grid-cols-[0.7fr_1.3fr] lg:gap-20">
              <div className="lg:sticky lg:top-24 lg:self-start">
                <h2 className="max-w-md text-3xl font-semibold tracking-tight sm:text-4xl lg:text-[2.75rem] lg:leading-[1.08]">
                  Everything Daraja
                  <br />
                  needs. Nothing it doesn&apos;t.
                </h2>

                <p className="mt-5 max-w-md text-sm leading-6 text-muted-foreground sm:text-[15px]">
                  The SDK handles the awkward parts of the M-Pesa API while
                  keeping your application code predictable, typed, and easy to
                  maintain.
                </p>
              </div>

              <div className="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-card/30">
                {Features.map((feature, index) => {
                  const Icon = feature.icon;

                  return (
                    <article
                      key={feature.title}
                      className="group relative px-5 py-7 transition-colors duration-200 hover:bg-muted/25 sm:px-7 sm:py-8"
                    >
                      <div className="flex gap-5 sm:gap-6">
                        <div className="shrink-0">
                          <div className="card-icon flex size-10 items-center justify-center rounded-lg border border-border bg-background text-[#00A651] transition-all duration-200 group-hover:border-[#00A651]/30 group-hover:bg-[#00A651]/[0.06] group-hover:shadow-[0_0_24px_-12px_#00A651]">
                            <Icon
                              aria-hidden="true"
                              className="size-[18px] stroke-[1.7]"
                            />
                          </div>
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
                            <h3 className="text-[15px] font-semibold tracking-tight text-foreground sm:text-base">
                              {feature.title}
                            </h3>

                            <span className="shrink-0 font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground/60">
                              {String(index + 1).padStart(2, "0")}
                            </span>
                          </div>

                          <p className="mt-2.5 max-w-3xl text-sm leading-6 text-muted-foreground">
                            {feature.description}
                          </p>

                          {feature.tags?.length ? (
                            <div className="mt-4 flex flex-wrap gap-2">
                              {feature.tags.map((tag) => (
                                <span
                                  key={tag}
                                  className="rounded-md border border-border bg-background px-2 py-1 font-mono text-[10px] text-muted-foreground"
                                >
                                  {tag}
                                </span>
                              ))}
                            </div>
                          ) : null}
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        <section className="relative overflow-hidden">
          <div className="mx-auto flex w-full max-w-4xl flex-col items-center px-5 py-28 text-center sm:px-6 md:py-36 lg:px-8">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1 text-xs font-mono text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900/50 dark:text-zinc-400">
              <span>Ready to deploy</span>
            </div>

            <h2 className="text-4xl font-bold tracking-tight text-zinc-950 dark:text-zinc-50 sm:text-5xl lg:text-6xl">
              Start building your M-Pesa flow.
            </h2>

            <p className="mt-5 max-w-xl text-base leading-relaxed text-zinc-600 dark:text-zinc-400 sm:text-lg">
              Stop maintaining payment boilerplate. Install the SDK, configure
              your Daraja credentials, and ship your integration in minutes.
            </p>

            <div className="mt-10 flex flex-col items-center justify-center gap-3.5 sm:flex-row w-full max-w-md">
              <Link
                href="/docs/sdk/sdk"
                className="relative inline-flex h-12 w-full sm:w-auto items-center justify-center rounded-full bg-white text-zinc-900 border border-zinc-200 font-medium px-6 py-1 ps-6 pe-14 hover:ps-14 hover:pe-6 group overflow-hidden shadow-sm transition-all duration-500 dark:bg-zinc-900 dark:text-white dark:border-zinc-800"
              >
                <span className="relative z-10 transition-all duration-500">
                  Get started
                </span>
                <div className="absolute right-1 flex size-10 items-center justify-center rounded-full bg-zinc-900 text-white shadow-sm transition-all duration-500 group-hover:right-[calc(100%-44px)] group-hover:rotate-45 dark:bg-white dark:text-zinc-900">
                  <ArrowRight className="size-4" />
                </div>
              </Link>

              <Link
                href="https://github.com/Mahito0X/Daraja-SDK"
                target="_blank"
                rel="noreferrer"
                className="inline-flex h-12 w-full items-center justify-center gap-2.5 rounded-full border border-zinc-200/80 bg-white px-7 text-sm font-medium text-zinc-900 shadow-sm transition-all duration-200 hover:border-zinc-300 hover:bg-zinc-50 sm:w-auto dark:border-zinc-800 dark:bg-zinc-900/80 dark:text-zinc-100 dark:hover:border-zinc-700 dark:hover:bg-zinc-800"
              >
                <GitHub className="size-4" />
                View on GitHub
              </Link>
            </div>

            <div className="mt-12 flex items-center gap-3 rounded-full border border-zinc-200/80 bg-zinc-50/80 px-4 py-2 font-mono text-xs text-zinc-600 shadow-sm backdrop-blur-md dark:border-zinc-800 dark:bg-zinc-900/60 dark:text-zinc-400">
              <NPM className="size-4 shrink-0 text-red-500" />
              <span>npm install @lumierelabs/daraja</span>
              <CopyButton
                text="npm install @lumierelabs/daraja"
                className="ml-1.5 shrink-0 transition-colors hover:text-zinc-950 dark:hover:text-white"
              />
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
