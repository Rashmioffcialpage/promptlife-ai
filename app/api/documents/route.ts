import { env } from "cloudflare:workers";
import { and, desc, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getChatGPTUser } from "@/app/chatgpt-auth";
import { getDb } from "@/db";
import { documentUploads } from "@/db/schema";

export const dynamic = "force-dynamic";
const MAX_BYTES = 10 * 1024 * 1024;
const allowed = new Set(["application/pdf", "application/vnd.openxmlformats-officedocument.wordprocessingml.document", "text/plain", "text/markdown", "text/csv"]);

async function extractFileText(file: File) {
  const buffer = await file.arrayBuffer();
  const extension = file.name.split(".").pop()?.toLowerCase();
  if (file.type === "application/pdf" || extension === "pdf") {
    const { extractText, getDocumentProxy } = await import("unpdf");
    const pdf = await getDocumentProxy(new Uint8Array(buffer));
    const result = await extractText(pdf, { mergePages: true });
    return String(result.text || "");
  }
  if (file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" || extension === "docx") {
    const mammoth = await import("mammoth");
    const result = await mammoth.extractRawText({ arrayBuffer: buffer });
    return result.value;
  }
  return new TextDecoder().decode(buffer);
}

export async function GET() {
  const user = await getChatGPTUser();
  if (!user) return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  const items = await getDb().select({ id: documentUploads.id, name: documentUploads.name, contentType: documentUploads.contentType, size: documentUploads.size, workspaceId: documentUploads.workspaceId, createdAt: documentUploads.createdAt }).from(documentUploads).where(eq(documentUploads.userId, user.userId)).orderBy(desc(documentUploads.createdAt)).limit(30);
  return NextResponse.json({ items });
}

export async function POST(request: Request) {
  const user = await getChatGPTUser();
  if (!user) return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  const form = await request.formData();
  const file = form.get("file");
  const workspaceId = typeof form.get("workspaceId") === "string" && form.get("workspaceId") !== "none" ? String(form.get("workspaceId")) : null;
  const extension = file instanceof File ? file.name.split(".").pop()?.toLowerCase() : "";
  if (!(file instanceof File) || (!allowed.has(file.type) && !["pdf", "docx", "txt", "md", "csv"].includes(extension || "")) || file.size > MAX_BYTES) return NextResponse.json({ error: "Use a PDF, DOCX, TXT, MD, or CSV file up to 10 MB" }, { status: 400 });
  let extractedText = "";
  try { extractedText = (await extractFileText(file)).replace(/\0/g, " ").trim().slice(0, 60000); } catch { return NextResponse.json({ error: "We could not read text from this file" }, { status: 422 }); }
  if (!extractedText) return NextResponse.json({ error: "No readable text was found in this file" }, { status: 422 });
  const id = crypto.randomUUID();
  const objectKey = `${user.userId}/${id}/${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
  await env.BUCKET.put(objectKey, await file.arrayBuffer(), { httpMetadata: { contentType: file.type } });
  const item = { id, userId: user.userId, workspaceId, name: file.name.slice(0, 200), contentType: file.type || "application/octet-stream", size: String(file.size), objectKey, extractedText, createdAt: new Date().toISOString() };
  await getDb().insert(documentUploads).values(item);
  return NextResponse.json({ item: { id, name: item.name, contentType: item.contentType, size: item.size, workspaceId, createdAt: item.createdAt } }, { status: 201 });
}

export async function DELETE(request: Request) {
  const user = await getChatGPTUser();
  if (!user) return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  const body = await request.json().catch(() => null) as null | { id?: unknown };
  const id = typeof body?.id === "string" ? body.id : "";
  const owned = await getDb().select({ objectKey: documentUploads.objectKey }).from(documentUploads).where(and(eq(documentUploads.id, id), eq(documentUploads.userId, user.userId))).limit(1);
  if (!owned.length) return NextResponse.json({ error: "File not found" }, { status: 404 });
  await env.BUCKET.delete(owned[0].objectKey);
  await getDb().delete(documentUploads).where(and(eq(documentUploads.id, id), eq(documentUploads.userId, user.userId)));
  return NextResponse.json({ ok: true });
}
