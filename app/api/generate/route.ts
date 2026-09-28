import { NextRequest, NextResponse } from "next/server";

type JourneyId = "exam" | "email" | "research" | "career" | "week";
type Config = { title: string; role: string; task: string; constraints: string[]; steps: { title: string; detail: string }[]; label: { sensitivity: string; verify: string; risk: string; note: string } };

const configs: Record<JourneyId, Config> = {
  exam: { title: "Your focused exam recovery plan", role: "an evidence-minded study coach", task: "Create a prioritized study plan, explain difficult topics, and test understanding with active recall.", constraints: ["Use only the topics and materials I provide", "Prioritize weak areas and high-value topics", "Include breaks and realistic time estimates", "Do not complete graded work for me"], steps: [{title:"Paste the prompt",detail:"Use it with your preferred AI assistant, then add your syllabus or study materials when asked."},{title:"Check the priorities",detail:"Confirm that the suggested topics match what your professor emphasized."},{title:"Practice without notes",detail:"Complete the generated retrieval questions before asking for explanations."},{title:"Adjust after each session",detail:"Tell the assistant what you missed so the remaining plan adapts."}], label:{sensitivity:"Low",verify:"Medium",risk:"Medium",note:"Verify formulas, dates, and course-specific claims against your instructor’s materials."} },
  email: { title: "Your professor communication prompt", role: "a concise university communication coach", task: "Draft a respectful email that clearly explains my situation and makes one reasonable request.", constraints: ["Keep it under 180 words", "Use a natural student voice", "Do not invent facts or excuses", "Include a useful subject line", "Avoid demanding or overly apologetic language"], steps:[{title:"Generate the draft",detail:"Paste the prompt and review the first version for accuracy."},{title:"Make it sound like you",detail:"Replace generic phrases with language you would naturally use."},{title:"Confirm the request",detail:"Check that the recipient can quickly understand what action you are requesting."}], label:{sensitivity:"Medium",verify:"High",risk:"Low",note:"Review names, dates, course details, and attachments before sending. Remove private information that is not necessary."} },
  research: { title:"Your research understanding workflow", role:"a rigorous graduate research assistant", task:"Help me understand the source, separate its claims from evidence, and produce the requested academic output.", constraints:["Never invent citations, results, or methods","Mark uncertainty explicitly","Separate author claims from your interpretation","Quote only when I provide the source text","End with unresolved questions"], steps:[{title:"Provide the source",detail:"Add the paper text, abstract, or notes so the analysis stays grounded."},{title:"Inspect the evidence map",detail:"Review the research question, method, data, findings, and limitations."},{title:"Challenge the analysis",detail:"Ask for competing interpretations and evidence that would change the conclusion."},{title:"Verify every citation",detail:"Open the original sources before using references in academic work."}], label:{sensitivity:"Low",verify:"High",risk:"High",note:"Academic claims and citations require source-level verification. Follow your course policy for AI-assisted work."} },
  career: { title:"Your honest job-matching prompt", role:"an exacting early-career recruiter and resume editor", task:"Compare my verified experience with the target role and improve how I communicate relevant evidence.", constraints:["Do not invent skills, metrics, employers, or projects","Label missing qualifications clearly","Use concrete evidence instead of buzzwords","Separate quick improvements from long-term skill gaps"], steps:[{title:"Run the comparison",detail:"Paste the prompt with the complete job description and your current resume text."},{title:"Verify every change",detail:"Reject any bullet, metric, or tool that you cannot personally defend."},{title:"Choose high-value gaps",detail:"Focus on two or three realistic improvements before applying."},{title:"Prepare proof",detail:"Create short interview stories for the strongest matched requirements."}], label:{sensitivity:"Medium",verify:"High",risk:"Medium",note:"Remove phone numbers, home addresses, immigration identifiers, and unnecessary personal data."} },
  week: { title:"Your realistic weekly reset", role:"a practical student planning coach", task:"Create a flexible weekly plan that protects fixed commitments and advances my three main priorities.", constraints:["Do not schedule every minute","Include buffers and recovery time","Break vague projects into visible next actions","Flag conflicts instead of hiding them","Leave one catch-up block"], steps:[{title:"Review the draft week",detail:"Check that all fixed commitments and deadlines are correct."},{title:"Move the hard work",detail:"Place demanding tasks when your energy is usually strongest."},{title:"Select tomorrow’s three",detail:"Choose only three must-do actions for the next day."},{title:"Reset, don’t restart",detail:"If the plan slips, update the remaining time instead of abandoning the week."}], label:{sensitivity:"Low",verify:"Low",risk:"Low",note:"This is planning support, not medical or mental-health advice. Adjust it to your actual capacity."} },
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as {
      journeyId?: JourneyId;
      answers?: Record<string,string>;
      preferences?: { tone?: string; detail?: string };
      passport?: { name?: string; program?: string; goal?: string };
    };
    if (!body.journeyId || !configs[body.journeyId] || !body.answers) return NextResponse.json({error:"Invalid journey request"},{status:400});
    const answers = Object.fromEntries(Object.entries(body.answers).map(([k,v]) => [k,String(v).trim().slice(0,4000)]));
    if (Object.values(answers).some(v => !v)) return NextResponse.json({error:"Please complete every field"},{status:400});
    const config = configs[body.journeyId];
    const passport = body.passport || {};
    const personalContext = [
      passport.program ? "- Program or field: " + String(passport.program).slice(0,300) : "",
      passport.goal ? "- Current broader goal: " + String(passport.goal).slice(0,600) : ""
    ].filter(Boolean).join("\n");
    const context = Object.entries(answers).map(([k,v]) => "- " + k.replace(/\b\w/g,c=>c.toUpperCase()) + ": " + v).join("\n");
    const toneMap: Record<string,string> = { clear:"clear and direct", warm:"warm and encouraging", formal:"formal and polished" };
    const detailMap: Record<string,string> = { brief:"brief and skimmable", balanced:"balanced with enough explanation to act", deep:"detailed with reasoning and examples" };
    const tone = toneMap[body.preferences?.tone || "clear"] || toneMap.clear;
    const detail = detailMap[body.preferences?.detail || "balanced"] || detailMap.balanced;
    const rules = config.constraints.map((x,i)=>(i+1) + ". " + x).join("\n");
    const prompt = "Act as " + config.role + ".\n\nMy student context:\n" +
      (personalContext || "- No saved profile context provided") +
      "\n\nMy situation:\n" + context +
      "\n\nYour task:\n" + config.task +
      "\n\nResponse style:\n- Tone: " + tone + "\n- Detail level: " + detail +
      "\n\nRules:\n" + rules +
      "\n\nStart by briefly restating my goal and identifying any critical missing information. Then produce the requested result in clear sections. Finish with three concrete next actions I can complete myself.";
    return NextResponse.json({title:config.title,prompt,steps:config.steps,label:config.label});
  } catch { return NextResponse.json({error:"Unable to build this prompt journey"},{status:500}); }
}
