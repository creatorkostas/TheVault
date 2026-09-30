"use client";

import { CloseIcon } from "./icons";

export function ConfirmDialog({
  title,
  message,
  confirmLabel = "Delete",
  destructive = true,
  busy = false,
  onConfirm,
  onCancel,
}: {
  title: string;
  message: string;
  confirmLabel?: string;
  destructive?: boolean;
  busy?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}): React.ReactElement {
  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4"
      onClick={onCancel}
    >
      <div
        role="alertdialog"
        aria-modal="true"
        aria-label={title}
        className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start">
          <h2 className="text-lg font-bold text-zinc-900">{title}</h2>
          <button
            type="button"
            onClick={onCancel}
            aria-label="Close"
            className="ml-auto flex h-9 w-9 items-center justify-center rounded-full bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
          >
            <CloseIcon />
          </button>
        </div>
        <p className="mt-2 text-[15px] text-zinc-600">{message}</p>
        <div className="mt-6 flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-full bg-zinc-100 px-5 py-2.5 text-sm font-semibold text-zinc-800 hover:bg-zinc-200"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={busy}
            className={`rounded-full px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50 ${
              destructive ? "bg-[#e60023] hover:bg-[#c8001e]" : "bg-zinc-900 hover:bg-zinc-700"
            }`}
          >
            {busy ? "Working…" : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
