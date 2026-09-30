import { NextRequest, NextResponse } from "next/server";
import { isAuthed, requireUser } from "@/lib/auth";
import { createToken, listTokens, revokeToken } from "@/lib/tokens";

export async function GET(req: NextRequest): Promise<NextResponse> {
  const authed = await requireUser(req);
  if (!isAuthed(authed)) return authed;
  return NextResponse.json({ tokens: listTokens(authed.userId) });
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  const authed = await requireUser(req);
  if (!isAuthed(authed)) return authed;
  const body = (await req.json().catch(() => null)) as { name?: unknown } | null;
  const created = createToken(
    authed.userId,
    typeof body?.name === "string" ? body.name : "default",
  );
  // The secret is shown once — store it in the extension or CLI now.
  return NextResponse.json({ token: created }, { status: 201 });
}

export async function DELETE(req: NextRequest): Promise<NextResponse> {
  const authed = await requireUser(req);
  if (!isAuthed(authed)) return authed;
  const body = (await req.json().catch(() => null)) as { id?: unknown } | null;
  if (typeof body?.id !== "string")
    return NextResponse.json({ error: "id required" }, { status: 400 });
  revokeToken(authed.userId, body.id);
  return NextResponse.json({ ok: true });
}
