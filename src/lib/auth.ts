import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getDb } from "./db";

export interface Authed {
  userId: string;
}

/**
 * Local-first auth: a Clerk session OR a personal API token
 * (Authorization: Bearer <token>, created in Settings).
 * Used by the web UI (cookies), extension, Go helper, and scripts.
 */
export const requireUser = async (
  req: NextRequest,
): Promise<Authed | NextResponse> => {
  const { userId } = await auth();
  if (userId) return { userId };

  const header = req.headers.get("authorization");
  const token = header?.startsWith("Bearer ") ? header.slice(7) : null;
  if (token) {
    const row = getDb()
      .prepare("SELECT user_id FROM api_tokens WHERE token = ?")
      .get(token) as unknown as { user_id: string } | undefined;
    if (row?.user_id) return { userId: row.user_id };
  }
  return NextResponse.json({ error: "unauthorized" }, { status: 401 });
};

export const isAuthed = (v: Authed | NextResponse): v is Authed =>
  !(v instanceof NextResponse);
