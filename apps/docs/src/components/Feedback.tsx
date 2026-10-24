"use client";

import React, {
  forwardRef,
  useCallback,
  useEffect,
  useRef,
  useState,
  type PointerEvent,
  type ReactNode,
} from "react";
import {
  AnimatePresence,
  motion,
  useMotionValue,
  useReducedMotion,
  useSpring,
  type HTMLMotionProps,
  type Variants,
} from "motion/react";
import { AlertCircle, MessageCircle, X, Check, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

/* -------------------------------------------------------------------------- */
/* HOOKS (lib/hooks/use-hover-capable.ts)                                     */
/* -------------------------------------------------------------------------- */

/**
 * Returns true only on devices that have a true hover (mouse / trackpad).
 * Touch devices fire phantom `:hover` on tap that sticks until tap-elsewhere
 * — gate hover-only effects (scale lifts, magnetic pulls) behind this.
 */
export function useHoverCapable() {
  const [canHover, setCanHover] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const mq = window.matchMedia("(hover: hover) and (pointer: fine)");
    const update = () => setCanHover(mq.matches);
    update();
    mq.addEventListener?.("change", update);
    return () => mq.removeEventListener?.("change", update);
  }, []);

  return canHover;
}

/* -------------------------------------------------------------------------- */
/* EASING & SPRINGS (lib/ease.ts)                                             */
/* -------------------------------------------------------------------------- */

export const EASE_OUT = [0.16, 1, 0.3, 1] as const;
export const EASE_IN_OUT = [0.77, 0, 0.175, 1] as const;
export const EASE_DRAWER = [0.32, 0.72, 0, 1] as const;

export const EASE_OUT_CSS = "cubic-bezier(0.16, 1, 0.3, 1)";

export const SPRING_PRESS = {
  type: "spring",
  stiffness: 500,
  damping: 30,
  mass: 0.6,
} as const;

export const SPRING_SWAP = {
  type: "spring",
  stiffness: 460,
  damping: 30,
  mass: 0.55,
} as const;

export const SPRING_PANEL = {
  type: "spring",
  stiffness: 420,
  damping: 40,
  mass: 0.5,
} as const;

export const SPRING_LAYOUT = {
  type: "spring",
  stiffness: 360,
  damping: 32,
  mass: 0.6,
} as const;

export const SPRING_MOUSE = {
  stiffness: 200,
  damping: 15,
  mass: 0.3,
} as const;

export const SPRING_GLIDE = {
  stiffness: 700,
  damping: 50,
  mass: 0.5,
} as const;

/* -------------------------------------------------------------------------- */
/* MAGNETIC WRAPPER (components/motion/magnetic.tsx)                           */
/* -------------------------------------------------------------------------- */

export interface MagneticProps {
  children: ReactNode;
  strength?: number;
  className?: string;
}

export function Magnetic({
  children,
  strength = 0.35,
  className,
}: MagneticProps) {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const canHover = useHoverCapable();

  const enabled = !reduce && canHover;
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const sx = useSpring(x, SPRING_MOUSE);
  const sy = useSpring(y, SPRING_MOUSE);

  const onMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = ref.current;
    if (!el || !enabled) return;
    const rect = el.getBoundingClientRect();
    x.set((e.clientX - rect.left - rect.width / 2) * strength);
    y.set((e.clientY - rect.top - rect.height / 2) * strength);
  };

  const onLeave = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <motion.div
      ref={ref}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      style={{ x: sx, y: sy }}
      className={cn("inline-block", className)}
    >
      {children}
    </motion.div>
  );
}

/* -------------------------------------------------------------------------- */
/* BUTTON BASE (components/motion/button/base.tsx)                            */
/* -------------------------------------------------------------------------- */

export type ButtonVariant = "primary" | "secondary" | "ghost" | "outline";
export type ButtonSize = "sm" | "md" | "lg" | "icon";

export interface ButtonProps extends Omit<
  HTMLMotionProps<"button">,
  "children"
> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  pressScale?: number;
  ripple?: boolean;
  children?: ReactNode;
}

export interface ButtonLinkProps extends Omit<
  HTMLMotionProps<"a">,
  "children"
> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  pressScale?: number;
  children?: ReactNode;
}

type Ripple = { id: number; x: number; y: number; size: number };

const VARIANT_CLASS: Record<ButtonVariant, string> = {
  primary: "bg-primary text-primary-foreground hover:bg-primary/90",
  secondary: "border border-border bg-card text-foreground hover:border-border",
  ghost: "text-muted-foreground hover:text-foreground hover:bg-muted/60",
  outline:
    "border border-border bg-transparent text-foreground hover:bg-muted/60",
};

const SIZE_CLASS: Record<ButtonSize, string> = {
  sm: "h-8 px-3 text-xs gap-1.5 rounded-full",
  md: "h-10 px-5 text-sm gap-2 rounded-full",
  lg: "h-12 px-6 text-base gap-2 rounded-full",
  icon: "h-8 w-8 rounded-lg",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  function Button(
    {
      variant = "primary",
      size = "md",
      pressScale = 0.93,
      ripple = false,
      className,
      children,
      onPointerDown,
      ...rest
    },
    ref,
  ) {
    const reduce = useReducedMotion();
    const canHover = useHoverCapable();
    const [ripples, setRipples] = useState<Ripple[]>([]);
    const nextId = useRef(0);

    const handlePointerDown = useCallback(
      (event: PointerEvent<HTMLButtonElement>) => {
        if (ripple && !reduce) {
          const rect = event.currentTarget.getBoundingClientRect();
          const rippleSize = Math.max(rect.width, rect.height) * 2;
          const id = nextId.current++;
          setRipples((prev) => [
            ...prev,
            {
              id,
              x: event.clientX - rect.left,
              y: event.clientY - rect.top,
              size: rippleSize,
            },
          ]);
        }
        onPointerDown?.(event);
      },
      [ripple, reduce, onPointerDown],
    );

    return (
      <motion.button
        ref={ref}
        type="button"
        whileTap={reduce ? undefined : { scale: pressScale }}
        whileHover={reduce || !canHover ? undefined : { scale: 1.02 }}
        transition={SPRING_PRESS}
        onPointerDown={handlePointerDown}
        className={cn(
          "inline-flex items-center justify-center font-medium select-none",
          "transition-colors",
          "disabled:pointer-events-none disabled:opacity-50",
          ripple && "relative overflow-hidden",
          VARIANT_CLASS[variant],
          SIZE_CLASS[size],
          className,
        )}
        {...rest}
      >
        {ripple && !reduce ? (
          <span className="pointer-events-none absolute inset-0 overflow-hidden rounded-[inherit]">
            <AnimatePresence>
              {ripples.map((r) => (
                <motion.span
                  key={r.id}
                  className="absolute rounded-full bg-current"
                  style={{
                    left: r.x,
                    top: r.y,
                    width: r.size,
                    height: r.size,
                    x: "-50%",
                    y: "-50%",
                  }}
                  initial={{ scale: 0.05, opacity: 0.3 }}
                  animate={{ scale: 1, opacity: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 1.6, ease: EASE_OUT }}
                  onAnimationComplete={() =>
                    setRipples((prev) => prev.filter((x) => x.id !== r.id))
                  }
                />
              ))}
            </AnimatePresence>
          </span>
        ) : null}
        {children}
      </motion.button>
    );
  },
);

export const ButtonLink = forwardRef<HTMLAnchorElement, ButtonLinkProps>(
  function ButtonLink(
    {
      variant = "primary",
      size = "md",
      pressScale = 0.93,
      className,
      children,
      ...rest
    },
    ref,
  ) {
    const reduce = useReducedMotion();
    const canHover = useHoverCapable();

    return (
      <motion.a
        ref={ref}
        whileTap={reduce ? undefined : { scale: pressScale }}
        whileHover={reduce || !canHover ? undefined : { scale: 1.02 }}
        transition={SPRING_PRESS}
        className={cn(
          "inline-flex items-center justify-center font-medium select-none",
          "transition-colors",
          VARIANT_CLASS[variant],
          SIZE_CLASS[size],
          className,
        )}
        {...rest}
      >
        {children}
      </motion.a>
    );
  },
);

