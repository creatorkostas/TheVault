import { ITEM_TYPES, isItemType, type ItemType } from "./types";

/** Upload kinds map 1:1 to item types (youtube is link-only, never uploaded). */
export type UploadKind = "image" | "video" | "audio";

/**
 * Comma-separated item types disabled by config, e.g. "video,audio".
 * Source: VAULT_DISABLED_TYPES env (empty = everything allowed).
 */
export const disabledTypes = (): ItemType[] => {
  const raw = process.env.VAULT_DISABLED_TYPES ?? "";
  return raw
    .split(",")
    .map((t) => t.trim().toLowerCase())
    .filter((t): t is ItemType => isItemType(t));
};

export const isTypeDisabled = (type: string): boolean =>
  (disabledTypes() as string[]).includes(type);

export const allowedTypes = (): ItemType[] =>
  ITEM_TYPES.filter((t) => !isTypeDisabled(t));

export const allowedUploadKinds = (): UploadKind[] =>
  (["image", "video", "audio"] as UploadKind[]).filter((k) => !isTypeDisabled(k));
