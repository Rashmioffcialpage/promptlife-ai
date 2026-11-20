import { NextResponse } from "next/server";
import { z } from "zod";
import { roleSchema } from "@/lib/account-model";
import { cookieOptions, getAccount, originMatches } from "@/lib/account-session";
import { encode, flowCookie, googleConfig, seal } from "@/lib/google-auth";

const input = z.object({ mode: z.enum(["signin", "create", "link"]), role: roleSchema, accepted: z.boolean().optional() });

export async function POST(request: Request) {
  const fail = (error: string, status: number) => NextResponse.json({ error }, { status, headers: { "Cache-Control": "no-store" } });
  if (!originMatches(request)) return fail("This sign-in request couldn’t be accepted.", 403);
  const config = googleConfig();
  if (!config) return fail("Google sign-in is not configured yet.", 503);
  if (new URL(request.url).origin !== config.origin) return fail("Open the local origin registered for Google sign-in.", 400);
  const data = input.safeParse(await request.json().catch(() => null));
  if (!data.success || (data.data.mode === "create" && !data.data.accepted)) return fail("Choose a role and agree to the terms before creating an account.", 400);
  const account = data.data.mode === "link" ? await getAccount() : null;
  if (data.data.mode === "link" && !account) return fail("Sign in to your PromptLife account before linking Google.", 401);
  const random = () => encode(crypto.getRandomValues(new Uint8Array(32)));
  const flow = {
    state: random(), nonce: random(), verifier: random(), role: data.data.role, mode: data.data.mode,
    linkId: account?.userId, expires: Date.now() + 600_000,
  };
  const challenge = encode(new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(flow.verifier))));
  const authorize = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  authorize.search = new URLSearchParams({
    client_id: config.id, redirect_uri: config.callback, response_type: "code",
    scope: "openid email profile", state: flow.state, nonce: flow.nonce,
    code_challenge: challenge, code_challenge_method: "S256", prompt: "select_account",
  }).toString();
  const response = NextResponse.json({ next: authorize.href }, { headers: { "Cache-Control": "no-store" } });
  response.cookies.set(flowCookie, await seal(flow, config.key), { ...cookieOptions, maxAge: 600 });
  return response;
}
