import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { SignedOutHome } from "@/components/signed-out-home";
import { getUser } from "../auth";
import { landing } from "@/lib/account-session";

export const metadata: Metadata = { title: "Sign in | PromptLife AI" };
export const dynamic = "force-dynamic";

const messages: Record<string, string> = {
  cancelled: "Google sign-in was cancelled.",
  expired: "This sign-in request expired. Please try again.",
  failed: "Google couldn’t sign you in. Please try again.",
  "link-required": "An account already uses this email. Sign in with your password and link Google from your profile.",
  "signup-required": "This Google account isn’t registered. Select Create Account to sign up with Google.",
};

export default async function SignInPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const user = await getUser();
  if (user) redirect(landing(user));
  const { error } = await searchParams;
  return <SignedOutHome initialOpen error={error && Object.hasOwn(messages, error) ? messages[error] : undefined}/>;
}
