import { ComponentPropsWithoutRef } from "react";
import { cn } from "@/lib/utils";

interface MarqueeProps extends ComponentPropsWithoutRef<"div"> {
  className?: string;
  reverse?: boolean;
  pauseOnHover?: boolean;
  children: React.ReactNode;
  vertical?: boolean;
  repeat?: number;
}

export function Marquee({
  className,
  reverse = false,
  pauseOnHover = true,
  children,
  vertical = false,
  repeat = 4,
  ...props
}: MarqueeProps) {
  return (
    <>
      <style>{`
        @keyframes marquee-horizontal {
          from { transform: translateX(0); }
          to { transform: translateX(calc(-100% - var(--gap, 2.5rem))); }
        }
        @keyframes marquee-vertical {
          from { transform: translateY(0); }
          to { transform: translateY(calc(-100% - var(--gap, 2.5rem))); }
        }
        .animate-marquee-h {
          animation: marquee-horizontal var(--duration, 30s) linear infinite;
        }
        .animate-marquee-v {
          animation: marquee-vertical var(--duration, 30s) linear infinite;
        }
        .animate-reverse {
          animation-direction: reverse !important;
        }
        /* Bulletproof hover pause */
        .group:hover .marquee-pause-on-hover {
          animation-play-state: paused !important;
        }
      `}</style>

      <div
        {...props}
        className={cn(
          "group flex overflow-hidden p-2 gap-[var(--gap,2.5rem)] [--duration:30s] [--gap:2.5rem]",
          vertical ? "flex-col" : "flex-row",
          className,
        )}
      >
        {Array(repeat)
          .fill(0)
          .map((_, i) => (
            <div
              key={i}
              className={cn(
                "flex shrink-0 items-center justify-around gap-[var(--gap,2.5rem)]",
                vertical
                  ? "animate-marquee-v flex-col"
                  : "animate-marquee-h flex-row",
                reverse && "animate-reverse",
                pauseOnHover && "marquee-pause-on-hover",
              )}
            >
              {children}
            </div>
          ))}
      </div>
    </>
  );
}
