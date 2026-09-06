"use client";

import { useEffect, useRef } from "react";

const stats = [
  { value: 0, suffix: "", label: "Runtime dependencies" },
  { value: 9, suffix: "", label: "Implemented Daraja services" },
  { value: 27, suffix: "", label: "API reference pages" },
  { value: 60, suffix: "s", label: "Token refresh buffer" },
] as const;

export function StatCounters() {
  const containerRef = useRef<HTMLDivElement>(null);
  const numberRefs = useRef<Array<HTMLSpanElement | null>>([]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const setStatic = () => {
      numberRefs.current.forEach((el, i) => {
        if (el) el.textContent = `${stats[i].value}${stats[i].suffix}`;
      });
    };

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setStatic();
      return;
    }

    let cancelled = false;

    Promise.all([import("gsap"), import("gsap/ScrollTrigger")]).then(
      ([{ gsap }, { ScrollTrigger }]) => {
        if (cancelled) return;
        gsap.registerPlugin(ScrollTrigger);

        stats.forEach((stat, i) => {
          const el = numberRefs.current[i];
          if (!el) return;

          const counter = { value: 0 };
          gsap.to(counter, {
            value: stat.value,
            duration: 1.4,
            ease: "power2.out",
            scrollTrigger: {
              trigger: container,
              start: "top 85%",
              once: true,
            },
            onUpdate: () => {
              el.textContent = `${Math.round(counter.value)}${stat.suffix}`;
            },
          });
        });
      },
    );

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="grid grid-cols-2 gap-8 border-b border-border py-14 sm:grid-cols-4"
    >
      {stats.map((stat, i) => (
        <div key={stat.label} className="text-center">
          <span
            ref={(el) => {
              numberRefs.current[i] = el;
            }}
            className="block text-3xl font-semibold tabular-nums tracking-tight sm:text-4xl"
          >
            0
          </span>
          <span className="mt-1 block text-xs text-muted-foreground sm:text-sm">
            {stat.label}
          </span>
        </div>
      ))}
    </div>
  );
}
