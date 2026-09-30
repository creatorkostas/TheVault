import { unlink } from "node:fs/promises";
import { NextRequest, NextResponse } from "next/server";
import { isAuthed, requireUser } from "@/lib/auth";
import { deleteItem, getItem, updateItem } from "@/lib/items";

export async function DELETE(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  const authed = await requireUser(req);
  if (!isAuthed(authed)) return authed;
  const { id } = await ctx.params;
  const cur = getItem(authed.userId, id);
  deleteItem(authed.userId, id);
  const media = cur?.mediaPath;
  if (media?.startsWith("/api/files/")) {
    const file = `./data/vault/${media.replace("/api/files/", "")}`;
    await unlink(file).catch(() => {});
  }
  return NextResponse.json({ ok: true });
}

export async function PATCH(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  const authed = await requireUser(req);
  if (!isAuthed(authed)) return authed;
  const { id } = await ctx.params;
  const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body) return NextResponse.json({ error: "invalid json" }, { status: 400 });
  const patch = {
    ...(typeof body.title === "string" ? { title: body.title } : {}),
    ...(typeof body.url === "string" || body.url === null ? { url: body.url } : {}),
    ...(typeof body.content === "string" || body.content === null
      ? { content: body.content }
      : {}),
    ...(Array.isArray(body.tags) ? { tags: body.tags as string[] } : {}),
    ...(typeof body.collection === "string" || body.collection === null
      ? { collection: body.collection }
      : {}),
  };
  const item = updateItem(authed.userId, id, patch);
  if (!item) return NextResponse.json({ error: "not found" }, { status: 404 });
  return NextResponse.json({ item });
}

export async function GET(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  const authed = await requireUser(req);
  if (!isAuthed(authed)) return authed;
  const { id } = await ctx.params;
  const item = getItem(authed.userId, id);
  if (!item) return NextResponse.json({ error: "not found" }, { status: 404 });
  return NextResponse.json({ item });
}
