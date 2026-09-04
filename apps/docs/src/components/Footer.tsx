"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, KeyRound, GitCommit } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Astro,
  Discord,
  Expressjs,
  GitHub,
  Nextjs,
  NPM,
  ReactRouter,
  X,
} from "@/components/Icons";

// ---------------------------------------------------------------------------
// Shared links — single source of truth so the same URL never drifts
// between the CTA, the resources column, and the social row.
// ---------------------------------------------------------------------------

const GITHUB_URL = "https://github.com/Mahito0x/Daraja-SDK";
const NPM_URL = "https://www.npmjs.com/package/@lumierelabs/daraja";
const TWITTER_URL = "https://x.com/_M4hito";
const DISCORD_URL = "https://discord.gg/";
const SAFARICOM_URL = "https://developer.safaricom.co.ke";

const docsLinks = [
  { label: "Getting Started", href: "/docs" },
  { label: "Installation", href: "/docs/getting-started/installation" },
  { label: "Quickstart Guide", href: "/docs/getting-started/quickstart" },
  { label: "Error Handling", href: "/docs/core-concepts/error-handling" },
];

const endpointLinks = [
  {
    label: "M-Pesa Express (STK)",
    href: "/docs/endpoints/mpesa-express-stk-push",
  },
  { label: "C2B Payments", href: "/docs/endpoints/c2b" },
  { label: "B2C Account Top Up", href: "/docs/endpoints/b2c-top-up" },
  { label: "B2B Hakikisha", href: "/docs/endpoints/b2b-hakikisha" },
];

const integrationLinks = [
  {
    label: "Next.js App Router",
    href: "/docs/integrations/nextjs",
    icon: Nextjs,
  },
  { label: "Astro", href: "/docs/integrations/astro", icon: Astro },
  {
    label: "Remix / React Router",
    href: "/docs/integrations/remix",
    icon: ReactRouter,
  },
  {
    label: "Express / Node.js",
    href: "/docs/integrations/express",
    icon: Expressjs,
  },
];

const resourceLinks = [
  { label: "npm Package", href: NPM_URL, external: true, icon: NPM },
  {
    label: "GitHub Repository",
    href: GITHUB_URL,
    external: true,
    icon: GitHub,
  },
  {
    label: "Safaricom Developer Portal",
    href: SAFARICOM_URL,
    external: true,
    icon: KeyRound,
  },
  { label: "API Changelog", href: "/docs/changelog", icon: GitCommit },
];

const socialLinks = [
  { label: "GitHub", href: GITHUB_URL, icon: GitHub },
  { label: "npm", href: NPM_URL, icon: NPM },
  { label: "X / Twitter", href: TWITTER_URL, icon: X },
  { label: "Discord", href: DISCORD_URL, icon: Discord },
];

// ---------------------------------------------------------------------------
// NavColumn
// ---------------------------------------------------------------------------

