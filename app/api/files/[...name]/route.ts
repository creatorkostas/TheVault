import { readFile } from "node:fs/promises";
import { NextRequest, NextResponse } from "next/server";
import { isAuthed, requireUser } from "@/lib/auth";
import { getItemByMedia } from "@/lib/items";

const MIME: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  gif: "image/gif",
  webp: "image/webp",
  svg: "image/svg+xml",
  mp4: "video/mp4",
  webm: "video/webm",
  mov: "video/quicktime",
  mp3: "audio/mpeg",
  wav: "audio/wav",
  ogg: "audio/ogg",
  m4a: "audio/mp4",
};

export async function GET(
  req: NextRequest,
  ctx: { params: Promise<{ name: string[] }> },
): Promise<NextResponse> {
  const authed = await requireUser(req);
  if (!isAuthed(authed)) return authed;
  const { name } = await ctx.params;
  const filename = name.join("/").replace(/\.\./g, "");
  if (!filename || filename.includes("/"))
    return new NextResponse("not found", { status: 404 });
  const owned = getItemByMedia(authed.userId, `/api/files/${filename}`);
  if (!owned) return new NextResponse("not found", { status: 404 });
  const buf = await readFile(`./data/enthymio/${filename}`).catch(() => null);
  if (!buf) return new NextResponse("not found", { status: 404 });
  const ext = filename.split(".").pop()?.toLowerCase() ?? "";
  return new NextResponse(new Uint8Array(buf), {
    headers: {
      "Content-Type": MIME[ext] ?? "application/octet-stream",
      "Cache-Control": "public, max-age=31536000",
    },
  });
}
