import { z } from "zod";

export const types = ["Essay", "Research Paper", "Presentation", "Coding Project", "Other"] as const;
export const permissions = ["Not confirmed", "Allowed", "Allowed with limits", "Not allowed"] as const;
export const helpOptions = ["Understand the instructions", "Organize my time", "Plan research", "Verify sources", "Document AI use"] as const;

export const assignmentBrief = z.object({
  title: z.string().trim().min(1).max(140),
  course: z.string().trim().min(1).max(100),
  due: z.string().date(),
  type: z.enum(types),
  instructions: z.string().trim().min(10).max(16000),
  permission: z.enum(permissions),
  rules: z.string().trim().max(3000),
  help: z.array(z.enum(helpOptions)).min(1).max(helpOptions.length),
});
export type Brief = z.infer<typeof assignmentBrief>;

export const instructorShare = z.object({
  version: z.literal(1),
  instructor: z.string().trim().min(1).max(100),
  brief: assignmentBrief,
});

const recordSchema = z.object({
  time: z.string().datetime(),
  request: z.string(),
  assistance: z.string(),
  sources: z.string(),
  verify: z.string(),
});

const planSchema = z.object({
  interpretation: z.string(),
  steps: z.array(z.string()).min(1),
  research: z.array(z.string()),
  questions: z.array(z.object({ whom: z.string(), question: z.string() })),
  sourceChecks: z.array(z.string()),
  useChecks: z.array(z.string()),
});

export const assignmentEntry = z.object({
  id: z.string(), brief: assignmentBrief, instructor: z.string().nullable(), plan: planSchema,
  completed: z.array(z.number().int().nonnegative()), record: recordSchema,
});
export type Assignment = z.infer<typeof assignmentEntry>;
export type UseRecord = Assignment["record"];
export type Plan = Assignment["plan"];

const sources = [
  "LIU Writing Center — https://www.liu.edu/student-success/learning-center/writing-center",
  "LIU Libraries — https://liu.edu/University-Library",
];

const approaches: Record<Brief["type"], { work: string; questions: [string, string] }> = {
  Essay: { work: "Form a tentative thesis and outline how each paragraph will support it.", questions: ["What argument could I defend with the available evidence?", "What counterargument or alternative explanation should I address?"] },
  "Research Paper": { work: "Define the scope and compare findings and limitations across your sources.", questions: ["Which population, setting, or time period makes this topic manageable?", "Where do the studies agree, and what might explain differences?"] },
  Presentation: { work: "Choose the main takeaway, outline your slides, and rehearse within the time limit.", questions: ["What does this audience already know?", "Which example or visual would most clearly support my main point?"] },
  "Coding Project": { work: "Write acceptance checks before building. Test a small working version, then document how to run it.", questions: ["Which inputs and edge cases should the program support?", "What test cases would show that my implementation meets the requirements?"] },
  Other: { work: "Sketch the deliverable and choose a way to check each requirement.", questions: ["What part of the task would benefit most from a credible source?", "What would a strong and verifiable final result look like?"] },
};

