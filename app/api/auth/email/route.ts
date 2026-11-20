import { scrypt as derive, randomBytes, timingSafeEqual } from "node:crypto";
import { eq, sql } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";
import { getDb } from "@/db";
import { accounts, authAttempts } from "@/db/schema";
import { roleSchema } from "@/lib/account-model";
import { digest, issueSession, landing, originMatches } from "@/lib/account-session";

const email = z.string().trim().email().max(254).transform(value => value.toLowerCase());
const password = z.string().min(1).max(128);
const payload = z.discriminatedUnion("mode", [
  z.object({ mode: z.literal("signin"), email, password, role: roleSchema }),
  z.object({ mode: z.literal("create"), email, password: password.min(12), confirm: password,
    fullName: z.string().trim().min(1).max(150), role: roleSchema, accepted: z.literal(true) }),
]);
const failure = (error: string, status = 400) => NextResponse.json({ error }, { status, headers: { "Cache-Control": "no-store" } });

function passwordKey(value: string, salt: Buffer): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    derive(value, salt, 64, { N: 32768, r: 8, p: 3, maxmem: 64 * 1024 * 1024 }, (error, result) => error ? reject(error) : resolve(result));
  });
}

async function rateLimit(key: string) {
  const bucket = Math.floor(Date.now() / 600_000);
  const [result] = await getDb().insert(authAttempts).values({ key, window: bucket, count: 1 })
    .onConflictDoUpdate({ target: authAttempts.key, set: {
      count: sql`CASE WHEN ${authAttempts.window} = ${bucket} THEN MIN(${authAttempts.count} + 1, 1000) ELSE 1 END`,
      window: bucket,
    } }).returning({ count: authAttempts.count });
  return result.count;
}

export async function POST(request: Request) {
  if (!originMatches(request)) return failure("This sign-in request couldn’t be accepted. Reload and try again.", 403);
  const body = await request.json().catch(() => null);
  const input = payload.safeParse(body);
  if (!input.success) return failure("Enter a valid email address and complete the required fields. New passwords need at least 12 characters.");
  const data = input.data;
  if (data.mode === "create" && data.password !== data.confirm) return failure("Passwords don’t match.");
  try {
    const address = request.headers.get("cf-connecting-ip") || "local";
    const [emailAttempts, addressAttempts] = await Promise.all([
      rateLimit("email:" + await digest(data.email)), rateLimit("address:" + await digest(address)),
    ]);
    if (emailAttempts > 10 || addressAttempts > 40) return failure("Too many attempts. Please wait a few minutes and try again.", 429);
    const db = getDb();
    if (data.mode === "create") {
      const salt = randomBytes(16);
      const hash = await passwordKey(data.password, salt);
      const [account] = await db.insert(accounts).values({
        id: crypto.randomUUID(), email: data.email, fullName: data.fullName,
        passwordHash: "scrypt:" + salt.toString("hex") + ":" + hash.toString("hex"),
        role: data.role, roles: JSON.stringify([data.role]), acceptedAt: new Date().toISOString(),
      }).onConflictDoNothing().returning({ id: accounts.id, role: accounts.role, profileComplete: accounts.profileComplete });
      if (!account) return failure("An account already uses this email. Please sign in.", 409);
      return await issueSession(request, NextResponse.json({ next: landing(account) }), account.id);
    }
    const [account] = await db.select().from(accounts).where(eq(accounts.email, data.email)).limit(1);
    const [algorithm, salt, stored] = account?.passwordHash?.split(":") ?? [];
    const expected = algorithm === "scrypt" && stored ? Buffer.from(stored, "hex") : Buffer.alloc(64);
    const candidate = await passwordKey(data.password, salt ? Buffer.from(salt, "hex") : Buffer.alloc(16));
    if (!account?.passwordHash || expected.length !== candidate.length || !timingSafeEqual(expected, candidate)) return failure("Email or password is incorrect.", 401);
    return await issueSession(request, NextResponse.json({ next: landing(account) }), account.id);
  } catch {
    return failure("Email authentication is unavailable. Check the local database setup and try again.", 503);
  }
}
