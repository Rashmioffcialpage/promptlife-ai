import { cookies } from "next/headers";
import type { NextResponse } from "next/server";
import { and, eq, gt, lt } from "drizzle-orm";
import { getDb } from "@/db";
import { accounts, accountSessions } from "@/db/schema";
import { roleSchema, type Role } from "./account-model";

export const sessionCookie = "promptlife_session";
export const cookieOptions = { httpOnly: true, sameSite: "lax", path: "/" } as const;
const duration = 60 * 60 * 24 * 7;

export function originMatches(request: Request) {
  return request.headers.get("origin") === new URL(request.url).origin;
}

export async function digest(value: string) {
  const bytes = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return Array.from(new Uint8Array(bytes), byte => byte.toString(16).padStart(2, "0")).join("");
}

export async function getAccount() {
  const value = (await cookies()).get(sessionCookie)?.value;
  if (!value || !/^[\da-f]{64}$/.test(value)) return null;
  const [account] = await getDb().select({
    userId: accounts.id, email: accounts.email, fullName: accounts.fullName, role: accounts.role,
    roles: accounts.roles, profiles: accounts.profiles, profileComplete: accounts.profileComplete,
    googleLinked: accounts.googleSubject,
  }).from(accountSessions)
    .innerJoin(accounts, eq(accounts.id, accountSessions.accountId))
    .where(and(eq(accountSessions.tokenHash, await digest(value)), gt(accountSessions.expires, Date.now()))).limit(1);
  if (!account) return null;
  const role = roleSchema.parse(account.role);
  const roles = roleSchema.array().parse(JSON.parse(account.roles));
  return { ...account, role, roles, googleLinked: Boolean(account.googleLinked) };
}

export async function issueSession(request: Request, response: NextResponse, id: string) {
  const db = getDb();
  const value = crypto.randomUUID().replaceAll("-", "") + crypto.randomUUID().replaceAll("-", "");
  await db.delete(accountSessions).where(lt(accountSessions.expires, Date.now()));
  await revokeSession();
  await db.insert(accountSessions).values({ tokenHash: await digest(value), accountId: id, expires: Date.now() + duration * 1000 });
  response.cookies.set(sessionCookie, value, { ...cookieOptions, maxAge: duration, secure: new URL(request.url).protocol === "https:" });
  return response;
}

export async function revokeSession() {
  const value = (await cookies()).get(sessionCookie)?.value;
  if (value && /^[\da-f]{64}$/.test(value)) await getDb().delete(accountSessions).where(eq(accountSessions.tokenHash, await digest(value)));
}

export function landing(account: { role: string; profileComplete: boolean }) {
  return account.profileComplete ? "/dashboard/" + (account.role as Role).toLowerCase() : "/profile?start=1";
}
