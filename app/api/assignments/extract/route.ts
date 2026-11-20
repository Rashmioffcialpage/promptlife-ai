import { NextResponse } from "next/server";
import { getUser } from "@/app/auth";
import { extractFileText } from "@/lib/document-text";

export async function POST(request: Request) {
  if (!await getUser()) return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  const length = Number(request.headers.get("content-length"));
  if (length > 5_050_000) return NextResponse.json({ error: "Choose a file under 5 MB." }, { status: 413 });
  const form = await request.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File) || file.size > 5_000_000 || !/\.(pdf|docx|txt|md|csv)$/i.test(file.name)) {
    return NextResponse.json({ error: "Choose a PDF, DOCX, TXT, Markdown, or CSV file under 5 MB." }, { status: 400 });
  }
  try {
    const text = (await extractFileText(file)).replace(/\0/g, " ").trim();
    if (!text) return NextResponse.json({ error: "There’s no readable text in this file. Try a text-based file or paste the instructions." }, { status: 422 });
    return NextResponse.json({ text: text.slice(0, 16000), truncated: text.length > 16000 });
  } catch {
    return NextResponse.json({ error: "This file couldn’t be read. Try another file or paste the instructions." }, { status: 422 });
  }
}