/* -------------------------------------------------------------------------- */
/* MAGNETIC BUTTON (components/motion/button/magnetic.tsx)                    */
/* -------------------------------------------------------------------------- */

export interface MagneticButtonProps extends ButtonProps {
  strength?: number;
  magneticClassName?: string;
}

export const MagneticButton = forwardRef<
  HTMLButtonElement,
  MagneticButtonProps
>(function MagneticButton(
  { strength = 0.25, magneticClassName, children, ...rest },
  ref,
) {
  return (
    <Magnetic strength={strength} className={magneticClassName}>
      <Button ref={ref} {...rest}>
        {children}
      </Button>
    </Magnetic>
  );
});

/* -------------------------------------------------------------------------- */
/* METALLIC BUTTON (components/motion/button/metallic.tsx)                    */
/* -------------------------------------------------------------------------- */

export interface MetallicButtonProps extends Omit<
  ButtonProps,
  "ripple" | "variant"
> {
  paused?: boolean;
}

const SILVER_DRIFT = {
  duration: 8,
  ease: EASE_IN_OUT,
  repeat: Infinity,
};

const CHROME_SHIMMER = {
  duration: 2.4,
  ease: EASE_IN_OUT,
};

export const MetallicButton = forwardRef<
  HTMLButtonElement,
  MetallicButtonProps
>(function MetallicButton(
  {
    size = "md",
    paused = false,
    className,
    children,
    onHoverStart,
    onHoverEnd,
    ...rest
  },
  ref,
) {
  const reduce = useReducedMotion();
  const still = paused || Boolean(reduce);
  const [hovered, setHovered] = useState(false);

  return (
    <Button
      ref={ref}
      variant="ghost"
      size={size}
      onHoverStart={(event, info) => {
        setHovered(true);
        onHoverStart?.(event, info);
      }}
      onHoverEnd={(event, info) => {
        setHovered(false);
        onHoverEnd?.(event, info);
      }}
      className={cn(
        "group relative isolate overflow-hidden border-0 bg-transparent text-foreground",
        "hover:bg-transparent hover:text-foreground",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        "shadow-[0_8px_22px_rgba(0,0,0,0.16)]",
        size === "icon" && "rounded-full",
        className,
      )}
      {...rest}
    >
      <motion.span
        aria-hidden="true"
        className="pointer-events-none absolute inset-y-0 left-[-18%] z-0 w-[136%] rounded-[inherit] bg-[linear-gradient(105deg,#111_0%,#737373_14%,#fafafa_26%,#525252_38%,#0a0a0a_50%,#a3a3a3_64%,#fff_75%,#404040_87%,#111_100%)]"
        animate={still ? undefined : { x: ["0%", "13%", "0%"] }}
        transition={still ? undefined : SILVER_DRIFT}
      />

      <motion.span
        aria-hidden="true"
        className="pointer-events-none absolute inset-y-0 left-[-58%] z-[1] w-[52%] -skew-x-12 bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.5)_48%,transparent)] opacity-50 blur-[3px] mix-blend-screen"
        animate={still ? undefined : { x: hovered ? "310%" : "0%" }}
        transition={still ? undefined : CHROME_SHIMMER}
      />

      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-[2px] z-[2] rounded-[inherit] bg-background transition-colors group-hover:bg-muted/40"
      />

      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-[2px] z-[3] rounded-[inherit] shadow-[inset_0_1px_0_rgba(255,255,255,0.28),inset_0_-1px_0_rgba(0,0,0,0.16)]"
      />

      <span className="relative z-10 inline-flex items-center justify-center gap-2">
        {children}
      </span>
    </Button>
  );
});

