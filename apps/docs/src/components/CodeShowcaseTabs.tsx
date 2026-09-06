"use client";

import { useState, type ReactNode } from "react";
import { CopyButton } from "@/components/CopyButton";
import posthog from "posthog-js";

const isPostHogConfigured = Boolean(
  process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN &&
  process.env.NEXT_PUBLIC_POSTHOG_HOST,
);

type Tab = {
  id: string;
  filename: string;
  code: string;
  html: string;
  icon: ReactNode;
};

export function CodeShowcaseTabs({ tabs }: { tabs: Tab[] }) {
  const [activeId, setActiveId] = useState(tabs[0]?.id);
  const activeTab = tabs.find((tab) => tab.id === activeId) ?? tabs[0];

  return (
    <div className="w-full overflow-hidden rounded-2xl border border-zinc-200/80 bg-background shadow-xl dark:border-zinc-800">
      {/* Top Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-200/80 bg-zinc-50/80 px-4 py-2.5 dark:border-zinc-800 dark:bg-zinc-900/60">
        {/* Left: macOS dots & file tabs */}
        <div className="flex min-w-0 items-center gap-3">
          {/* macOS Control Dots */}
          <div className="group/dots hidden sm:flex shrink-0 items-center gap-1.5 pr-2 border-r border-zinc-200 dark:border-zinc-800">
            {/* Close */}
            <svg
              viewBox="0 0 85.4 85.4"
              className="size-3 shrink-0"
              xmlns="http://www.w3.org/2000/svg"
            >
              <g clipRule="evenodd" fillRule="evenodd">
                <path
                  d="m42.7 85.4c23.6 0 42.7-19.1 42.7-42.7s-19.1-42.7-42.7-42.7-42.7 19.1-42.7 42.7 19.1 42.7 42.7 42.7z"
                  fill="#e24b41"
                />
                <path
                  d="m42.7 81.8c21.6 0 39.1-17.5 39.1-39.1s-17.5-39.1-39.1-39.1-39.1 17.5-39.1 39.1 17.5 39.1 39.1 39.1z"
                  fill="#ed6a5f"
                />
                <g
                  fill="#460804"
                  className="opacity-0 transition-opacity duration-150 group-hover/dots:opacity-100"
                >
                  <path d="m22.5 57.8 35.3-35.3c1.4-1.4 3.6-1.4 5 0l.1.1c1.4 1.4 1.4 3.6 0 5l-35.3 35.3c-1.4 1.4-3.6 1.4-5 0l-.1-.1c-1.3-1.4-1.3-3.6 0-5z" />
                  <path d="m27.6 22.5 35.3 35.3c1.4 1.4 1.4 3.6 0 5l-.1.1c-1.4 1.4-3.6 1.4-5 0l-35.3-35.3c-1.4-1.4-1.4-3.6 0-5l.1-.1c1.4-1.3 3.6-1.3 5 0z" />
                </g>
              </g>
            </svg>
            {/* Minimize */}
            <svg
              viewBox="0 0 85.4 85.4"
              className="size-3 shrink-0"
              xmlns="http://www.w3.org/2000/svg"
            >
              <g clipRule="evenodd" fillRule="evenodd">
                <path
                  d="m42.7 85.4c23.6 0 42.7-19.1 42.7-42.7s-19.1-42.7-42.7-42.7-42.7 19.1-42.7 42.7 19.1 42.7 42.7 42.7z"
                  fill="#e1a73e"
                />
                <path
                  d="m42.7 81.8c21.6 0 39.1-17.5 39.1-39.1s-17.5-39.1-39.1-39.1-39.1 17.5-39.1 39.1 17.5 39.1 39.1 39.1z"
                  fill="#f6be50"
                />
                <path
                  d="m17.8 39.1h49.9c1.9 0 3.5 1.6 3.5 3.5v.1c0 1.9-1.6 3.5-3.5 3.5h-49.9c-1.9 0-3.5-1.6-3.5-3.5v-.1c0-1.9 1.5-3.5 3.5-3.5z"
                  fill="#90591d"
                  className="opacity-0 transition-opacity duration-150 group-hover/dots:opacity-100"
                />
              </g>
            </svg>
            {/* Maximize */}
            <svg
              viewBox="0 0 85.4 85.4"
              className="size-3 shrink-0"
              xmlns="http://www.w3.org/2000/svg"
            >
              <g clipRule="evenodd" fillRule="evenodd">
                <path
                  d="m42.7 85.4c23.6 0 42.7-19.1 42.7-42.7s-19.1-42.7-42.7-42.7-42.7 19.1-42.7 42.7 19.1 42.7 42.7 42.7z"
                  fill="#2dac2f"
                />
                <path
                  d="m42.7 81.8c21.6 0 39.1-17.5 39.1-39.1s-17.5-39.1-39.1-39.1-39.1 17.5-39.1 39.1 17.5 39.1 39.1 39.1z"
                  fill="#61c555"
                />
                <path
                  d="m31.2 20.8h26.7c3.6 0 6.5 2.9 6.5 6.5v26.7zm23.2 43.7h-26.8c-3.6 0-6.5-2.9-6.5-6.5v-26.8z"
                  fill="#2a6218"
                  className="opacity-0 transition-opacity duration-150 group-hover/dots:opacity-100"
                />
              </g>
            </svg>
          </div>

          {/* Interactive File Switcher Tabs */}
          <div className="flex items-center gap-1 overflow-x-auto py-0.5">
            {tabs.map((tab) => {
              const isActive = tab.id === activeTab?.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => {
                    setActiveId(tab.id);
                    if (isPostHogConfigured) {
                      posthog.capture("code_example_selected", {
                        example_id: tab.id,
                      });
                    }
                  }}
                  className={[
                    "group relative flex shrink-0 items-center gap-2 rounded-lg px-3 py-1.5 font-mono text-xs transition-all duration-150",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    isActive
                      ? "bg-white text-zinc-900 shadow-sm border border-zinc-200/80 dark:bg-zinc-800 dark:text-zinc-100 dark:border-zinc-700/60"
                      : "text-muted-foreground hover:bg-zinc-200/50 hover:text-foreground border border-transparent dark:hover:bg-zinc-800/50",
                  ].join(" ")}
                >
                  <span
                    className={[
                      "inline-flex size-3.5 items-center justify-center shrink-0 [&_svg]:size-3.5 [&_svg]:shrink-0 transition-colors",
                      "[&_svg]:fill-current [&_svg]:stroke-current",
                      isActive
                        ? "text-zinc-900 dark:text-zinc-100"
                        : "text-muted-foreground group-hover:text-foreground",
                    ].join(" ")}
                  >
                    {tab.icon}
                  </span>
                  <span>{tab.filename}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right: Custom Copy Button */}
        <div className="shrink-0">
          <CopyButton text={activeTab?.code ?? ""} />
        </div>
      </div>

      {/* Code Viewer Body */}
      <div className="relative overflow-x-auto">
        <div
          key={activeTab?.id}
          className="showcase-code animate-in fade-in-50 duration-200 [&_pre]:m-0 [&_pre]:overflow-x-auto [&_pre]:bg-transparent [&_pre]:px-5 [&_pre]:py-5 [&_pre]:font-mono [&_pre]:text-[12px] [&_pre]:leading-6 sm:[&_pre]:px-6 sm:[&_pre]:py-6 sm:[&_pre]:text-[13px] sm:[&_pre]:leading-6.5 [&_code]:font-mono"
          dangerouslySetInnerHTML={{ __html: activeTab?.html ?? "" }}
        />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-background to-transparent" />
      </div>

      <style jsx global>{`
        .showcase-code,
        .showcase-code span {
          color: var(--shiki-light);
        }
        .showcase-code {
          background-color: var(--shiki-light-bg);
        }
        .dark .showcase-code,
        .dark .showcase-code span {
          color: var(--shiki-dark);
        }
        .dark .showcase-code {
          background-color: var(--shiki-dark-bg);
        }
      `}</style>
    </div>
  );
}

export default CodeShowcaseTabs;
