"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { UploadCloud } from "lucide-react";
import { useState } from "react";
import FileUpload from "./FileUpload";

interface StatementUploadModalProps {
  onFileAccepted: (file: File) => void;
  triggerButtonText?: string;
}

export function StatementUploadModal({
  onFileAccepted,
  triggerButtonText = "Upload Statement",
}: StatementUploadModalProps) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button className="gap-2 text-xs" />}>
        <UploadCloud className="size-4" />
        {triggerButtonText}
      </DialogTrigger>

      <DialogContent className="sm:max-w-md rounded-2xl">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold tracking-tight">
            Import M-Pesa Statement
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Upload your monthly or yearly M-Pesa statement PDF to analyze your
            cash flow trends securely on your device.
          </DialogDescription>
        </DialogHeader>

        <div className="pt-2">
          <FileUpload
            onFileAccepted={(file) => {
              onFileAccepted(file);
              setOpen(false);
            }}
            onFileRemoved={() => {}}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