/* -------------------------------------------------------------------------- */
/* STATEFUL BUTTON (components/motion/button/stateful.tsx)                    */
/* -------------------------------------------------------------------------- */

export type ButtonState = "idle" | "loading" | "success" | "error";

export interface StatefulButtonProps extends Omit<ButtonProps, "children"> {
  state?: ButtonState;
  children: ReactNode;
  loadingText?: ReactNode;
  successText?: ReactNode;
  errorText?: ReactNode;
  icon?: ReactNode;
}

const ROLL_BLUR = "blur(6px)";

const ICON_VARIANTS: Variants = {
  initial: { opacity: 0, width: 0, scale: 0.7, filter: ROLL_BLUR },
  animate: {
    opacity: 1,
    width: "1.5rem",
    scale: 1,
    filter: "blur(0px)",
    transition: SPRING_SWAP,
  },
  exit: {
    opacity: 0,
    width: 0,
    scale: 0.7,
    filter: ROLL_BLUR,
    transition: { duration: 0.16, ease: EASE_OUT },
  },
};

function IconSlot({ keyId, children }: { keyId: string; children: ReactNode }) {
  const reduce = useReducedMotion();
  return (
    <motion.span
      key={keyId}
      variants={ICON_VARIANTS}
      initial={reduce ? { opacity: 0 } : "initial"}
      animate={reduce ? { opacity: 1 } : "animate"}
      exit={reduce ? { opacity: 0 } : "exit"}
      transition={reduce ? { duration: 0.15 } : undefined}
      className="inline-grid shrink-0 place-items-center"
    >
      {children}
    </motion.span>
  );
}

export const StatefulButton = forwardRef<
  HTMLButtonElement,
  StatefulButtonProps
