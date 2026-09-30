"use client";

import { useState } from "react";
import { CloseIcon, PlayTriangle } from "./icons";
import type { VaultItem } from "@/lib/types";
import { toYouTubeEmbed } from "@/lib/youtube";

const domainOf = (url: string | null): string => {
  if (!url) return "";
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
};

const tileBg: Record<string, string> = {
  note: "bg-amber-50",
  audio: "bg-violet-50",
  bookmark: "bg-white",
  website: "bg-white",
};

function Media({ item }: { item: VaultItem }): React.ReactElement {
  const [playing, setPlaying] = useState(false);
  const embed =
    item.type === "youtube" && item.url ? toYouTubeEmbed(item.url) : null;

  if (embed) {
    if (!playing) {
      return (
        <button
          type="button"
          onClick={() => setPlaying(true)}
          className="relative block w-full"
          title="Play video"
        >
          {item.thumbnail ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={item.thumbnail} alt={item.title} className="w-full" loading="lazy" />
          ) : (
            <span className="block aspect-video w-full bg-zinc-900" />
          )}
          <span className="absolute inset-0 flex items-center justify-center">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-white/90 shadow">
              <PlayTriangle />
            </span>
          </span>
        </button>
      );
    }
    return (
      <span className="block aspect-video w-full">
        <iframe
          src={embed}
          title={item.title}
          className="h-full w-full"
          allowFullScreen
        />
      </span>
    );
  }

  if (item.type === "image" && item.mediaPath) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={item.mediaPath} alt={item.title} className="w-full" loading="lazy" />;
  }

  if (item.type === "video" && item.mediaPath) {
    return <video src={item.mediaPath} controls className="w-full" preload="metadata" />;
  }

  if (item.type === "audio" && item.mediaPath) {
    return (
      <span className={`block p-4 ${tileBg.audio}`}>
        <audio src={item.mediaPath} controls className="w-full" preload="metadata" />
      </span>
    );
  }

  if (item.type === "note") {
    return (
      <span className={`block p-5 ${tileBg.note}`}>
        <span className="line-clamp-6 whitespace-pre-wrap text-[15px] leading-relaxed text-zinc-800">
          {item.content || item.title}
        </span>
      </span>
    );
  }

  // bookmark / website / fallback link card
  const domain = domainOf(item.url);
  return (
    <span className="block bg-white p-5 ring-1 ring-inset ring-zinc-200">
      <span className="flex items-center gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-zinc-900 text-lg font-bold text-white">
          {(domain || item.title).charAt(0).toUpperCase()}
        </span>
        <span className="min-w-0">
          <span className="block truncate text-sm font-semibold text-zinc-900">{domain || "link"}</span>
          {item.content ? (
            <span className="line-clamp-2 text-xs text-zinc-500">{item.content}</span>
          ) : null}
        </span>
      </span>
    </span>
  );
}

export function VaultCard({
  item,
  onDelete,
}: {
  item: VaultItem;
  onDelete: (id: string) => void;
}): React.ReactElement {
  const domain = domainOf(item.url);
  return (
    <article className="group">
      <div className="relative overflow-hidden rounded-2xl bg-zinc-100">
        <Media item={item} />
        <div className="pointer-events-none absolute inset-0 rounded-2xl bg-black/0 transition group-hover:bg-black/15" />
        <button
          type="button"
          onClick={() => onDelete(item.id)}
          title="Delete"
          className="absolute right-2 top-2 hidden h-8 w-8 items-center justify-center rounded-full bg-white text-zinc-700 shadow group-hover:flex"
        >
          <CloseIcon />
        </button>
      </div>
      <div className="px-1 pb-1 pt-2">
        <h3 className="line-clamp-2 text-sm font-semibold leading-snug text-zinc-900">
          {item.url && item.type !== "note" ? (
            <a href={item.url} target="_blank" rel="noreferrer" className="hover:underline">
              {item.title}
            </a>
          ) : (
            item.title
          )}
        </h3>
        <p className="mt-0.5 flex items-center gap-1 text-xs text-zinc-500">
          {domain ? <span className="truncate">{domain}</span> : <span>{item.type}</span>}
          {item.tags.slice(0, 2).map((t) => (
            <span key={t} className="shrink-0">· #{t}</span>
          ))}
        </p>
      </div>
    </article>
  );
}
