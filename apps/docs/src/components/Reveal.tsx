"use client";

import type { ReactNode } from "react";
import { LazyMotion, domAnimation, m } from "framer-motion";

const EASE = [0.16, 1, 0.3, 1] as const;

/**
 * Plays once on mount. Used only for secondary hero elements so the
 * LCP candidate (the H1) is never gated behind an animation frame.
 */
export function Reveal({
  children,
  delay = 0,
  y = 10,
  className,
}: {
  children: ReactNode;
  delay?: number;
  y?: number;
  className?: string;
}) {
  return (
    <LazyMotion features={domAnimation} strict>
      <m.div
        initial={{ opacity: 0, y }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, delay, ease: EASE }}
        className={className}
      >
        {children}
      </m.div>
    </LazyMotion>
  );
}

/**
 * Plays once when scrolled into view. Used below the fold only, so it
 * never competes with initial paint.
 */
export function RevealOnView({
  children,
  delay = 0,
  y = 14,
  className,
}: {
  children: ReactNode;
  delay?: number;
  y?: number;
  className?: string;
}) {
  return (
    <LazyMotion features={domAnimation} strict>
      <m.div
        initial={{ opacity: 0, y }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.45, delay, ease: EASE }}
        className={className}
      >
        {children}
      </m.div>
    </LazyMotion>
  );
}
