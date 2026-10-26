"use client";

import { OTPInputContext, REGEXP_ONLY_DIGITS } from "input-otp";
import {
  CircleAlert,
  Eye,
  EyeOff,
  LoaderCircle,
  LockKeyhole,
} from "lucide-react";
import {
  SetStateAction,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { InputOTP, InputOTPGroup } from "@/components/ui/input-otp";
import { cn } from "@/lib/utils";

const PIN_LENGTH = 6;

/* -------------------------------------------------------------------------- */
/* Masked slot                                                                */
/* -------------------------------------------------------------------------- */

// shadcn's InputOTPSlot always prints the real character, and `type="password"`
// on the hidden input does not change that. This slot reads the same context
// but can draw a dot instead, so the PIN isn't readable over someone's shoulder.
function PinSlot({
  index,
  masked,
  invalid,
}: {
  index: number;
  masked: boolean;
  invalid: boolean;
}) {
  const context = useContext(OTPInputContext);
  const { char, hasFakeCaret, isActive } = context.slots[index] ?? {};

  return (
    <div
      data-active={isActive}
      aria-invalid={invalid || undefined}
      className={cn(
        "relative flex size-11 items-center justify-center border-y border-r border-input bg-background text-lg font-semibold shadow-xs transition-all sm:size-12 sm:text-xl",
        "first:rounded-l-md first:border-l last:rounded-r-md",
        "data-[active=true]:z-10 data-[active=true]:border-ring data-[active=true]:ring-[3px] data-[active=true]:ring-ring/50",
        "aria-invalid:border-destructive data-[active=true]:aria-invalid:ring-destructive/30",
      )}
    >
      {char ? (
        masked ? (
          <span
            aria-hidden="true"
            className="size-2.5 rounded-full bg-foreground"
          />
        ) : (
          char
        )
      ) : null}
      {hasFakeCaret && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="h-5 w-px animate-caret-blink bg-foreground duration-1000" />
        </div>
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Component                                                                  */
/* -------------------------------------------------------------------------- */

export interface PinInputProps {
  /**
   * Try the PIN against the PDF. Resolve `true` if it unlocked the file and
   * `false` if the PIN was wrong. A thrown error is shown as a generic failure.
   * The PIN is never stored here; pass it straight to the parser and drop it.
   */
  onSubmit: (pin: string) => Promise<boolean> | boolean;
  /** Called when the user wants to pick a different file instead. */
  onCancel?: () => void;
  /** Name of the locked file, shown for context. */
  fileName?: string;
  disabled?: boolean;
  className?: string;
}

export default function PinInput({
  onSubmit,
  onCancel,
  fileName,
  disabled = false,
  className,
}: PinInputProps) {
  const [value, setValue] = useState("");
  const [masked, setMasked] = useState(true);
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);
  const busy = useRef(false); // guards against double submits (auto-submit + button)

  // Focus on mount so the user can type straight away.
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Leave nothing behind: wipe the PIN from state when the component goes away.
  useEffect(() => () => setValue(""), []);

  const submit = useCallback(
    async (pin: string) => {
      if (busy.current || pin.length !== PIN_LENGTH) return;
      busy.current = true;
      setVerifying(true);
      setError(null);

      try {
        const ok = await onSubmit(pin);
        if (!ok) {
          setError(
            "That PIN didn't unlock the statement. Check it and try again.",
          );
          setValue("");
        }
        // On success the parent swaps this component out, which clears the PIN.
      } catch {
        setError(
          "Something went wrong while unlocking the file. Please try again.",
        );
        setValue("");
      } finally {
        busy.current = false;
        setVerifying(false);
        // Refocus after the input is re-enabled so a retry needs no extra tap.
        requestAnimationFrame(() => inputRef.current?.focus());
      }
    },
    [onSubmit],
  );

  const locked = disabled || verifying;

  return (
    <div
      className={cn(
        "w-full space-y-5 rounded-2xl border bg-card p-5 text-card-foreground sm:p-6",
        className,
      )}
    >
      <div className="space-y-3 text-center">
        <span
          aria-hidden="true"
          className="mx-auto flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary"
        >
          <LockKeyhole className="size-5" />
        </span>
        <div className="space-y-1">
          <h2 className="text-lg font-semibold tracking-tight sm:text-xl">
            Your statement is locked
          </h2>
          <p className="text-sm text-muted-foreground">
            Enter the 6-digit PIN Safaricom sent you with the statement.
          </p>
          {fileName && (
            <p
              className="truncate text-xs text-muted-foreground"
              title={fileName}
            >
              {fileName}
            </p>
          )}
        </div>
      </div>

      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          void submit(value);
        }}
      >
        <div className="flex justify-center">
          <InputOTP
            ref={inputRef}
            maxLength={PIN_LENGTH}
            value={value}
            onChange={(next: SetStateAction<string>) => {
              setValue(next);
              if (error) setError(null);
            }}
            onComplete={(pin: string) => void submit(pin)}
            // Digits only: typed characters AND pasted text are filtered.
            pattern={REGEXP_ONLY_DIGITS}
            inputMode="numeric"
            // Keep browsers and password managers from remembering or suggesting it.
            autoComplete="off"
            data-1p-ignore
            data-lpignore="true"
            spellCheck={false}
            disabled={locked}
            aria-label="6-digit statement PIN"
            aria-invalid={!!error}
            containerClassName="has-disabled:opacity-60"
          >
            <InputOTPGroup>
              {Array.from({ length: PIN_LENGTH }, (_, i) => (
                <PinSlot key={i} index={i} masked={masked} invalid={!!error} />
              ))}
            </InputOTPGroup>
          </InputOTP>
        </div>

        <div className="flex justify-center">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => {
              setMasked((m) => !m);
              inputRef.current?.focus();
            }}
            aria-pressed={!masked}
            className="text-muted-foreground"
          >
            {masked ? (
              <Eye className="size-4" />
            ) : (
              <EyeOff className="size-4" />
            )}
            {masked ? "Show PIN" : "Hide PIN"}
          </Button>
        </div>

        {error && (
          <Alert variant="destructive" role="alert">
            <CircleAlert className="size-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="flex flex-col gap-2">
          <Button
            type="submit"
            size="lg"
            className="w-full"
            disabled={locked || value.length !== PIN_LENGTH}
          >
            {verifying ? (
              <>
                <LoaderCircle className="size-4 animate-spin" />
                Unlocking…
              </>
            ) : (
              "Unlock statement"
            )}
          </Button>
          {onCancel && (
            <Button
              type="button"
              variant="ghost"
              className="w-full"
              onClick={onCancel}
              disabled={verifying}
            >
              Choose a different file
            </Button>
          )}
        </div>
      </form>

      <p className="text-center text-xs text-muted-foreground">
        Your PIN is used on this device to open the file. It is never sent or
        saved.
      </p>
    </div>
  );
}