function planFor(brief: Brief): Plan {
  const approach = approaches[brief.type];
  const excerpts = brief.instructions.split(/\n+|(?<=[.!?])\s+/).map(line => line.trim()).filter(Boolean);
  const relevant = excerpts.filter(line => /\b(submit|write|prepare|present|implement|deliver|include|cite|compare|create|build|analyze|test|explain|design|required|must)\b/i.test(line));
  const excerpt = (relevant.length ? relevant : excerpts).slice(0, 3).map(line => line.slice(0, 340)).join("\n");
  const restricted = brief.permission === "Not allowed" || brief.permission === "Not confirmed";
  const permissionCheck = brief.permission === "Not allowed"
    ? "The rules you entered say AI use is prohibited. Do the assignment independently and ask your instructor before using any AI-generated guidance."
    : brief.permission === "Not confirmed"
      ? "Ask your professor which uses are allowed before relying on AI assistance."
      : "Check each intended use against the instructor’s rules, including any disclosure requirement.";
  const help = new Set(brief.help);
  return {
    interpretation: `Plan your ${brief.type.toLowerCase()} for ${brief.course} by the date you entered. Start with these excerpts from the instructions, then check the full brief for scope, formatting, and how to submit.\n\n${excerpt}`,
    steps: [
      "Read the full brief and identify what you need to submit. Ask about unclear requirements.",
      ...(help.has("Organize my time") ? ["Work backward from the due date. Reserve time for feedback, revision, and submission."] : []),
      ...(help.has("Plan research") ? ["Write a focused question and list keywords before searching library resources or documentation."] : []),
      approach.work,
      "Complete the work yourself and check each requirement against your draft or implementation.",
      "Verify sources, record permitted AI assistance when required, and review the final submission.",
    ],
    research: approach.questions,
    questions: [
      { whom: "Professor", question: restricted ? "Can you confirm which uses of AI are permitted and what I should document?" : "Could you confirm the main criteria and the disclosure format you expect?" },
      { whom: "Librarian", question: brief.type === "Coding Project" ? "Where can I find trustworthy documentation or examples appropriate for this topic?" : "Which databases and keywords fit my topic, and how can I find the original publications?" },
      { whom: "Writing Center tutor", question: help.has("Understand the instructions") ? "Can we check whether my outline addresses the brief before I start drafting?" : "Can we review whether my reasoning is clear and my sources are integrated and cited?" },
    ],
    sourceChecks: [
      "Open each original source. Confirm its author, title, date, and publication details.",
      "Check the exact passage or evidence behind each claim. Remove citations you cannot verify.",
      help.has("Verify sources") ? "Save a page number, section, or stable link so you can retrace each claim." : "Check your citation style and distinguish your ideas from the source’s.",
    ],
    useChecks: [
      permissionCheck,
      "Write your own analysis and review all claims, citations, or code before submitting.",
      "Keep student records, participant information, and other confidential material out of AI tools.",
      help.has("Document AI use") ? "Review the AI Use Record and disclose the assistance you actually used in the required format." : "Ask which AI-use details need to be disclosed.",
    ],
  };
}

export function createAssignment(brief: Brief, instructor: string | null): Assignment {
  const plan = planFor(brief);
  return {
    id: crypto.randomUUID(), brief, instructor, plan, completed: [],
    record: {
      time: new Date().toISOString(),
      request: [brief.title + " (" + brief.course + ")", brief.instructions, "Help requested: " + brief.help.join(", "), "AI permission: " + brief.permission, brief.rules].filter(Boolean).join("\n\n"),
      assistance: "PromptLife used rules to prepare planning guidance. No AI model was called.\n\n" + plan.interpretation + "\n\nWork plan\n" + plan.steps.map((step, index) => `${index + 1}. ${step}`).join("\n") + "\n\nResearch questions\n" + plan.research.join("\n") + "\n\nQuestions to ask\n" + plan.questions.map(item => item.whom + ": " + item.question).join("\n") + "\n\nResponsible AI use\n" + plan.useChecks.join("\n"),
      sources: "Suggested starting points for finding help and sources:\n" + sources.join("\n"),
      verify: [...plan.sourceChecks, plan.useChecks[0], "Confirm the deliverable against the original instructions and update this record if you use another tool."].join("\n"),
    },
  };
}

export function sampleAssignment(): Brief {
  const due = new Date();
  due.setDate(due.getDate() + 14);
  const local = new Date(due.getTime() - due.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
  return {
    title: "Food access and student wellbeing", course: "First-Year Writing · sample", due: local,
    type: "Essay", permission: "Allowed with limits",
    instructions: "Write a 1,200-word evidence-based essay about how access to affordable food affects student wellbeing. Compare two perspectives using at least three credible sources. Include an APA reference list and submit a PDF.",
    rules: "In this fictional example, AI may help brainstorm questions or organize an outline. Write the essay yourself, verify citations, and disclose any AI assistance.",
    help: ["Organize my time", "Plan research", "Document AI use"],
  };
}
