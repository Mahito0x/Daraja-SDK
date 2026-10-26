"use client";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { AnimatePresence, motion } from "framer-motion";
import { Angry, Check, Frown, Laugh, Loader2, Smile } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

const MOOD_RATINGS = [
  { score: 4, icon: Laugh, activeStyle: "text-emerald-500 bg-emerald-500/10" },
  { score: 3, icon: Smile, activeStyle: "text-emerald-400 bg-emerald-400/10" },
  { score: 2, icon: Frown, activeStyle: "text-amber-400 bg-amber-400/10" },
  { score: 1, icon: Angry, activeStyle: "text-rose-500 bg-rose-500/10" },
];

interface FooterFeedbackProps {
  onSubmit?: (data: {
    rating: number;
    comment: string;
  }) => Promise<void> | void;
}

export const FooterFeedback = ({ onSubmit }: FooterFeedbackProps) => {
  const [rating, setRating] = useState<number | null>(null);
  const [comment, setComment] = useState("");
  const [status, setStatus] = useState<"idle" | "submitting" | "success">(
    "idle",
  );
  const [validationError, setValidationError] = useState(false);

  const rootRef = useRef<HTMLDivElement>(null);
  const [isDesktop, setIsDesktop] = useState(false);

  // Only apply the fixed 320px open width on sm+ screens
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 640px)");
    const update = () => setIsDesktop(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  // After opening, make sure the whole panel is visible (mobile footer is at the page bottom)
  useEffect(() => {
    if (rating === null) return;
    const t = setTimeout(
      () =>
        rootRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "nearest",
        }),
      350,
    );
    return () => clearTimeout(t);
  }, [rating]);

  // Auto-reset success state after submission
  useEffect(() => {
    if (status === "success") {
      const resetTimer = setTimeout(() => {
        setRating(null);
        setStatus("idle");
        setComment("");
      }, 2000);
      return () => clearTimeout(resetTimer);
    }
  }, [status]);

  const wordCount = useMemo(() => {
    return comment.trim()
      ? comment.trim().split(/\s+/).filter(Boolean).length
      : 0;
  }, [comment]);

  const handleSend = async () => {
    if (wordCount < 3 || rating === null) {
      setValidationError(true);
      return;
    }

    setValidationError(false);
    setStatus("submitting");

    try {
      if (onSubmit) {
        await onSubmit({ rating, comment });
      } else {
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
      setStatus("success");
    } catch (err) {
      console.error("Feedback submission error:", err);
      setStatus("idle");
    }
  };

  return (
    <motion.div
      ref={rootRef}
      layout
      initial={{ borderRadius: "2rem", width: "auto" }}
      animate={{
        borderRadius: rating !== null ? "0.75rem" : "2rem",
        width: rating !== null && isDesktop ? "320px" : "auto",
      }}
      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
      className={cn(
        "overflow-hidden border border-border/60 bg-card/90 py-2.5 shadow-lg backdrop-blur-xl transition-colors",
      )}
    >
      <div className="flex items-center justify-between gap-3 px-4 py-1">
        <span className="text-xs font-medium text-muted-foreground whitespace-nowrap">
          Enjoying this service?
        </span>
        <div className="flex items-center gap-1">
          {MOOD_RATINGS.map((item) => {
            const IconComponent = item.icon;
            const isSelected = rating === item.score;
            return (
              <motion.button
                key={item.score}
                type="button"
                whileHover={{ scale: 1.15 }}
                whileTap={{ scale: 0.85 }}
                onClick={() => {
                  if (isSelected) {
                    setRating(null);
                    setComment("");
                    setValidationError(false);
                  } else {
                    setRating(item.score);
                  }
                }}
                className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-full transition-all",
                  isSelected
                    ? item.activeStyle
                    : "text-muted-foreground/70 hover:text-foreground hover:bg-muted/50",
                )}
                aria-label={`Rating score ${item.score}`}
              >
                <IconComponent size={18} />
              </motion.button>
            );
          })}
        </div>
      </div>

      <motion.div
        aria-hidden={rating === null}
        initial={{ height: 0, opacity: 0 }}
        animate={
          rating !== null
            ? {
                height: "auto",
                opacity: 1,
                paddingBottom: "10px",
                paddingTop: "8px",
              }
            : { height: 0, opacity: 0, paddingBottom: "0px", paddingTop: "0px" }
        }
        transition={{ ease: [0.22, 1, 0.36, 1], duration: 0.3 }}
        className="px-3 overflow-hidden"
      >
        <AnimatePresence mode="wait">
          {status !== "success" ? (
            <motion.div
              key="feedback-form"
              exit={{ opacity: 0 }}
              initial={{ opacity: 1 }}
              className="space-y-2"
            >
              <Textarea
                value={comment}
                onChange={(e) => {
                  setComment(e.target.value);
                  if (
                    validationError &&
                    e.target.value.trim().split(/\s+/).filter(Boolean).length >=
                      3
                  ) {
                    setValidationError(false);
                  }
                }}
                placeholder="Tell us what you love or what we can improve..."
                className={cn(
                  "min-h-[85px] w-full resize-none text-xs bg-background/50 border-border/60 focus-visible:ring-1 focus-visible:ring-ring",
                  validationError &&
                    "border-rose-500 focus-visible:ring-rose-500",
                )}
              />
              <div className="flex items-center justify-between pt-0.5">
                <span
                  className={cn(
                    "text-[10px]",
                    wordCount < 3
                      ? "text-muted-foreground"
                      : "text-emerald-500 font-medium",
                  )}
                >
                  {wordCount}/3 words minimum
                </span>
                <Button
                  type="button"
                  size="sm"
                  onClick={handleSend}
                  disabled={status === "submitting"}
                  className="h-8 text-xs px-4"
                >
                  {status === "submitting" ? (
                    <>
                      <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    "Submit"
                  )}
                </Button>
              </div>
              {validationError && (
                <p className="text-[10px] text-rose-500 font-medium text-right -mt-1">
                  Please enter at least 3 words.
                </p>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="success-message"
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex w-full flex-col items-center justify-center gap-1.5 py-4 text-center text-xs"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-500">
                <Check strokeWidth={2.5} size={16} />
              </div>
              <div className="font-medium text-foreground">
                Your feedback has been received!
              </div>
              <div className="text-muted-foreground text-[11px]">
                Thank you for your help.
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
};
