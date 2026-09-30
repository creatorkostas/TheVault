import { NextResponse } from "next/server";
import { disabledTypes } from "@/lib/config";

export async function GET(): Promise<NextResponse> {
  return NextResponse.json({ disabledTypes: disabledTypes() });
}
