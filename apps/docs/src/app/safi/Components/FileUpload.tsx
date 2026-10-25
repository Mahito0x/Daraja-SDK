"use client";

import {
  CircleAlert,
  FileText,
  LoaderCircle,
  ShieldCheck,
  Upload,
  X,
} from "lucide-react";
import { useCallback, useEffect, useId, useRef, useState } from "react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/* -------------------------------------------------------------------------- */
/* Limits & validation                                                        */
/* -------------------------------------------------------------------------- */

const MAX_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB, a statement is usually well under 1 MB
const MIN_SIZE_BYTES = 1024; // anything smaller than 1 KB is not a real statement

// Names that mean a PDF can run code, launch programs, carry hidden files or
// phone home. A bank/M-Pesa statement never needs any of them.
// The lookahead stops "/JS" from matching "/JSON" and similar.
const ACTIVE_CONTENT =
  /\/(JavaScript|JS|Launch|EmbeddedFile|RichMedia|SubmitForm|ImportData)(?![A-Za-z0-9])/;

type Validation = { ok: true } | { ok: false; title: string; message: string };

const reject = (title: string, message: string): Validation => ({
  ok: false,
  title,
  message,
});

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * Defence in depth, all in the browser, nothing leaves the device:
 * 1. extension + declared MIME type
 * 2. size window
 * 3. real content check (magic bytes), so a renamed .exe/.html is caught
 * 4. completeness check (%%EOF), so truncated/corrupt files are caught
 * 5. scan for active-content markers (JavaScript, Launch, embedded files...)
 */
async function validatePdf(file: File): Promise<Validation> {
  if (!/\.pdf$/i.test(file.name)) {
    return reject("Wrong file type", "Only PDF files are accepted.");
  }
  // Some browsers leave type empty; a non-empty wrong type is a hard no.
  if (file.type && file.type !== "application/pdf") {
    return reject("Wrong file type", "That file isn't a PDF.");
  }
  if (file.size < MIN_SIZE_BYTES) {
    return reject("File too small", "This doesn't look like a real statement.");
  }
  if (file.size > MAX_SIZE_BYTES) {
    return reject(
      "File too large",
      `Statements are under ${formatBytes(MAX_SIZE_BYTES)}. This one is ${formatBytes(file.size)}.`,
    );
  }

  let bytes: Uint8Array;
  try {
    bytes = new Uint8Array(await file.arrayBuffer());
  } catch {
    return reject("Couldn't read file", "Please try selecting it again.");
  }

  const latin1 = new TextDecoder("iso-8859-1");

  // A PDF must begin with %PDF-1.x or %PDF-2.x. Anything else is disguised.
  const head = latin1.decode(bytes.subarray(0, 8));
  if (!/^%PDF-[12]\.\d/.test(head)) {
    return reject(
      "Not a real PDF",
      "The file's contents don't match a PDF, even though the name says so.",
    );
  }

  const tail = latin1.decode(bytes.subarray(Math.max(0, bytes.length - 2048)));
  if (!tail.includes("%%EOF")) {
    return reject(
      "Damaged PDF",
      "This file looks incomplete. Download your statement again and retry.",
    );
  }

  if (ACTIVE_CONTENT.test(latin1.decode(bytes))) {
    return reject(
      "Unsafe PDF",
      "This file contains embedded scripts or attachments, which a genuine statement never has.",
    );
  }

  return { ok: true };
}

/* -------------------------------------------------------------------------- */
/* Component                                                                  */
/* -------------------------------------------------------------------------- */

export interface FileUploadProps {
  /** Called once a file has passed every check. The File stays in memory only. */
  onFileAccepted: (file: File) => void;
  /** Called when the user removes the accepted file. */
  onFileRemoved?: () => void;
  disabled?: boolean;
  className?: string;
}

type Status = "idle" | "checking" | "accepted";

