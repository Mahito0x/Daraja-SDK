import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, BookOpen, Home } from "lucide-react";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "404 Page Not Found",
};

export default function NotFound() {
  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-background px-6 text-center text-foreground">
      <div
        aria-hidden="true"
        className="hero-grid pointer-events-none absolute inset-0"
      />

      <div className="relative flex flex-col items-center">
        <span className="font-mono text-sm font-medium tracking-widest text-emerald-600 dark:text-emerald-400">
          404
        </span>

        <h1 className="mt-4 text-balance text-4xl font-bold tracking-tight sm:text-5xl">
          This route doesn&apos;t exist.
        </h1>

        <p className="mt-4 max-w-md text-pretty text-muted-foreground">
          Haipo. It&apos;s not here, never was, or it left without telling
          anyone kind of like an M-Pesa callback that never fires.
        </p>

        <div className="mt-8 w-full max-w-sm overflow-hidden rounded-xl border border-border bg-card text-left shadow-lg">
          <div className="flex items-center gap-1.5 border-b border-border px-4 py-2.5">
            <span className="size-2.5 rounded-full bg-muted-foreground/30" />
            <span className="size-2.5 rounded-full bg-muted-foreground/30" />
            <span className="size-2.5 rounded-full bg-muted-foreground/30" />
          </div>
          <pre className="p-4 font-mono text-xs leading-6 text-muted-foreground sm:text-sm">
            <span className="text-emerald-600 dark:text-emerald-400">$</span>{" "}
            curl darajasdk.vercel.app/this-page
            {"\n"}
            404 Not Found hakuna kitu hapa
          </pre>
        </div>

        <div className="mt-10 flex w-full max-w-sm flex-col gap-3 sm:flex-row">
          <Button className="flex-1">
            <Link
              href="/"
              className="inline-flex items-center justify-center gap-2"
            >
              <Home className="size-4" />
              Go home
            </Link>
          </Button>
          <Button variant="outline" className="flex-1">
            <Link
              href="/docs"
              className="inline-flex items-center justify-center gap-2"
            >
              <BookOpen className="size-4" />
              Read the docs
              <ArrowRight className="size-4" />
            </Link>
          </Button>
        </div>
      </div>
    </main>
  );
}