function NavColumn({
  title,
  links,
  className,
}: {
  title: string;
  links: {
    label: string;
    href: string;
    external?: boolean;
    icon?: React.ComponentType<{ className?: string }>;
  }[];
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col gap-3", className)}>
      <span className="text-[10px] font-bold tracking-widest text-muted-foreground uppercase">
        {title}
      </span>
      <ul className="flex flex-col gap-2.5">
        {links.map((item) => {
          const Icon = item.icon;
          return (
            <li key={item.label}>
              <Link
                href={item.href}
                target={item.external ? "_blank" : undefined}
                rel={item.external ? "noopener noreferrer" : undefined}
                className="inline-flex items-center gap-2 text-xs text-muted-foreground transition-colors duration-200 hover:text-foreground"
              >
                {Icon && (
                  <Icon className="h-3.5 w-3.5 shrink-0 opacity-70 transition-opacity duration-200 group-hover:opacity-100" />
                )}
                <span>{item.label}</span>
                {item.external && (
                  <span className="text-muted-foreground/70">
                    <ArrowUpRight className="h-3 w-3" />
                  </span>
                )}
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export default function Footer() {
  return (
    <footer className="relative w-full bg-background text-foreground dark:bg-black selection:bg-emerald-500/20 selection:text-emerald-400">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-emerald-500/40 to-transparent" />

      <div className="rounded-t-3xl border-t border-border/40 bg-background px-6 pt-14 dark:bg-black sm:px-10">
        <div className="mx-auto max-w-7xl">
          <div className="grid grid-cols-2 gap-x-6 gap-y-10 sm:grid-cols-4 lg:grid-cols-12 lg:gap-8 lg:items-start">
            <div className="col-span-2 flex flex-col gap-5 lg:col-span-4">
              <Link
                href="/"
                className="inline-flex items-center gap-2.5 select-none"
              >
                <div className="shrink-0 transition-transform duration-200 hover:-rotate-4 hover:scale-105">
                  <Image
                    src="/logomark.svg"
                    alt="Daraja SDK Logomark"
                    width={32}
                    height={32}
                    priority
                    style={{ width: "auto" }}
                    className="h-8 object-contain"
                  />
                </div>
                <span className="text-xl font-black leading-none tracking-tighter">
                  <span className="text-[#00A651]">Daraja</span>{" "}
                  <span className="text-foreground">SDK</span>
                </span>
              </Link>

              <p className="max-w-xs text-sm leading-relaxed text-muted-foreground">
                Modern, type-safe TypeScript SDK for Safaricom M-Pesa APIs.
                High-level abstractions with zero external dependencies.
              </p>

              <div className="flex flex-wrap gap-3">
                <Link
                  href="/docs/getting-started/installation"
                  aria-label="Get started with the Daraja SDK"
                  className="inline-flex h-9 items-center justify-center rounded-full border border-foreground bg-foreground px-5 text-xs font-semibold text-background transition-colors hover:bg-foreground/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                >
                  Get Started
                </Link>

                <Link
                  href={GITHUB_URL}
                  target="_blank"
                  rel="noreferrer"
                  aria-label="View the Daraja SDK GitHub repository"
                  className="inline-flex h-9 items-center justify-center gap-1.5 rounded-full border border-border/60 bg-transparent px-5 text-xs font-medium text-foreground transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                >
                  <GitHub className="h-3.5 w-3.5" />
                  GitHub
                </Link>
              </div>
            </div>

            <div className="col-span-2 grid grid-cols-2 gap-8 sm:col-span-4 lg:col-span-8">
              <NavColumn title="Documentation" links={docsLinks} />
              <NavColumn title="Endpoints" links={endpointLinks} />
              <NavColumn title="Integrations" links={integrationLinks} />
              <NavColumn title="Resources" links={resourceLinks} />
            </div>
          </div>

          <div className="flex items-center justify-center gap-2.5 py-6 sm:justify-start">
            {socialLinks.map(({ label, href, icon: Icon }) => (
              <Link
                key={label}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={label}
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border/60 bg-transparent text-muted-foreground transition-colors hover:border-emerald-500/40 hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              >
                <Icon className="h-4 w-4" aria-hidden="true" />
              </Link>
            ))}
          </div>

          <div className="flex flex-col-reverse items-center justify-between gap-4 border-t border-border/40 py-6 text-[11px] text-muted-foreground sm:flex-row">
            <p>
              © {new Date().getFullYear()} Daraja SDK. Released under the MIT
              License.
            </p>

            <div className="flex items-center gap-2">
              <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-0.5 text-[10px] font-medium text-amber-500">
                Not affiliated with Safaricom PLC
              </span>
            </div>
          </div>
        </div>

        <div
          aria-hidden="true"
          className="relative h-[0.62em] w-full overflow-hidden select-none pointer-events-none"
          style={{ fontSize: "clamp(3.5rem, 16vw, 12rem)" }}
        >
          <p
            className={cn(
              "absolute inset-x-0 top-0 whitespace-nowrap text-center text-[1em] font-black uppercase leading-none tracking-tighter",
              "bg-gradient-to-b from-foreground/15 to-transparent bg-clip-text text-transparent dark:from-white/10",
            )}
          >
            Daraja SDK
          </p>
        </div>
      </div>
    </footer>
  );
}
