"use client";

import { useState } from "react";
import { AudioRecorder } from "./AudioRecorder";
import { guessType, uploadFile } from "@/lib/api-client";
import { CloseIcon } from "./icons";
import type { CreateItemInput, ItemType } from "@/lib/types";

const TYPES: ItemType[] = ["bookmark", "website", "note", "image", "video", "audio", "youtube"];

const inputCls =
  "w-full rounded-2xl bg-zinc-100 p-3 text-[15px] outline-none placeholder:text-zinc-500 focus:ring-2 focus:ring-zinc-900";

const acceptFor = (disabled: string[]): string => {
  const kinds: string[] = [];
  if (!disabled.includes("image")) kinds.push("image/*");
  if (!disabled.includes("video")) kinds.push("video/*");
  if (!disabled.includes("audio")) kinds.push("audio/*");
  return kinds.join(",");
};

export function AddDrawer({
  disabled,
  onCreated,
  onClose,
}: {
  disabled: string[];
  onCreated: () => void;
  onClose: () => void;
}): React.ReactElement {
  const types = TYPES.filter((t) => !disabled.includes(t));
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    type: (types[0] ?? "note") as ItemType,
    title: "",
    url: "",
    content: "",
    tags: "",
    collection: "",
    mediaPath: "",
  });

  const set = (k: string, v: string): void =>
    setForm((f) => ({ ...f, [k]: v }));

  const handleFile = async (file: File): Promise<void> => {
    const up = await uploadFile(file);
    setForm((f) => ({
      ...f,
      mediaPath: up.mediaPath,
      type: guessType(up.mime),
      title: f.title || file.name,
    }));
  };

  const handleAudioBlob = async (blob: Blob): Promise<void> => {
    const file = new File([blob], `audio-${Date.now()}.webm`, { type: blob.type });
    await handleFile(file);
  };

  const submit = async (): Promise<void> => {
    setSaving(true);
    try {
      const input: CreateItemInput = {
        type: form.type,
        title: form.title,
        url: form.url || null,
        content: form.content || null,
        mediaPath: form.mediaPath || null,
        tags: form.tags.split(",").map((t) => t.trim()).filter(Boolean),
        collection: form.collection || null,
      };
      await fetch("/api/items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      onClose();
      onCreated();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/40" onClick={onClose}>
      <div
        className="w-full max-w-md space-y-3 overflow-y-auto bg-white p-5 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center">
          <h2 className="text-lg font-bold">Save to Enthymio</h2>
          <button
            type="button"
            onClick={onClose}
            className="ml-auto flex h-9 w-9 items-center justify-center rounded-full bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
          >
            <CloseIcon />
          </button>
        </div>
        <label className="block text-sm font-medium">
          Type
          <select
            value={form.type}
            onChange={(e) => set("type", e.target.value)}
            className={`${inputCls} mt-1`}
          >
            {types.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </label>
        <input
          placeholder="Title"
          value={form.title}
          onChange={(e) => set("title", e.target.value)}
          className={inputCls}
        />
        <input
          placeholder="URL (bookmark / website / youtube)"
          value={form.url}
          onChange={(e) => set("url", e.target.value)}
          className={inputCls}
        />
        <textarea
          placeholder="Note / description"
          value={form.content}
          onChange={(e) => set("content", e.target.value)}
          rows={4}
          className={inputCls}
        />
        <div className="flex gap-2">
          <input
            placeholder="tags, comma separated"
            value={form.tags}
            onChange={(e) => set("tags", e.target.value)}
            className={inputCls}
          />
          <input
            placeholder="collection"
            value={form.collection}
            onChange={(e) => set("collection", e.target.value)}
            className={inputCls}
          />
        </div>
        <div className="space-y-2 rounded-2xl bg-zinc-100 p-4">
          <p className="text-sm text-zinc-600">Upload image / video / audio file</p>
          <input
            type="file"
            accept={acceptFor(disabled)}
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleFile(f).catch((err) => alert(String(err)));
            }}
          />
          {form.mediaPath ? (
            <p className="truncate text-xs font-medium text-emerald-700">{form.mediaPath}</p>
          ) : null}
          <AudioRecorder onBlob={(b) => handleAudioBlob(b).catch((e) => alert(String(e)))} />
        </div>
        <button
          type="button"
          onClick={() => submit().catch((e) => alert(String(e)))}
          disabled={saving || !form.title.trim()}
          className="w-full rounded-full bg-[#e60023] py-3 font-semibold text-white hover:bg-[#c8001e] disabled:opacity-50"
        >
          {saving ? "Saving…" : "Save"}
        </button>
      </div>
    </div>
  );
}
