import { NextResponse } from "next/server";
import { cookieOptions, originMatches, revokeSession, sessionCookie } from "@/lib/account-session";
import { flowCookie } from "@/lib/google-auth";

export async function POST(request: Request) {
  if (!originMatches(request)) return new NextResponse(null, { status: 403 });
  await revokeSession();
  const response = new NextResponse(null, { status: 303, headers: { Location: "/sign-in", "Cache-Control": "no-store" } });
  for (const name of [sessionCookie, flowCookie]) response.cookies.set(name, "", { ...cookieOptions, maxAge: 0 });
  return response;
}
