import type { Metadata } from "next";
import { requireUser } from "@/app/auth";
import AssignmentWorkspace from "./workspace";

export const metadata: Metadata = { title: "Assignment Workspace | PromptLife AI" };

export default async function AssignmentsPage() {
  const user = await requireUser("/assignments");
  return <AssignmentWorkspace userId={user.userId} />;
}
