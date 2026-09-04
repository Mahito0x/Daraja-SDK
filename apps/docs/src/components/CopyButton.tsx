"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { CheckIcon, CopyIcon } from "lucide-react";
import { motion, AnimatePresence, type Variants } from "motion/react";
import { cn } from "@/lib/utils";

interface CopyButtonProps {
  text: string;
  className?: string;
}

const MotionButton = motion.create(Button);
const MotionCopyIcon = motion.create(CopyIcon);
const MotionCheckIcon = motion.create(CheckIcon);

const copyIconVariants: Variants = {
  initial: { rotate: 0, scale: 1 },
  hover: {
    scale: 1.12,
    transition: { duration: 0.2, ease: "easeOut" },
  },
};

const checkIconVariants: Variants = {
  initial: { scale: 0, rotate: -30 },
  animate: {
    scale: [0, 1.3, 0.95, 1],
    rotate: 0,
    transition: { duration: 0.4, ease: "easeOut" },
  },
};

export function CopyButton({ text, className }: CopyButtonProps) {
  const [copied, setCopied] = useState<boolean>(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch (err) {
      console.error("Failed to copy text: ", err);
    }
  };

  return (
    <MotionButton
      variant="ghost"
      size="icon"
      layout
      aria-label={copied ? "Copied to clipboard" : "Copy code"}
      className={cn(
        "h-7 w-7 p-0 relative disabled:opacity-100 cursor-pointer shrink-0 overflow-hidden rounded-md",
        className,
      )}
      onClick={handleCopy}
      disabled={copied}
      whileHover="hover"
      whileTap="tap"
      variants={{
        hover: { scale: 1.08 },
        tap: { scale: 0.92 },
      }}
      transition={{ type: "spring", stiffness: 420, damping: 24 }}
    >
      <AnimatePresence mode="wait" initial={false}>
        {copied ? (
          <motion.span
            key="copied"
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.15 }}
            className="inline-flex items-center justify-center text-teal-400"
          >
            <MotionCheckIcon
              className="size-4 stroke-teal-400"
              variants={checkIconVariants}
              initial="initial"
              animate="animate"
            />
          </motion.span>
        ) : (
          <motion.span
            key="copy"
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            transition={{ duration: 0.15 }}
            className="inline-flex items-center justify-center"
          >
            <MotionCopyIcon
              className="size-4 text-neutral-400 hover:text-neutral-100"
              variants={copyIconVariants}
              initial="initial"
            />
          </motion.span>
        )}
      </AnimatePresence>
    </MotionButton>
  );
}
