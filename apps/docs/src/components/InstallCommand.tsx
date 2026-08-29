// components/install-command.tsx
"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Pnpm, NPM, Yarn, Bun } from "./Icons";
import { CopyButton } from "./CopyButton";

const PM_LIST = [
  { id: "pnpm", label: "pnpm", icon: Pnpm },
  { id: "npm", label: "npm", icon: NPM },
  { id: "yarn", label: "yarn", icon: Yarn },
  { id: "bun", label: "bun", icon: Bun },
] as const;

type PmId = (typeof PM_LIST)[number]["id"];

type InstallCommandProps =
  | { packageName: string; registryUrl?: never; className?: string }
  | { registryUrl: string; packageName?: never; className?: string };

function buildCommand(pm: PmId, props: InstallCommandProps): string {
  if ("registryUrl" in props && props.registryUrl) {
    const url = props.registryUrl;
    switch (pm) {
      case "npm":
        return `npx shadcn@latest add ${url}`;
      case "yarn":
        return `yarn dlx shadcn@latest add ${url}`;
      case "bun":
        return `bunx --bun shadcn@latest add ${url}`;
      default:
        return `pnpm dlx shadcn@latest add ${url}`;
    }
  }

  const pkg = (props as { packageName: string }).packageName;
  switch (pm) {
    case "npm":
      return `npm i ${pkg}`;
    case "yarn":
      return `yarn add ${pkg}`;
    case "bun":
      return `bun add ${pkg}`;
    default:
      return `pnpm add ${pkg}`;
  }
}

export function InstallCommand(props: InstallCommandProps) {
  const [pm, setPm] = useState<PmId>("pnpm");
  const command = buildCommand(pm, props);

  return (
    <div
      className={cn(
        "flex w-full max-w-[280px] sm:max-w-[320px] mx-auto flex-col overflow-hidden rounded-xl border border-black/10 bg-white/70 shadow-[0_1px_2px_rgba(0,0,0,0.04)] backdrop-blur-xl dark:border-white/10 dark:bg-neutral-900/70",
        props.className,
      )}
    >
      <div className="flex items-center justify-between gap-1 p-1.5">
        {PM_LIST.map((item) => {
          const Icon = item.icon;
          const isActive = pm === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setPm(item.id)}
              className={cn(
                "relative flex flex-1 items-center justify-center gap-1.5 whitespace-nowrap rounded-lg py-1.5 text-xs font-medium transition-colors",
                isActive
                  ? "text-neutral-900 dark:text-white"
                  : "text-neutral-500 hover:text-neutral-800 dark:text-neutral-500 dark:hover:text-neutral-300",
              )}
              title={`Switch to ${item.label}`}
            >
              {isActive && (
                <motion.span
                  layoutId="install-pm-highlight"
                  className="absolute inset-0 rounded-lg bg-black/[0.06] dark:bg-white/10"
                  transition={{ type: "spring", stiffness: 500, damping: 35 }}
                />
              )}
              <Icon className="relative h-3.5 w-3.5 shrink-0" />
              <span className="relative">{item.label}</span>
            </button>
          );
        })}
      </div>

      <div className="h-px bg-black/10 dark:bg-white/10" />

      <div className="flex h-11 items-center justify-between gap-2 bg-black/[0.03] px-3.5 dark:bg-black/50">
        <div className="flex min-w-0 items-center gap-1.5 font-mono text-xs sm:text-sm text-neutral-800 dark:text-neutral-200">
          <span className="font-semibold text-emerald-600 dark:text-emerald-400">
            &gt;_
          </span>
          <span className="truncate">{command}</span>
        </div>
        <CopyButton text={command} className="shrink-0" />
      </div>
    </div>
  );
}
