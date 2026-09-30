"use client";

import { useEffect, useState } from "react";
import { AlertIcon, CheckIcon } from "./icons";

export type ToastKind = "success" | "error";

interface ToastItem {
  id: number;
  kind: ToastKind;
  message: string;
  bornAt: number;
}

type Listener = (items: ToastItem[]) => void;

let nextId = 1;
let items: ToastItem[] = [];
const listeners = new Set<Listener>();
let timer: ReturnType<typeof setTimeout> | null = null;

const emit = (): void => {
  for (const fn of listeners) fn([...items]);
};

const scheduleExpiry = (): void => {
  if (timer) return;
  timer = setTimeout(() => {
    timer = null;
    const now = Date.now();
    items = items.filter((t) => now - t.bornAt < 4000);
    if (items.length) scheduleExpiry();
    emit();
  }, 500);
};

/** Show a polished toast instead of window.alert. Mount <Toaster/> once. */
export const toast = (message: string, kind: ToastKind = "success"): void => {
  const id = nextId++;
  items = [...items.slice(-2), { id, kind, message, bornAt: Date.now() }];
  emit();
  scheduleExpiry();
};

export function Toaster(): React.ReactElement {
  const [visible, setVisible] = useState<ToastItem[]>([]);

  useEffect(() => {
    const fn: Listener = (next) => setVisible(next);
    listeners.add(fn);
    return () => {
      listeners.delete(fn);
    };
  }, []);

  return (
    <div className="pointer-events-none fixed bottom-6 left-1/2 z-[70] flex w-full max-w-sm -translate-x-1/2 flex-col items-center gap-2 px-4">
      {visible.map((t) => (
        <div
          key={`${t.id}-${t.message}`}
          className="pointer-events-auto flex w-full items-center gap-2.5 rounded-2xl bg-[#b5a79b] px-4 py-3 text-sm font-medium text-zinc-900 shadow-xl"
        >
          <span className={t.kind === "success" ? "text-emerald-700" : "text-red-700"}>
            {t.kind === "success" ? <CheckIcon /> : <AlertIcon />}
          </span>
          <span className="min-w-0 flex-1 truncate">{t.message}</span>
          <button
            type="button"
            onClick={() => {
              items = items.filter((x) => x.id !== t.id);
              emit();
            }}
            className="shrink-0 rounded-full px-2 py-0.5 text-xs text-zinc-600 hover:text-zinc-900"
          >
            Dismiss
          </button>
        </div>
      ))}
    </div>
  );
}
