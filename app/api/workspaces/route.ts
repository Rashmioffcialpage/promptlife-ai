import { and, desc, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getChatGPTUser } from "@/app/chatgpt-auth";
import { getDb } from "@/db";
import { courseWorkspaces, promptHistory } from "@/db/schema";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getChatGPTUser();
  if (!user) return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  const items = await getDb().select().from(courseWorkspaces).where(eq(courseWorkspaces.userId, user.userId)).orderBy(desc(courseWorkspaces.createdAt));
  return NextResponse.json({ items });
}

export async function POST(request: Request) {
  const user = await getChatGPTUser();
  if (!user) return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  const body = await request.json().catch(() => null) as null | { name?: unknown; type?: unknown };
  const name = typeof body?.name === "string" ? body.name.trim() : "";
  const type = typeof body?.type === "string" ? body.type : "";
  if (!name || name.length > 100 || !["course", "research", "career"].includes(type)) return NextResponse.json({ error: "Invalid workspace" }, { status: 400 });
  const item = { id: crypto.randomUUID(), userId: user.userId, name, type, createdAt: new Date().toISOString() };
  await getDb().insert(courseWorkspaces).values(item);
  return NextResponse.json({ item }, { status: 201 });
}

export async function DELETE(request: Request) {
  const user = await getChatGPTUser();
  if (!user) return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  const body = await request.json().catch(() => null) as null | { id?: unknown };
  const id = typeof body?.id === "string" ? body.id : "";
  if (!id) return NextResponse.json({ error: "Workspace id required" }, { status: 400 });
  const db = getDb();
  await db.update(promptHistory).set({ workspaceId: null }).where(and(eq(promptHistory.userId, user.userId), eq(promptHistory.workspaceId, id)));
  await db.delete(courseWorkspaces).where(and(eq(courseWorkspaces.id, id), eq(courseWorkspaces.userId, user.userId)));
  return NextResponse.json({ ok: true });
}
