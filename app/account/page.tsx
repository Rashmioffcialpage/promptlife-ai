import { redirect } from "next/navigation";
import { landing } from "@/lib/account-session";
import { requireUser } from "../auth";
export const dynamic = "force-dynamic";
export default async function AccountPage() {
  redirect(landing(await requireUser("/account")));
}
