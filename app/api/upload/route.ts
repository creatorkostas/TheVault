import { mkdir, writeFile } from "node:fs/promises";
import { NextRequest, NextResponse } from "next/server";
import { isAuthed, requireUser } from "@/lib/auth";
import { isTypeDisabled } from "@/lib/config";

const kindOf = (mime: string): string | null => {
  if (mime.startsWith("image/")) return "image";
  if (mime.startsWith("video/")) return "video";
  if (mime.startsWith("audio/")) return "audio";
  return null;
};

const kindOfFile = (mime: string, filename: string): string | null => {
  const direct = kindOf(mime);
  if (direct) return direct;
  // Fall back to extension for clients that omit part content-types (e.g. Go multipart)
  const ext = filename.split(".").pop()?.toLowerCase() ?? "";
  if (["jpg", "jpeg", "png", "gif", "webp", "svg", "bmp", "avif"].includes(ext)) return "image";
  if (["mp4", "webm", "mov", "mkv", "avi"].includes(ext)) return "video";
  if (["mp3", "wav", "ogg", "m4a", "flac", "opus"].includes(ext)) return "audio";
  return null;
};

export async function POST(req: NextRequest): Promise<NextResponse> {
  const authed = await requireUser(req);
  if (!isAuthed(authed)) return authed;
  const form = await req.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File))
    return NextResponse.json({ error: "file required" }, { status: 400 });

  const kind = kindOfFile(file.type, file.name);
  if (!kind)
    return NextResponse.json({ error: "unsupported file type" }, { status: 400 });
  if (isTypeDisabled(kind))
    return NextResponse.json(
      { error: `uploads of type '${kind}' are disabled by server config` },
      { status: 403 },
    );
  if (file.size > 200 * 1024 * 1024)
    return NextResponse.json({ error: "file too large (max 200MB)" }, { status: 400 });

  await mkdir("./data/vault", { recursive: true });
  const safe = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const name = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${safe}`;
  const buf = Buffer.from(await file.arrayBuffer());
  await writeFile(`./data/vault/${name}`, buf);
  return NextResponse.json({
    mediaPath: `/api/files/${name}`,
    mime: file.type,
    size: file.size,
  });
}
