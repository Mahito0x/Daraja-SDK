"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { CheckIcon, CopyIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface CopyButtonProps {
  text: string;
  className?: string;
}

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
    <Button
      variant="ghost"
      size="icon"
      aria-label={copied ? "Copied to clipboard" : "Copy code"}
      className={cn(
        "h-7 w-7 p-0 relative disabled:opacity-100 cursor-pointer shrink-0 overflow-hidden rounded-md transition-transform duration-150 hover:scale-[1.08] active:scale-[0.92]",
        className,
      )}
      onClick={handleCopy}
      disabled={copied}
    >
      <span className="inline-flex items-center justify-center text-teal-400 transition-opacity duration-150">
        {copied ? (
          <CheckIcon className="size-4 stroke-teal-400" />
        ) : (
          <CopyIcon className="size-4 text-neutral-400 transition-colors duration-150 hover:text-neutral-100" />
        )}
      </span>
    </Button>
  );
}
