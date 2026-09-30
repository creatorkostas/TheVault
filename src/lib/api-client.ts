import type { CreateItemInput, ItemType, VaultItem } from "./types";

const json = async (res: Response): Promise<unknown> => {
  const data: unknown = await res.json().catch(() => null);
  if (!res.ok) {
    const msg =
      data && typeof data === "object" && "error" in data
        ? String((data as { error: unknown }).error)
        : `request failed ${res.status}`;
    throw new Error(msg);
  }
  return data;
};

export const fetchItems = async (opts?: {
  type?: string;
  q?: string;
}): Promise<VaultItem[]> => {
  const p = new URLSearchParams();
  if (opts?.type) p.set("type", opts.type);
  if (opts?.q) p.set("q", opts.q);
  const data = (await json(
    await fetch(`/api/items?${p.toString()}`),
  )) as { items: VaultItem[] };
  return data.items;
};

export const createVaultItem = async (
  input: CreateItemInput,
): Promise<VaultItem> => {
  const data = (await json(
    await fetch("/api/items", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    }),
  )) as { item: VaultItem };
  return data.item;
};

export const removeVaultItem = async (id: string): Promise<void> => {
  await json(await fetch(`/api/items/${id}`, { method: "DELETE" }));
};

export const uploadFile = async (
  file: File,
): Promise<{ mediaPath: string; mime: string; size: number }> => {
  const form = new FormData();
  form.append("file", file);
  const res = await fetch("/api/upload", { method: "POST", body: form });
  return (await json(res)) as { mediaPath: string; mime: string; size: number };
};

export const guessType = (mime: string): ItemType => {
  if (mime.startsWith("image/")) return "image";
  if (mime.startsWith("video/")) return "video";
  if (mime.startsWith("audio/")) return "audio";
  return "bookmark";
};

export const fetchConfig = async (): Promise<{ disabledTypes: string[] }> => {
  const data = (await json(await fetch("/api/config"))) as {
    disabledTypes: string[];
  };
  return data;
};
