import { and, eq, exists, isNull } from "drizzle-orm";
import { type NextRequest, NextResponse } from "next/server";
import { getDb } from "@/db";
import { accounts, courseWorkspaces, documentUploads, promptHistory } from "@/db/schema";
import { cookieOptions, getAccount, issueSession, landing } from "@/lib/account-session";
import { flowCookie, flowSchema, googleConfig, googleProfile, unseal } from "@/lib/google-auth";

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const config = googleConfig();
  const flow = flowSchema.safeParse(config && await unseal(request.cookies.get(flowCookie)?.value, config.key));
  const finish = (path: string) => {
    const response = NextResponse.redirect(new URL(path, config?.origin ?? url.origin));
    response.headers.set("Cache-Control", "no-store");
    response.headers.set("Referrer-Policy", "no-referrer");
    response.cookies.set(flowCookie, "", { ...cookieOptions, maxAge: 0 });
    return response;
  };
  const fail = (error: string) => finish((flow.success && flow.data.mode === "link" ? "/profile?" : "/sign-in?") + new URLSearchParams({ error }));
  if (!config || config.origin !== url.origin || !flow.success || flow.data.expires <= Date.now() || flow.data.state !== url.searchParams.get("state")) return fail("expired");
  if (url.searchParams.get("error") === "access_denied") return fail("cancelled");
  const code = url.searchParams.get("code");
  if (!code) return fail("failed");
  try {
    const profile = await googleProfile(config, code, flow.data);
    const db = getDb();
    const [known] = await db.select().from(accounts).where(eq(accounts.googleSubject, profile.subject)).limit(1);
    if (flow.data.mode === "link") {
      const user = await getAccount();
      if (!user || user.userId !== flow.data.linkId || user.email !== profile.email || (known && known.id !== user.userId)) return fail("link-mismatch");
      if (known?.id === user.userId) return finish("/profile?linked=1");
      const legacyOwner = "google:" + profile.subject;
      const ownerIsLinked = exists(db.select({ id: accounts.id }).from(accounts)
        .where(and(eq(accounts.id, user.userId), eq(accounts.googleSubject, profile.subject))));
      const [rows] = await db.batch([
        db.update(accounts).set({ googleSubject: profile.subject })
          .where(and(eq(accounts.id, user.userId), isNull(accounts.googleSubject))).returning({ id: accounts.id }),
        db.update(promptHistory).set({ userId: user.userId }).where(and(eq(promptHistory.userId, legacyOwner), ownerIsLinked)),
        db.update(courseWorkspaces).set({ userId: user.userId }).where(and(eq(courseWorkspaces.userId, legacyOwner), ownerIsLinked)),
        db.update(documentUploads).set({ userId: user.userId }).where(and(eq(documentUploads.userId, legacyOwner), ownerIsLinked)),
      ]);
      return rows.length ? finish("/profile?linked=1") : fail("link-mismatch");
    }
    if (known) return await issueSession(request, finish(landing(known)), known.id);
    const [existing] = await db.select({ id: accounts.id }).from(accounts).where(eq(accounts.email, profile.email)).limit(1);
    if (existing) return fail("link-required");
    if (flow.data.mode !== "create") return fail("signup-required");
    const [account] = await db.insert(accounts).values({
      id: "google:" + profile.subject, email: profile.email, fullName: profile.fullName,
      googleSubject: profile.subject, role: flow.data.role, roles: JSON.stringify([flow.data.role]),
      acceptedAt: new Date().toISOString(),
    }).onConflictDoNothing().returning();
    if (!account) return fail("link-required");
    return await issueSession(request, finish(landing(account)), account.id);
  } catch {
    return fail("failed");
  }
}
