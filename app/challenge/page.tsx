import Challenge from "@/components/promptlife-challenge";
import { requireUser } from "../auth";
export const dynamic = "force-dynamic";
export default async function ChallengePage() {
  await requireUser("/challenge");
  return <Challenge/>;
}
