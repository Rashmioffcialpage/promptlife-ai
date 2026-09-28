import { ArrowLeft, LogOut, ShieldCheck, UserRound } from "lucide-react";
import { desc, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { courseWorkspaces, promptHistory } from "@/db/schema";
import { chatGPTSignOutPath, requireChatGPTUser } from "../chatgpt-auth";
import { HistoryClient } from "./history-client";

export const dynamic = "force-dynamic";

export default async function AccountPage() {
  const user = await requireChatGPTUser("/account");
  const name = user.fullName || user.email.split("@")[0];
  const items = await getDb().select().from(promptHistory).where(eq(promptHistory.userId, user.userId)).orderBy(desc(promptHistory.createdAt)).limit(50);
  const workspaces = await getDb().select().from(courseWorkspaces).where(eq(courseWorkspaces.userId, user.userId)).orderBy(desc(courseWorkspaces.createdAt));

  return (
    <main className="account-page">
      <header className="account-header">
        <a href="/" className="account-back"><ArrowLeft size={16}/>Back to PromptLife</a>
      </header>
      <section className="account-card account-profile dashboard-profile">
        <span className="account-avatar"><UserRound size={26}/></span>
        <p className="section-kicker">Student account</p>
        <h2>Welcome, {name}</h2>
        <p className="account-email">{user.email}</p>
        <div className="account-note"><ShieldCheck size={18}/><div><b>Your account is connected securely.</b><span>PromptLife uses your ChatGPT sign-in. You do not need another password.</span></div></div>
        <a href={chatGPTSignOutPath("/")} target="_top" className="account-signout"><LogOut size={16}/>Sign out</a>
      </section>
      <HistoryClient initialItems={items} initialWorkspaces={workspaces}/>
    </main>
  );
}
