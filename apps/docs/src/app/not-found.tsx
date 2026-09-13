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
        <span className="font-mono text-2xl font-semibold tracking-widest text-emerald-600 dark:text-emerald-400">
          404
        </span>

        <h1 className="mt-4 text-balance text-4xl font-bold tracking-tight sm:text-5xl">
          This route doesn&apos;t exist.
        </h1>

        <p className="mt-4 max-w-md text-pretty text-muted-foreground">
          Haipo. It&apos;s not here, never was, or it left without telling
          anyone kind of like an M-Pesa callback that never fires.
        </p>

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
