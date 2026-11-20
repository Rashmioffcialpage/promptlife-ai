import { requireUser } from "../auth";
import ProfileForm from "./profile-form";

export const dynamic = "force-dynamic";

export default async function ProfilePage({ searchParams }: { searchParams: Promise<{ start?: string; error?: string; linked?: string }> }) {
  const user = await requireUser("/profile");
  const query = await searchParams;
  return <ProfileForm userId={user.userId} role={user.role} accountRoles={user.roles} profile={JSON.parse(user.profiles)[user.role] ?? {}}
    onboarding={query.start === "1" && !user.profileComplete} googleLinked={user.googleLinked}
    initialMessage={query.linked === "1" ? "Google is linked to this PromptLife account." : ""}
    initialError={query.error ? (query.error === "link-mismatch" ? "Use the Google account with the same email as this PromptLife account." : "Google couldn’t be linked. Please try again.") : ""} />;
}
