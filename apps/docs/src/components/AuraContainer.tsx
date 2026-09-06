"use client";

import React, { useRef } from "react";

const clsx = (...args: (string | boolean | undefined | null)[]): string =>
  args.filter(Boolean).join(" ");

interface AuraContainerProps {
  children: React.ReactNode;
  className?: string;
  /** Custom gradient color stops */
  colors?: string[];
  /** Size of the radial glow circle in pixels */
  glowRadius?: number;
}

export function AuraContainer({
  children,
  className,
  colors = ["#9E7AFF", "#38bdf8", "#FF5C5C", "#FE8BBB"],
  glowRadius = 350,
}: AuraContainerProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    containerRef.current.style.setProperty("--mouse-x", `${mouseX}px`);
    containerRef.current.style.setProperty("--mouse-y", `${mouseY}px`);
  };

  const handleMouseLeave = () => {
    if (!containerRef.current) return;
    containerRef.current.style.setProperty("--mouse-x", "-999px");
    containerRef.current.style.setProperty("--mouse-y", "-999px");
  };

  const gradientStops = [...colors, "transparent 80%"].join(", ");

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={clsx(
        "relative rounded-3xl p-[1px] transition-colors duration-300",
        "bg-zinc-200 dark:bg-zinc-800",
        className,
      )}
      style={
        {
          "--mouse-x": "-999px",
          "--mouse-y": "-999px",
          backgroundImage: `radial-gradient(${glowRadius}px circle at var(--mouse-x) var(--mouse-y), ${gradientStops})`,
        } as React.CSSProperties
      }
    >
      <div className="h-full w-full rounded-[inherit] bg-white dark:bg-zinc-950">
        {children}
      </div>
    </div>
  );
}

export default AuraContainer;
