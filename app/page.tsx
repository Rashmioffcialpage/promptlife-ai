import { UserRound } from "lucide-react";
import Home from "@/components/promptlife-home";
import { SignedOutHome } from "@/components/signed-out-home";
import { getUser } from "./auth";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const user = await getUser();
  if (!user) return <SignedOutHome/>;
  const account = <a href="/account" className="account-link"><UserRound size={15} aria-hidden="true"/>Account</a>;
  return <Home account={account} userId={user.userId}/>;
}
