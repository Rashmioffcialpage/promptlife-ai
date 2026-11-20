import { env } from "cloudflare:workers";
import { z } from "zod";
import { roleSchema } from "./account-model";

export const flowCookie = "promptlife_google_flow";

export function googleConfig() {
  const settings = env as unknown as Record<string, string | undefined>;
  const id = settings.GOOGLE_CLIENT_ID;
  const secret = settings.GOOGLE_CLIENT_SECRET;
  const key = settings.PROMPTLIFE_SESSION_SECRET;
  const origin = settings.PROMPTLIFE_LOCAL_ORIGIN || "http://localhost:5173";
  if (!id || !secret || !key || key.length < 32 || !/^http:\/\/(localhost|127\.0\.0\.1):\d+$/.test(origin)) return null;
  return { id, secret, key, origin, callback: origin + "/api/auth/google/callback" };
}

export function encode(bytes: Uint8Array) {
  return btoa(String.fromCharCode(...bytes)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function decode(value: string) {
  return Uint8Array.from(atob(value.replace(/-/g, "+").replace(/_/g, "/")), c => c.charCodeAt(0));
}

const encoder = new TextEncoder();
async function signingKey(secret: string) {
  return crypto.subtle.importKey("raw", encoder.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign", "verify"]);
}

export async function seal(data: object, secret: string) {
  const payload = encode(encoder.encode(JSON.stringify(data)));
  const signature = await crypto.subtle.sign("HMAC", await signingKey(secret), encoder.encode(payload));
  return payload + "." + encode(new Uint8Array(signature));
}

export async function unseal(value: string | undefined, secret: string): Promise<unknown> {
  if (!value || value.length > 4096) return null;
  const [payload, signature, extra] = value.split(".");
  if (!payload || !signature || extra !== undefined) return null;
  try {
    if (!await crypto.subtle.verify("HMAC", await signingKey(secret), decode(signature), encoder.encode(payload))) return null;
    return JSON.parse(new TextDecoder().decode(decode(payload)));
  } catch { return null; }
}

export const flowSchema = z.object({
  state: z.string(), verifier: z.string(), nonce: z.string(), role: roleSchema,
  mode: z.enum(["signin", "create", "link"]), linkId: z.string().optional(), expires: z.number(),
});

export async function googleProfile(config: NonNullable<ReturnType<typeof googleConfig>>, code: string, flow: z.infer<typeof flowSchema>) {
  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ code, grant_type: "authorization_code", client_id: config.id, client_secret: config.secret, redirect_uri: config.callback, code_verifier: flow.verifier }),
    redirect: "error",
  });
  if (!response.ok) throw new Error("Google token exchange failed");

  // Google permits relying on TLS for ID tokens received directly from its token endpoint.
  const { id_token } = z.object({ id_token: z.string().max(10000) }).parse(await response.json());
  const parts = id_token.split(".");
  if (parts.length !== 3) throw new Error("Invalid Google ID token");
  const claims = z.object({
    sub: z.string().min(1).max(255), email: z.string().email().max(254), email_verified: z.literal(true),
    name: z.string().optional(), iss: z.enum(["https://accounts.google.com", "accounts.google.com"]),
    aud: z.literal(config.id), nonce: z.literal(flow.nonce), exp: z.number(),
  }).parse(JSON.parse(new TextDecoder().decode(decode(parts[1]))));
  if (claims.exp * 1000 <= Date.now()) throw new Error("Expired Google ID token");
  return {
    subject: claims.sub, email: claims.email.toLowerCase(), fullName: claims.name?.slice(0, 150) || claims.email.split("@")[0],
  };
}
