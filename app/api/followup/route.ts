import { NextRequest, NextResponse } from "next/server";

type FollowUp = { id: string; label: string; placeholder: string };

function hasDeadline(text: string) {
  return /\b(today|tomorrow|tonight|this week|next week|monday|tuesday|wednesday|thursday|friday|saturday|sunday|\d{1,2}[\/-]\d{1,2}|\d+\s*(day|week|hour|minute)s?|deadline|due)\b/i.test(text);
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null) as null | { situation?: unknown };
  const situation = typeof body?.situation === "string" ? body.situation.trim().slice(0, 5000) : "";
  if (!situation) return NextResponse.json({ error: "Describe your situation" }, { status: 400 });

  const text = situation.toLowerCase();
  const questions: FollowUp[] = [];
  const isAcademic = /exam|study|quiz|class|course|assignment|homework/.test(text);
  const isCareer = /job|resume|interview|career|application|recruiter/.test(text);
  const isResearch = /paper|research|dataset|experiment|literature|thesis/.test(text);
  const isCommunication = /email|professor|message|team|presentation|meeting/.test(text);
  const hasOutput = /plan|email|message|outline|summary|explain|compare|review|prepare|write|draft|questions|resume|schedule|checklist/.test(text);
  const hasConstraints = /without|must|only|limit|part.time|work|available|hours?|budget|format|tone|level|beginner|advanced/.test(text);

  if (!hasOutput && situation.split(/\s+/).length < 22) questions.push({ id: "outcome", label: "What would you like to have at the end?", placeholder: "For example: a study plan, email draft, explanation, or checklist" });
  if ((isAcademic || /plan|schedule|prepare/.test(text)) && !hasDeadline(text)) questions.push({ id: "deadline", label: "When do you need this?", placeholder: "For example: Friday afternoon or within two weeks" });
  if (isCareer && !/role|position|engineer|developer|analyst|scientist|company/.test(text)) questions.push({ id: "target", label: "What role or opportunity are you targeting?", placeholder: "For example: entry-level ML engineer internship" });
  if (isCommunication && !/to my|professor|manager|classmate|team|recruiter|audience|client/.test(text)) questions.push({ id: "audience", label: "Who is this for?", placeholder: "For example: my professor or a recruiter" });
  if (isResearch && !/paper|title|topic|dataset|method|notes|abstract|pdf/.test(text.replace("research", ""))) questions.push({ id: "source", label: "What topic or material should the prompt use?", placeholder: "Add the paper, topic, dataset, or notes you already have" });
  if (!hasConstraints && questions.length < 2 && situation.split(/\s+/).length < 35) questions.push({ id: "constraint", label: "Is there one important constraint to respect?", placeholder: "For example: 30 minutes, beginner level, or do not write the final answer" });

  return NextResponse.json({ questions: questions.slice(0, 3) });
}
