export const ITEM_TYPES = [
  "image",
  "bookmark",
  "website",
  "note",
  "audio",
  "video",
  "youtube",
] as const;

export type ItemType = (typeof ITEM_TYPES)[number];

export interface VaultItem {
  id: string;
  type: ItemType;
  title: string;
  url: string | null;
  content: string | null;
  mediaPath: string | null;
  thumbnail: string | null;
  tags: string[];
  collection: string | null;
  createdAt: number;
  updatedAt: number;
}

export interface CreateItemInput {
  type: ItemType;
  title: string;
  url?: string | null;
  content?: string | null;
  mediaPath?: string | null;
  thumbnail?: string | null;
  tags?: string[];
  collection?: string | null;
}

export const isItemType = (v: unknown): v is ItemType =>
  typeof v === "string" &&
  (ITEM_TYPES as readonly string[]).includes(v);
