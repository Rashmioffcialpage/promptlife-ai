import { redirect } from "next/navigation";
import { getAccount } from "@/lib/account-session";

export const getUser = getAccount;

export async function requireUser(returnTo: string) {
  const user = await getAccount();
  if (user) return user;
  redirect("/sign-in?" + new URLSearchParams({ return_to: returnTo }));
}
