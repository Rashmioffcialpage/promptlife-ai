import { redirect } from "next/navigation";
import { ArrowLeft, LogOut, UserRound } from "lucide-react";
import { desc, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { courseWorkspaces, promptHistory } from "@/db/schema";
import { routeForRole } from "@/lib/account-model";
import { requireUser } from "@/app/auth";
import { HistoryClient } from "@/app/account/history-client";

export const dynamic = "force-dynamic";
const dashboardCopy = {
  Student: "Plan assignments, prepare prompts, and review your saved work.",
  Professor: "Organize coursework guidance and share assignment templates.",
  Researcher: "Organize research prompts, reference files, and project workspaces.",
};

export default async function DashboardPage({ params }: { params: Promise<{ role: string }> }) {
  const user = await requireUser("/account");
  if (!user.profileComplete) redirect("/profile?start=1");
  if ((await params).role !== user.role.toLowerCase()) redirect(routeForRole(user.role));
  const db = getDb();
  const [items, workspaces] = await Promise.all([
    db.select().from(promptHistory).where(eq(promptHistory.userId, user.userId)).orderBy(desc(promptHistory.createdAt)).limit(50),
    db.select().from(courseWorkspaces).where(eq(courseWorkspaces.userId, user.userId)).orderBy(desc(courseWorkspaces.createdAt)),
  ]);
  return <main className="account-page">
    <header className="account-header"><a href="/" className="account-back"><ArrowLeft size={16}/>Back to PromptLife</a></header>
    <section className="account-card account-profile dashboard-profile">
      <span className="account-avatar"><UserRound size={26} aria-hidden="true"/></span>
      <div><h1 className="text-xl">{user.role} Dashboard</h1><p>Welcome, {user.fullName}</p><p>{dashboardCopy[user.role]}</p></div>
      <div className="auth-dashboard-links"><a href="/assignments">Assignments</a><a href="/profile">{user.roles.length > 1 ? "Profile & change role" : "Profile"}</a></div>
      <form action="/api/auth/sign-out" method="post"><button className="account-signout" type="submit"><LogOut size={16}/>Sign out</button></form>
    </section>
    <HistoryClient userId={user.userId} initialItems={items} initialWorkspaces={workspaces}/>
  </main>;
}
