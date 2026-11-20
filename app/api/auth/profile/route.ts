import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";
import { getDb } from "@/db";
import { accounts } from "@/db/schema";
import { fields, roleSchema, routeForRole } from "@/lib/account-model";
import { getAccount, originMatches } from "@/lib/account-session";

const body = z.discriminatedUnion("action", [
  z.object({ action: z.literal("save"), details: z.record(z.string().trim().max(300)) }),
  z.object({ action: z.literal("skip") }),
  z.object({ action: z.enum(["add", "switch"]), role: roleSchema }),
]);
const fail = (error: string, status = 400) => NextResponse.json({ error }, { status });

export async function POST(request: Request) {
  if (!originMatches(request)) return fail("This request couldn’t be accepted.", 403);
  const account = await getAccount();
  if (!account) return fail("Please sign in again.", 401);
  const input = body.safeParse(await request.json().catch(() => null));
  if (!input.success) return fail("Review the profile fields and try again.");
  const data = input.data;
  const db = getDb();
  let next = routeForRole(account.role);
  let values: Partial<typeof accounts.$inferInsert>;
  if (data.action === "add" || data.action === "switch") {
    const exists = account.roles.includes(data.role);
    if (data.action === "switch" && !exists) return fail("Add this role to your profile first.");
    values = data.action === "add" ? { roles: JSON.stringify([...new Set([...account.roles, data.role])]) } : { role: data.role };
    next = data.action === "add" ? "/profile" : routeForRole(data.role);
  } else if (data.action === "save") {
    const details = Object.fromEntries(Object.keys(fields[account.role]).map(key => [key, data.details[key] ?? ""]));
    if (details.graduation && !z.string().date().safeParse(details.graduation).success) return fail("Enter a valid graduation date.");
    if (details.orcid && !/^\d{4}-\d{4}-\d{4}-\d{3}[\dX]$/i.test(details.orcid)) return fail("Enter an ORCID in the format 0000-0000-0000-000X.");
    const profiles = JSON.parse(account.profiles);
    values = { profiles: JSON.stringify({ ...profiles, [account.role]: details }), profileComplete: true };
  } else {
    values = { profileComplete: true };
  }
  const [saved] = await db.update(accounts).set(values)
    .where(and(eq(accounts.id, account.userId), eq(accounts.role, account.role), eq(accounts.roles, JSON.stringify(account.roles)), eq(accounts.profiles, account.profiles)))
    .returning({ id: accounts.id });
  return saved ? NextResponse.json({ next }) : fail("Your profile changed. Reload and try again.", 409);
}