export default function FileUpload({
  onFileAccepted,
  onFileRemoved,
  disabled = false,
  className,
}: FileUploadProps) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const dragDepth = useRef(0);

  const [status, setStatus] = useState<Status>("idle");
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<{ title: string; message: string } | null>(
    null,
  );
  const [dragging, setDragging] = useState(false);

  // A file dropped slightly outside the zone would make the browser navigate to
  // it and wipe the page. Swallow stray drops anywhere on the window.
  useEffect(() => {
    const stop = (e: DragEvent) => e.preventDefault();
    window.addEventListener("dragover", stop);
    window.addEventListener("drop", stop);
    return () => {
      window.removeEventListener("dragover", stop);
      window.removeEventListener("drop", stop);
    };
  }, []);

  const handleFiles = useCallback(
    async (list: FileList | File[]) => {
      const files = Array.from(list);
      if (files.length === 0) return;

      if (files.length > 1) {
        setError({
          title: "One file at a time",
          message: "Please choose a single statement PDF.",
        });
        return;
      }

      setError(null);
      setStatus("checking");

      // Copy into memory first. On mobile the picked File is a handle to
      // phone storage and can read differently once the input is cleared.
      let candidate: File;
      try {
        candidate = new File([await files[0].arrayBuffer()], files[0].name, {
          type: files[0].type,
        });
      } catch {
        setStatus("idle");
        setError({
          title: "Couldn't read file",
          message: "Please try selecting it again.",
        });
        return;
      }
      if (inputRef.current) inputRef.current.value = ""; // allow re-selecting

      const result = await validatePdf(candidate);
      if (!result.ok) {
        setStatus("idle");
        setError({ title: result.title, message: result.message });
        return;
      }

      setFile(candidate);
      setStatus("accepted");
      onFileAccepted(candidate);
    },
    [onFileAccepted],
  );

  const remove = () => {
    setFile(null);
    setError(null);
    setStatus("idle");
    onFileRemoved?.();
  };

  const locked = disabled || status === "checking";

  return (
    <div className={cn("w-full space-y-4", className)}>
      <input
        ref={inputRef}
        id={inputId}
        type="file"
        accept=".pdf,application/pdf"
        aria-label="Upload your M-Pesa statement PDF"
        className="sr-only"
        tabIndex={-1}
        disabled={locked || status === "accepted"}
        onChange={(e) => {
          void handleFiles(e.currentTarget.files ?? []);
        }}
      />

      {status !== "accepted" ? (
        <button
          type="button"
          disabled={locked}
          data-dragging={dragging}
          onClick={() => inputRef.current?.click()}
          onDragEnter={(e) => {
            e.preventDefault();
            if (locked) return;
            dragDepth.current += 1;
            setDragging(true);
          }}
          onDragOver={(e) => {
            e.preventDefault();
            if (locked) return;
            e.dataTransfer.dropEffect = "copy";
          }}
          onDragLeave={(e) => {
            e.preventDefault();
            dragDepth.current = Math.max(0, dragDepth.current - 1);
            if (dragDepth.current === 0) setDragging(false);
          }}
          onDrop={(e) => {
            e.preventDefault();
            dragDepth.current = 0;
            setDragging(false);
            if (locked) return;
            void handleFiles(e.dataTransfer.files);
          }}
          className={cn(
            "group flex min-h-56 w-full flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-border bg-muted/40 px-6 py-10 text-center outline-none transition-colors",
            "hover:border-muted-foreground/50 hover:bg-muted/70",
            "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
            "data-[dragging=true]:border-primary data-[dragging=true]:bg-primary/5",
            "disabled:pointer-events-none disabled:opacity-60",
          )}
        >
          <span
            aria-hidden="true"
            className="flex size-12 items-center justify-center rounded-full bg-background text-foreground shadow-sm ring-1 ring-border transition-transform group-data-[dragging=true]:-translate-y-1 group-data-[dragging=true]:scale-105"
          >
            {status === "checking" ? (
              <LoaderCircle className="size-5 animate-spin" />
            ) : (
              <Upload className="size-5" />
            )}
          </span>

          <span className="space-y-1">
            <span className="block text-base font-semibold tracking-tight text-foreground">
              {status === "checking"
                ? "Checking your file…"
                : dragging
                  ? "Drop it here"
                  : "Drop your M-Pesa statement"}
            </span>
            <span className="block text-sm text-muted-foreground">
              {status === "checking"
                ? "Making sure it's a safe, genuine PDF."
                : "or tap to browse. PDF only, up to 10 MB."}
            </span>
          </span>

          {status !== "checking" && (
            <span className="inline-flex h-9 items-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground">
              Choose PDF
            </span>
          )}
        </button>
      ) : (
        file && (
          <div className="flex items-center gap-3 rounded-2xl border bg-card p-3 text-card-foreground">
            <span
              aria-hidden="true"
              className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary"
            >
              <FileText className="size-5" />
            </span>

            <div className="min-w-0 flex-1 space-y-1">
              <p className="truncate text-sm font-medium" title={file.name}>
                {file.name}
              </p>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">
                  {formatBytes(file.size)}
                </span>
                <Badge variant="secondary" className="gap-1">
                  <ShieldCheck className="size-3" aria-hidden="true" />
                  Verified PDF
                </Badge>
              </div>
            </div>

            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={remove}
              disabled={disabled}
              aria-label={`Remove ${file.name}`}
            >
              <X className="size-4" />
            </Button>
          </div>
        )
      )}

      {error && (
        <Alert variant="destructive" role="alert">
          <CircleAlert className="size-4" />
          <AlertTitle>{error.title}</AlertTitle>
          <AlertDescription>{error.message}</AlertDescription>
        </Alert>
      )}

      <p className="flex items-center justify-center gap-1.5 text-center text-xs text-muted-foreground">
        <ShieldCheck className="size-3.5 shrink-0" aria-hidden="true" />
        Your file is checked and read on this device. It is never uploaded.
      </p>
    </div>
  );
}
