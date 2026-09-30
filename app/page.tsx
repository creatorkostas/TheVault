"use client";

import { useCallback, useEffect, useState } from "react";
import { Show, SignInButton, SignUpButton } from "@clerk/nextjs";
import { AddDrawer } from "@/components/AddDrawer";
import { SearchIcon } from "@/components/icons";
import { apiTypeOf, Sidebar, type FilterKey } from "@/components/Sidebar";
import { SettingsModal } from "@/components/SettingsModal";
import { VaultCard } from "@/components/VaultCard";
import { fetchConfig, fetchItems, removeVaultItem } from "@/lib/api-client";
import type { VaultItem } from "@/lib/types";

export default function HomePage(): React.ReactElement {
  const [items, setItems] = useState<VaultItem[]>([]);
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<FilterKey>("all");
  const [disabled, setDisabled] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchItems({ type: apiTypeOf(filter), q });
      setItems(
        filter === "links"
          ? data.filter((it) => it.type === "bookmark" || it.type === "website")
          : data,
      );
    } finally {
      setLoading(false);
    }
  }, [filter, q]);

  useEffect(() => {
    fetchConfig().then((c) => setDisabled(c.disabledTypes)).catch(console.error);
  }, []);

  useEffect(() => {
    const t = setTimeout(() => {
      load().catch(console.error);
    }, 250);
    return () => clearTimeout(t);
  }, [load]);

  const onDelete = async (id: string): Promise<void> => {
    if (!confirm("Delete this item?")) return;
    await removeVaultItem(id);
    await load();
  };

  return (
    <div className="flex bg-white">
      <Show when="signed-out">
        <main className="mx-auto flex min-h-screen w-full max-w-lg flex-col items-center justify-center px-6 text-center">
          <span className="flex h-16 w-16 items-center justify-center rounded-full bg-[#e60023] text-3xl font-black text-white">
            V
          </span>
          <h1 className="mt-6 text-3xl font-black tracking-tight">TheVault</h1>
          <p className="mt-2 text-zinc-500">
            Your private vault for images, links, notes, audio and videos. Sign in to open it.
          </p>
          <div className="mt-6 flex gap-3">
            <SignInButton mode="modal">
              <button type="button" className="rounded-full bg-[#e60023] px-6 py-2.5 font-semibold text-white hover:bg-[#c8001e]">
                Sign in
              </button>
            </SignInButton>
            <SignUpButton mode="modal">
              <button type="button" className="rounded-full bg-zinc-100 px-6 py-2.5 font-semibold text-zinc-900 hover:bg-zinc-200">
                Sign up
              </button>
            </SignUpButton>
          </div>
        </main>
      </Show>
      <Show when="signed-in">
      <Sidebar active={filter} disabled={disabled} onSelect={setFilter} onCreate={() => setDrawerOpen(true)} onSettings={() => setSettingsOpen(true)} />
      <main className="min-w-0 flex-1 px-4 pb-10">
        <div className="sticky top-0 z-10 bg-white py-3">
          <label className="flex items-center gap-2 rounded-full bg-zinc-100 px-4 py-2.5">
            <span className="text-zinc-500">
              <SearchIcon />
            </span>
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search titles, notes, tags, urls…"
              className="w-full bg-transparent text-[15px] outline-none placeholder:text-zinc-500"
            />
          </label>
        </div>
        {loading ? (
          <div className="masonry" aria-hidden>
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="animate-pulse rounded-2xl bg-zinc-100" style={{ height: 220 + ((i * 53) % 160) }} />
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="mx-auto mt-16 max-w-md text-center">
            <p className="text-lg font-semibold">Nothing here yet</p>
            <p className="mt-1 text-sm text-zinc-500">
              Tap + to save your first image, link, note, audio or video.
            </p>
            <button
              type="button"
              onClick={() => setDrawerOpen(true)}
              className="mt-4 rounded-full bg-[#e60023] px-5 py-2.5 font-semibold text-white hover:bg-[#c8001e]"
            >
              Save to vault
            </button>
          </div>
        ) : (
          <div className="masonry">
            {items.map((it) => (
              <VaultCard key={it.id} item={it} onDelete={onDelete} />
            ))}
          </div>
        )}
      </main>
      {drawerOpen ? <AddDrawer disabled={disabled} onCreated={() => load()} onClose={() => setDrawerOpen(false)} /> : null}
      {settingsOpen ? <SettingsModal onClose={() => setSettingsOpen(false)} /> : null}
      </Show>
    </div>
  );
}
