import { randomBytes } from "node:crypto";
import { getDb } from "./db";

export interface ApiToken {
  id: string;
  name: string;
  createdAt: number;
  hint: string;
}

export function listTokens(userId: string): ApiToken[] {
  const rows = getDb()
    .prepare("SELECT id, token, name, created_at FROM api_tokens WHERE user_id = ? ORDER BY created_at DESC")
    .all(userId) as unknown as Array<{ id: string; token: string; name: string; created_at: number }>;
  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    createdAt: r.created_at,
    hint: `…${r.token.slice(-4)}`,
  }));
}

/** Creates a token; the secret is returned once and never listed again. */
export function createToken(userId: string, name: string): { id: string; token: string; name: string; createdAt: number } {
  const id = randomBytes(8).toString("hex");
  const token = `vt_${randomBytes(24).toString("base64url")}`;
  const now = Date.now();
  getDb()
    .prepare("INSERT INTO api_tokens (id, token, user_id, name, created_at) VALUES (?, ?, ?, ?, ?)")
    .run(id, token, userId, name.trim() || "default", now);
  return { id, token, name: name.trim() || "default", createdAt: now };
}

export function revokeToken(userId: string, id: string): void {
  getDb()
    .prepare("DELETE FROM api_tokens WHERE id = ? AND user_id = ?")
    .run(id, userId);
}
