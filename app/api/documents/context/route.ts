import { and, eq, inArray } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getChatGPTUser } from "@/app/chatgpt-auth";
import { getDb } from "@/db";
import { documentUploads } from "@/db/schema";

export async function POST(request: Request) {
  const user = await getChatGPTUser();
  if (!user) return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  const body = await request.json().catch(() => null) as null | { ids?: unknown };
  const ids = Array.isArray(body?.ids) ? body.ids.filter((id): id is string => typeof id === "string").slice(0, 3) : [];
  if (!ids.length) return NextResponse.json({ context: "" });
  const files = await getDb().select({ name: documentUploads.name, extractedText: documentUploads.extractedText }).from(documentUploads).where(and(eq(documentUploads.userId, user.userId), inArray(documentUploads.id, ids)));
  const context = files.map((file) => `Reference: ${file.name}\n${String(file.extractedText || "").slice(0, 12000)}`).join("\n\n").slice(0, 30000);
  return NextResponse.json({ context });
}
