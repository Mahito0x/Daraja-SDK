"use client";

import { Eraser, EyeOff, SearchCheck, ShieldCheck } from "lucide-react";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";

const STORAGE_KEY = "safi:privacy-acknowledged";

const points = [
  {
    icon: EyeOff,
    title: "Read on your device",
    body: "Your statement is opened and analysed right here in your browser. It is never uploaded.",
  },
  {
    icon: Eraser,
    title: "Nothing is kept",
    body: "Everything lives in memory and disappears when you refresh, leave, or reset.",
  },
  {
    icon: SearchCheck,
    title: "Don't just trust us, check",
    body: "Open your browser's Network tab while you upload. You'll see nothing leave.",
  },
];

export default function PrivacyDialog() {
  const [open, setOpen] = useState(false);

  // Client-only check: no hydration mismatch, no flash for returning users.
  useEffect(() => {
    try {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (localStorage.getItem(STORAGE_KEY) !== "true") setOpen(true);
    } catch {
      // Storage blocked (private mode etc.): show it every visit.
      setOpen(true);
    }
  }, []);

  const acknowledge = () => {
    try {
      localStorage.setItem(STORAGE_KEY, "true");
    } catch {
      /* ignore */
    }
    setOpen(false);
  };

  return (
    // Acknowledgement is required: Esc, outside click and the X are all disabled,
    // so the only way forward is the button. Closing never persists anything.
    <Dialog open={open}>
      <DialogContent className="flex max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] flex-col gap-0 overflow-hidden p-0 sm:max-w-md [&>button]:hidden">
        <DialogHeader className="gap-3 px-5 pb-4 pt-5 text-center sm:px-6 sm:pt-6">
          <div className="mx-auto flex size-11 items-center justify-center rounded-full bg-primary/10 text-primary">
            <ShieldCheck className="size-5" aria-hidden="true" />
          </div>
          <div className="space-y-1.5 text-center">
            <DialogTitle className="text-xl font-semibold tracking-tight sm:text-2xl">
              Your money is your business.
            </DialogTitle>
            <DialogDescription className="text-sm leading-relaxed">
              Your statement is personal. Here is exactly how we treat it.
            </DialogDescription>
          </div>
        </DialogHeader>

        <Separator />

        {/* Only scrolls on very short screens, so the button never leaves view */}
        <ul className="flex-1 space-y-4 overflow-y-auto px-5 py-4 sm:px-6">
          {points.map(({ icon: Icon, title, body }) => (
            <li key={title} className="flex gap-3">
              <div className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-md bg-muted text-foreground">
                <Icon className="size-4" aria-hidden="true" />
              </div>
              <div className="space-y-0.5">
                <p className="text-sm font-medium leading-tight">{title}</p>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {body}
                </p>
              </div>
            </li>
          ))}
        </ul>

        <Separator />

        <DialogFooter className="flex-col gap-3 px-5 pb-5 pt-4 sm:flex-col sm:space-x-0 sm:px-6 sm:pb-6">
          <Button onClick={acknowledge} size="lg" className="w-full">
            Got it, let&apos;s go
          </Button>
          <p className="text-center text-xs text-muted-foreground">
            No account. No selling. No sharing.
          </p>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
