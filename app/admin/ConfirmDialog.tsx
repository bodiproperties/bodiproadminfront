"use client";

import { AlertTriangle } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  danger?: boolean; // устгах гэх мэт эрсдэлтэй үйлдэлд улаан товч
}

export default function ConfirmDialog({
  open,
  onOpenChange,
  title = "Баталгаажуулах",
  message,
  confirmText = "Тийм",
  cancelText = "Болих",
  onConfirm,
  danger = false,
}: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-none border-0 bg-white p-8 shadow-2xl sm:max-w-md sm:p-10">
        <div className="flex items-start gap-4">
          <span
            className={`mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
              danger
                ? "bg-red-50 text-red-600"
                : "bg-[#F58220]/10 text-[#F58220]"
            }`}
          >
            <AlertTriangle className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <p className="text-[10px] uppercase tracking-[0.35em] text-[#F58220]">
              Анхаар
            </p>
            <DialogTitle className="mt-2 text-xl font-extralight tracking-tight text-neutral-900">
              {title}
            </DialogTitle>
            <p className="mt-3 text-sm leading-relaxed text-neutral-500">
              {message}
            </p>
          </div>
        </div>

        <div className="mt-8 flex justify-end gap-2">
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="px-6 py-3 text-[11px] uppercase tracking-[0.25em] text-neutral-500 transition-colors hover:text-neutral-900 cursor-pointer"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={() => {
              onConfirm();
              onOpenChange(false);
            }}
            className={`px-7 py-3 text-[11px] uppercase tracking-[0.25em] text-white transition-colors cursor-pointer ${
              danger
                ? "bg-red-600 hover:bg-red-700"
                : "bg-neutral-900 hover:bg-neutral-800"
            }`}
          >
            {confirmText}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