>(function StatefulButton(
  {
    state = "idle",
    loadingText,
    successText,
    errorText,
    icon,
    children,
    ...rest
  },
  ref,
) {
  return (
    <Button ref={ref} {...rest}>
      <AnimatePresence mode="popLayout" initial={false}>
        {state === "loading" ? (
          <IconSlot keyId="loading">
            <Loader2 className="h-4 w-4 animate-spin" />
          </IconSlot>
        ) : state === "success" ? (
          <IconSlot keyId="success">
            <Check className="h-4 w-4" />
          </IconSlot>
        ) : state === "error" ? (
          <IconSlot keyId="error">
            <X className="h-4 w-4" />
          </IconSlot>
        ) : icon ? (
          <IconSlot keyId="icon">{icon}</IconSlot>
        ) : null}
      </AnimatePresence>

      <AnimatePresence mode="wait" initial={false}>
        <motion.span
          key={state}
          initial={{ opacity: 0, y: 10, filter: ROLL_BLUR }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          exit={{ opacity: 0, y: -10, filter: ROLL_BLUR }}
          transition={SPRING_SWAP}
          className="flex items-center"
        >
          {state === "loading" && loadingText
            ? loadingText
            : state === "success" && successText
              ? successText
              : state === "error" && errorText
                ? errorText
                : children}
        </motion.span>
      </AnimatePresence>
    </Button>
  );
});

/* -------------------------------------------------------------------------- */
/* FEEDBACK WIDGET (components/motion/feedback-widget.tsx)                    */
/* -------------------------------------------------------------------------- */

type Status = "idle" | "open" | "sending" | "sent" | "error";

const SUCCESS_DURATION_MS = 1600;

const MORPH_OPEN_EASE = [0.34, 1.25, 0.64, 1] as const;
const MORPH_CLOSE_EASE = [0.22, 1, 0.36, 1] as const;
const MORPH_OPEN_DURATION = 0.4;
const MORPH_CLOSE_DURATION = 0.28;
const MORPH_FADE_DURATION = 0.22;
const MORPH_SLIDE = 40;
const MORPH_SCALE = 0.97;
const MORPH_BLUR = "blur(2px)";

const SPRINKLES = Array.from({ length: 8 }, (_, i) => {
  const angle = (i / 8) * Math.PI * 2;
  return {
    x: Math.cos(angle) * 26,
    y: Math.sin(angle) * 26,
    color: i % 2 === 0 ? "var(--color-success)" : "var(--accent)",
  };
});

export interface FeedbackData {
  message: string;
}

export interface FeedbackWidgetProps {
  onSubmit?: (data: FeedbackData) => void | Promise<void>;
  position?: "bottom-right" | "bottom-left";
  title?: string;
  placeholder?: string;
  icon?: ReactNode;
  className?: string;
}

export function FeedbackWidget({
  onSubmit,
  position = "bottom-right",
  title = "Help us improve",
  placeholder = "Share an idea or report a bug",
  icon,
  className,
}: FeedbackWidgetProps) {
  const reduce = useReducedMotion();
  const rootRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState("");

  const open = status !== "idle";
  const busy = status === "sending";

  const clearCloseTimer = useCallback(() => {
    if (closeTimerRef.current === null) return;
    clearTimeout(closeTimerRef.current);
    closeTimerRef.current = null;
  }, []);

  const close = useCallback(() => {
    clearCloseTimer();
    setStatus("idle");
    setMessage("");
  }, [clearCloseTimer]);

  useEffect(
    () => () => {
      if (closeTimerRef.current !== null) {
        clearTimeout(closeTimerRef.current);
      }
    },
    [],
  );

  useEffect(() => {
    if (status !== "open") return;
    const timer = window.setTimeout(
      () => textareaRef.current?.focus(),
      reduce ? 0 : MORPH_OPEN_DURATION * 1000,
    );
    return () => window.clearTimeout(timer);
  }, [status, reduce]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !busy) close();
    };
    const onPointer = (e: globalThis.PointerEvent) => {
      if (
        !busy &&
        rootRef.current &&
        !rootRef.current.contains(e.target as Node)
      ) {
        close();
      }
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("pointerdown", onPointer);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("pointerdown", onPointer);
    };
  }, [open, busy, close]);

  const scheduleSuccessClose = () => {
    clearCloseTimer();
    closeTimerRef.current = setTimeout(close, SUCCESS_DURATION_MS);
  };

  const submit = async () => {
    if (busy || message.trim().length === 0) return;
    setStatus("sending");
    try {
      if (onSubmit) {
        await onSubmit({ message });
      } else {
        const res = await fetch("/api/feedback", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message }),
        });

        if (!res.ok) throw new Error("Failed to submit feedback");
      }
      setStatus("sent");
      scheduleSuccessClose();
    } catch {
      setStatus("error");
    }
  };

  const left = position === "bottom-left";
  const contentOffset = left ? -MORPH_SLIDE : MORPH_SLIDE;

  const surfaceTransition = reduce
    ? { duration: 0 }
    : {
        layout: {
          duration: open ? MORPH_OPEN_DURATION : MORPH_CLOSE_DURATION,
          ease: open ? MORPH_OPEN_EASE : MORPH_CLOSE_EASE,
        },
        borderRadius: {
          duration: open ? MORPH_OPEN_DURATION : MORPH_CLOSE_DURATION,
          ease: open ? MORPH_OPEN_EASE : MORPH_CLOSE_EASE,
        },
      };

  const contentTransition = reduce
    ? { duration: 0 }
    : {
        opacity: { duration: MORPH_FADE_DURATION, ease: MORPH_CLOSE_EASE },
        x: { duration: MORPH_OPEN_DURATION, ease: MORPH_CLOSE_EASE },
        scale: { duration: MORPH_OPEN_DURATION, ease: MORPH_CLOSE_EASE },
        filter: { duration: MORPH_FADE_DURATION, ease: MORPH_CLOSE_EASE },
        rotate: { duration: MORPH_OPEN_DURATION, ease: MORPH_CLOSE_EASE },
      };

  const viewInitial = reduce
    ? { opacity: 0 }
    : { opacity: 0, y: 8, filter: "blur(4px)" };

  const viewAnimate = reduce
    ? { opacity: 1, transition: { duration: 0.18, ease: EASE_OUT } }
    : {
        opacity: 1,
        y: 0,
        filter: "blur(0px)",
        transition: { duration: 0.24, ease: EASE_OUT },
      };

  const viewExit = reduce
    ? { opacity: 0, transition: { duration: 0.14, ease: EASE_OUT } }
    : {
        opacity: 0,
        y: -8,
        filter: "blur(4px)",
        transition: { duration: 0.16, ease: EASE_OUT },
      };

  return (
    <div
      ref={rootRef}
      className={cn(
        "pointer-events-none fixed bottom-4 z-50",
        left ? "left-4" : "right-4",
        className,
      )}
    >
      <motion.div
        layout
        animate={{ borderRadius: open ? 20 : 40 }}
        transition={surfaceTransition}
        style={{ transformOrigin: left ? "bottom left" : "bottom right" }}
        className={cn(
          "pointer-events-auto absolute bottom-0 overflow-hidden border border-border bg-background text-foreground shadow-lg",
          open ? "w-[min(86vw,320px)] p-2" : "h-12 w-12 p-0",
          left ? "left-0" : "right-0",
        )}
      >
        <AnimatePresence initial={false} mode="popLayout">
          {open ? (
            <motion.div
              key="panel"
              initial={
                reduce
                  ? { opacity: 0 }
                  : {
                      opacity: 0,
                      x: contentOffset,
                      scale: MORPH_SCALE,
                      filter: MORPH_BLUR,
                    }
              }
              animate={{ opacity: 1, x: 0, scale: 1, filter: "blur(0px)" }}
              exit={
                reduce
                  ? { opacity: 0 }
                  : {
                      opacity: 0,
                      x: contentOffset,
                      scale: MORPH_SCALE,
                      filter: MORPH_BLUR,
                    }
              }
              transition={contentTransition}
            >
              <motion.div layout="position">
                <AnimatePresence mode="popLayout" initial={false} propagate>
                  {status === "sent" ? (
                    <motion.div
                      key="sent"
                      initial={viewInitial}
                      animate={viewAnimate}
                      exit={viewExit}
                    >
                      <div className="flex flex-col items-center justify-center gap-1.5 rounded-[20px] bg-border/60 px-4 py-6 text-center">
                        <div className="relative mb-1 flex h-12 w-12 items-center justify-center">
                          {reduce
                            ? null
                            : SPRINKLES.map((s, i) => (
                                <motion.span
                                  key={`${s.x}-${s.y}`}
                                  initial={{
                                    opacity: 0,
                                    scale: 0.4,
                                    x: 0,
                                    y: 0,
                                  }}
                                  animate={{
                                    opacity: [0, 1, 0],
                                    scale: [0, 1, 0.4],
                                    x: s.x,
                                    y: s.y,
                                  }}
                                  transition={{
                                    duration: 0.6,
                                    delay: 0.18 + i * 0.02,
                                    ease: "easeOut",
                                  }}
                                  style={{ backgroundColor: s.color }}
                                  className="absolute h-1.5 w-1.5 rounded-full"
                                />
                              ))}
                          <motion.div
                            initial={reduce ? { scale: 1 } : { scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{
                              type: "spring",
                              stiffness: 500,
                              damping: 22,
                              delay: 0.04,
                            }}
                            className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--color-success)]"
                          >
                            <motion.svg
                              viewBox="0 0 24 24"
                              fill="none"
                              className="h-5 w-5 text-white"
                            >
                              <motion.path
                                d="M5 12.5l4.5 4.5L19 7.5"
                                stroke="currentColor"
                                strokeWidth={2.5}
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                initial={
                                  reduce ? { pathLength: 1 } : { pathLength: 0 }
                                }
                                animate={{ pathLength: 1 }}
                                transition={{
                                  duration: 0.35,
                                  ease: "easeOut",
                                  delay: 0.15,
                                }}
                              />
                            </motion.svg>
                          </motion.div>
                        </div>
                        <h3 className="text-sm font-semibold text-foreground">
                          Thanks!
                        </h3>
                        <p className="text-xs leading-relaxed text-muted-foreground">
                          Your feedback helps us build something better.
                        </p>
                      </div>
                    </motion.div>
                  ) : status === "error" ? (
                    <motion.div
                      key="error"
                      initial={viewInitial}
                      animate={viewAnimate}
                      exit={viewExit}
                    >
                      <div
                        role="alert"
                        className="rounded-[20px] bg-border/60 px-4 py-5 text-center"
                      >
                        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
                          <AlertCircle className="h-5 w-5" />
                        </div>
                        <h3 className="mt-3 text-sm font-semibold text-foreground">
                          Something went wrong
                        </h3>
                        <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                          We couldn&apos;t send your feedback. Please try again.
                        </p>
                        <Button size="sm" onClick={submit} className="mt-4">
                          Try again
                        </Button>
                      </div>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="form"
                      initial={viewInitial}
                      animate={viewAnimate}
                      exit={viewExit}
                    >
                      <div className="min-h-[150px] rounded-[20px] bg-border/60 px-4 py-3.5">
                        <div className="flex items-start justify-between gap-3">
                          <h3 className="text-sm font-semibold text-foreground">
                            {title}
                          </h3>
                          <button
                            type="button"
                            onClick={close}
                            aria-label="Close"
                            className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-foreground/[0.07] text-muted-foreground transition-colors hover:text-foreground"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                        <textarea
                          ref={textareaRef}
                          value={message}
                          onChange={(e) => setMessage(e.target.value)}
                          placeholder={placeholder}
                          disabled={busy}
                          rows={3}
                          className="mt-2 w-full resize-none bg-transparent text-base text-foreground outline-none placeholder:text-muted-foreground/60 md:text-sm"
                        />
                      </div>

                      <div className="flex items-center gap-2 px-1 pt-2 pb-1">
                        <Button
                          variant="secondary"
                          size="md"
                          onClick={close}
                          disabled={busy}
                          className="flex-1 bg-border text-muted-foreground hover:text-foreground"
                        >
                          Cancel
                        </Button>
                        <StatefulButton
                          state={busy ? "loading" : "idle"}
                          loadingText="Sending"
                          size="md"
                          onClick={submit}
                          disabled={busy || message.trim().length === 0}
                          className="flex-1 bg-foreground text-background hover:bg-foreground/90"
                        >
                          Submit
                        </StatefulButton>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            </motion.div>
          ) : (
            <motion.button
              key="trigger"
              type="button"
              initial={
                reduce
                  ? { opacity: 0 }
                  : { opacity: 0, x: -contentOffset, filter: MORPH_BLUR }
              }
              animate={{ opacity: 1, x: 0, filter: "blur(0px)" }}
              exit={
                reduce
                  ? { opacity: 0 }
                  : { opacity: 0, x: -contentOffset, filter: MORPH_BLUR }
              }
              transition={contentTransition}
              onClick={() => {
                clearCloseTimer();
                setStatus("open");
              }}
              aria-label={title}
              aria-haspopup="dialog"
              whileTap={reduce ? undefined : { scale: 0.92 }}
              className={cn(
                "absolute bottom-0 flex h-12 w-12 items-center justify-center bg-transparent text-foreground",
                left ? "left-0" : "right-0",
              )}
            >
              <motion.span
                initial={reduce ? false : { rotate: 45, scale: MORPH_SCALE }}
                animate={{ rotate: 0, scale: 1 }}
                exit={{ rotate: 45, scale: MORPH_SCALE }}
                transition={contentTransition}
                className="grid h-5 w-5 shrink-0 place-items-center [&>svg]:h-full [&>svg]:w-full"
              >
                {icon ?? <MessageCircle className="h-5 w-5" />}
              </motion.span>
            </motion.button>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
