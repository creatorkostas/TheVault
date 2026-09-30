import { NextRequest, NextResponse } from "next/server";
import { isAuthed, requireUser } from "@/lib/auth";
import { createItem, ensureWelcome, listItems } from "@/lib/items";
import { isItemType } from "@/lib/types";
import { toYouTubeThumb } from "@/lib/youtube";

export async function GET(req: NextRequest): Promise<NextResponse> {
  const authed = await requireUser(req);
  if (!isAuthed(authed)) return authed;
  ensureWelcome(authed.userId);
  const { searchParams } = new URL(req.url);
  const data = listItems(authed.userId, {
    type: searchParams.get("type") ?? undefined,
    query: searchParams.get("q") ?? undefined,
  });
  return NextResponse.json({ items: data });
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  const authed = await requireUser(req);
  if (!isAuthed(authed)) return authed;
  const body: unknown = await req.json().catch(() => null);
  if (!body || typeof body !== "object")
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  const b = body as Record<string, unknown>;

  const type = typeof b.type === "string" ? b.type : "";
  if (!isItemType(type))
    return NextResponse.json({ error: "invalid type" }, { status: 400 });

  const title = typeof b.title === "string" ? b.title : "";
  const tags = Array.isArray(b.tags)
    ? b.tags.filter((t): t is string => typeof t === "string")
    : [];

  try {
    const item = createItem(authed.userId, {
      type,
      title,
      url: typeof b.url === "string" ? b.url : null,
      content: typeof b.content === "string" ? b.content : null,
      mediaPath: typeof b.mediaPath === "string" ? b.mediaPath : null,
      thumbnail:
        typeof b.thumbnail === "string"
          ? b.thumbnail
          : type === "youtube" && typeof b.url === "string"
            ? (toYouTubeThumb(b.url) ?? null)
            : null,
      tags,
      collection: typeof b.collection === "string" ? b.collection : null,
    });
    return NextResponse.json({ item }, { status: 201 });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "create failed" },
      { status: 400 },
    );
  }
}
