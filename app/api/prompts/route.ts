import { and, desc, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getDb } from "@/db";
import { courseWorkspaces, promptHistory } from "@/db/schema";
import { getChatGPTUser } from "@/app/chatgpt-auth";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getChatGPTUser();
  if (!user) return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  const items = await getDb().select().from(promptHistory).where(eq(promptHistory.userId, user.userId)).orderBy(desc(promptHistory.createdAt)).limit(50);
  return NextResponse.json({ items });
}

export async function POST(request: Request) {
  const user = await getChatGPTUser();
  if (!user) return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  const body = await request.json().catch(() => null) as null | { situation?: unknown; title?: unknown; prompt?: unknown; workspaceId?: unknown; inputScore?: unknown };
  const situation = typeof body?.situation === "string" ? body.situation.trim() : "";
  const title = typeof body?.title === "string" ? body.title.trim() : "";
  const prompt = typeof body?.prompt === "string" ? body.prompt.trim() : "";
  const requestedWorkspaceId = typeof body?.workspaceId === "string" ? body.workspaceId : "";
  const inputScore = typeof body?.inputScore === "number" && Number.isFinite(body.inputScore) ? Math.max(0, Math.min(100, Math.round(body.inputScore))) : null;
  if (!situation || !title || !prompt || situation.length > 5000 || title.length > 200 || prompt.length > 20000) return NextResponse.json({ error: "Invalid prompt" }, { status: 400 });
  let workspaceId: string | null = null;
  if (requestedWorkspaceId) {
    const owned = await getDb().select({ id: courseWorkspaces.id }).from(courseWorkspaces).where(and(eq(courseWorkspaces.id, requestedWorkspaceId), eq(courseWorkspaces.userId, user.userId))).limit(1);
    if (owned.length) workspaceId = requestedWorkspaceId;
  }
  const item = { id: crypto.randomUUID(), userId: user.userId, situation, title, prompt, workspaceId, inputScore, createdAt: new Date().toISOString() };
  await getDb().insert(promptHistory).values(item);
  return NextResponse.json({ item }, { status: 201 });
}

export async function DELETE(request: Request) {
  const user = await getChatGPTUser();
  if (!user) return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  const body = await request.json().catch(() => null) as null | { id?: unknown };
  const id = typeof body?.id === "string" ? body.id : "";
  if (!id) return NextResponse.json({ error: "Prompt id required" }, { status: 400 });
  await getDb().delete(promptHistory).where(and(eq(promptHistory.id, id), eq(promptHistory.userId, user.userId)));
  return NextResponse.json({ ok: true });
}
