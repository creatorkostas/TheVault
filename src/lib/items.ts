import { getDb } from "./db";
import { isTypeDisabled } from "./config";
import {
  isItemType,
  type CreateItemInput,
  type ItemType,
  type VaultItem,
} from "./types";

interface Row {
  id: string;
  type: string;
  title: string;
  url: string | null;
  content: string | null;
  media_path: string | null;
  thumbnail: string | null;
  tags: string;
  collection: string | null;
  user_id: string | null;
  created_at: number;
  updated_at: number;
}

export const toVaultItem = (row: Row): VaultItem => ({
  id: row.id,
  type: isItemType(row.type) ? row.type : "note",
  title: row.title,
  url: row.url,
  content: row.content,
  mediaPath: row.media_path,
  thumbnail: row.thumbnail,
  tags: parseTags(row.tags),
  collection: row.collection,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

export const parseTags = (raw: string | null): string[] => {
  if (!raw) return [];
  try {
    const v: unknown = JSON.parse(raw);
    return Array.isArray(v) ? v.filter((t): t is string => typeof t === "string") : [];
  } catch {
    return [];
  }
};

export const stringifyTags = (tags: string[]): string =>
  JSON.stringify([...new Set(tags.map((t) => t.trim()).filter(Boolean))]);

export const validateCreate = (
  input: CreateItemInput,
): { ok: true } | { ok: false; error: string } => {
  if (!isItemType(input.type)) return { ok: false, error: "invalid type" };
  if (isTypeDisabled(input.type))
    return { ok: false, error: `type '${input.type}' is disabled by server config` };
  if (!input.title?.trim()) return { ok: false, error: "title required" };
  if (input.type === "youtube" && !input.url?.trim())
    return { ok: false, error: "youtube needs url" };
  if ((input.type === "bookmark" || input.type === "website") && !input.url?.trim())
    return { ok: false, error: "url required for bookmark/website" };
  return { ok: true };
};

export const makeId = (): string =>
  `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;

export function listItems(userId: string, opts?: { type?: string; query?: string }): VaultItem[] {
  const db = getDb();
  const rows = db
    .prepare("SELECT * FROM items WHERE user_id = ? ORDER BY created_at DESC")
    .all(userId) as unknown as Row[];
  const q = opts?.query?.toLowerCase().trim();
  const t = opts?.type;
  return rows
    .map(toVaultItem)
    .filter((it) => (!t || t === "all" ? true : it.type === t))
    .filter((it) =>
      !q
        ? true
        : `${it.title} ${it.content ?? ""} ${it.tags.join(" ")} ${it.url ?? ""}`
            .toLowerCase()
            .includes(q),
    );
}

export function createItem(userId: string, input: CreateItemInput): VaultItem {
  const v = validateCreate(input);
  if (!v.ok) throw new Error(v.error);
  const now = Date.now();
  const row: Row = {
    id: makeId(),
    type: input.type,
    title: input.title.trim(),
    url: input.url?.trim() || null,
    content: input.content ?? null,
    media_path: input.mediaPath ?? null,
    thumbnail: input.thumbnail ?? null,
    tags: stringifyTags(input.tags ?? []),
    collection: input.collection?.trim() || null,
    user_id: userId,
    created_at: now,
    updated_at: now,
  };
  getDb()
    .prepare(
      "INSERT INTO items (id, type, title, url, content, media_path, thumbnail, tags, collection, user_id, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
    )
    .run(
      row.id, row.type, row.title, row.url, row.content, row.media_path,
      row.thumbnail, row.tags, row.collection, row.user_id, row.created_at, row.updated_at,
    );
  return toVaultItem(row);
}

export function getItem(userId: string, id: string): VaultItem | null {
  const row = getDb()
    .prepare("SELECT * FROM items WHERE id = ? AND user_id = ?")
    .get(id, userId) as unknown as Row | undefined;
  return row ? toVaultItem(row) : null;
}

/** Find an item by media path, scoped to the owner (for /api/files auth). */
export function getItemByMedia(userId: string, mediaPath: string): VaultItem | null {
  const row = getDb()
    .prepare("SELECT * FROM items WHERE media_path = ? AND user_id = ?")
    .get(mediaPath, userId) as unknown as Row | undefined;
  return row ? toVaultItem(row) : null;
}

export function deleteItem(userId: string, id: string): void {
  getDb().prepare("DELETE FROM items WHERE id = ? AND user_id = ?").run(id, userId);
}

export function updateItem(
  userId: string,
  id: string,
  patch: Partial<CreateItemInput>,
): VaultItem | null {
  const cur = getItem(userId, id);
  if (!cur) return null;
  const title = patch.title?.trim() ?? cur.title;
  const url = patch.url !== undefined ? patch.url?.trim() || null : cur.url;
  const content = patch.content !== undefined ? patch.content : cur.content;
  const mediaPath = patch.mediaPath !== undefined ? patch.mediaPath : cur.mediaPath;
  const collection =
    patch.collection !== undefined ? patch.collection?.trim() || null : cur.collection;
  const tags = patch.tags !== undefined ? stringifyTags(patch.tags) : JSON.stringify(cur.tags);
  const updatedAt = Date.now();
  getDb()
    .prepare(
      "UPDATE items SET title=?, url=?, content=?, media_path=?, collection=?, tags=?, updated_at=? WHERE id=? AND user_id=?",
    )
    .run(title, url, content, mediaPath, collection, tags, updatedAt, id, userId);
  return getItem(userId, id);
}

export const searchItems = (userId: string, query: string): VaultItem[] => {
  const q = query.trim();
  if (!q) return listItems(userId);
  const like = `%${q}%`;
  const rows = getDb()
    .prepare(
      "SELECT * FROM items WHERE user_id = ? AND (title LIKE ? OR content LIKE ? OR url LIKE ?) ORDER BY created_at DESC",
    )
    .all(userId, like, like, like) as unknown as Row[];
  return rows.map(toVaultItem);
};

/** Welcome note for first-time users (empty vault). */
export function ensureWelcome(userId: string): void {
  const count = getDb()
    .prepare("SELECT COUNT(*) AS n FROM items WHERE user_id = ?")
    .get(userId) as unknown as { n: number };
  if (count.n > 0) return;
  createItem(userId, {
    type: "note",
    title: "Welcome to TheVault",
    content: "Save images, bookmarks, notes, audio notes, videos and YouTube links here.",
    tags: ["welcome"],
  });
};

export type { ItemType };
