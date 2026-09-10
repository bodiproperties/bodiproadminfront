"use client";

import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";

interface Props {
  open: boolean;
  secondsLeft: number;
  onStay: () => void;
  onLogout: () => void;
}

export default function IdleWarningDialog({
  open,
  secondsLeft,
  onStay,
  onLogout,
}: Props) {
  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="rounded-none border-0 bg-white p-8 shadow-2xl sm:max-w-sm">
        <DialogTitle className="text-2xl font-extralight tracking-tight text-neutral-900">
          Та идэвхгүй байна
        </DialogTitle>
        <p className="mt-3 text-sm text-neutral-500">
          <span className="font-medium text-neutral-900">{secondsLeft}</span>{" "}
          секундын дараа автоматаар системээс гарна.
        </p>
        <div className="mt-8 flex justify-end gap-2">
          <button
            type="button"
            onClick={onLogout}
            className="px-5 py-3 text-[11px] uppercase tracking-[0.25em] text-neutral-500 transition-colors hover:text-neutral-900"
          >
            Гарах
          </button>
          <button
            type="button"
            onClick={onStay}
            className="bg-neutral-900 px-6 py-3 text-[11px] uppercase tracking-[0.25em] text-white transition-colors hover:bg-neutral-800"
          >
            Vргэлжлvvлэх
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}