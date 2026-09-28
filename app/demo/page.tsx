import { ArrowRight, BookOpen, Check, Clipboard, Clock3, ExternalLink, Play, ShieldCheck, Sparkles, Target } from "lucide-react";

const phases = [
  { number:"01", title:"Describe the real situation", text:"Write what is happening, your goal, deadline, and anything the answer must respect." },
  { number:"02", title:"Choose a prompt approach", text:"PromptLife creates structured options. Read them and choose the one that matches your goal." },
  { number:"03", title:"Continue in one AI", text:"Copy the prompt or open the same prompt in ChatGPT, Gemini, Claude, Perplexity, or Copilot." }
];

export default function DemoPage(){
  return <main className="demo-page">
    <header className="demo-header"><a href="/" className="demo-brand"><span className="robot-mark"><img src="/promptbot.png" alt=""/></span><span className="brand-word">prompt<span>life</span><i>AI</i></span></a><a href="/" className="demo-back">Back to workspace</a></header>

    <section className="demo-hero">
      <div className="demo-hero-copy"><div className="demo-label"><Play size={14} fill="currentColor"/> Interactive product demo</div><h1>See how PromptLife turns a student problem into a stronger AI prompt.</h1><p>This short guide uses one realistic exam situation. Follow the three phases, then run the Prompt Challenge yourself.</p><div className="demo-actions"><a href="/challenge" className="demo-primary">Start the Prompt Challenge <ArrowRight size={17}/></a><a href="#guide" className="demo-secondary">See the guide</a></div></div>
      <div className="demo-bot"><span>Follow me—this takes about 3 minutes.</span><img src="/promptbot.png" alt="PromptBot guiding the PromptLife demonstration"/></div>
    </section>

    <section className="demo-video-section"><div className="demo-section-heading"><p>48-second overview</p><h2>Watch how PromptLife works.</h2></div><div className="demo-video-shell"><video controls preload="metadata" poster="/promptbot.png"><source src="/promptlife-demo.mp4" type="video/mp4"/>Your browser does not support this video.</video><div><b>Captioned product walkthrough</b><span>Describe → Choose → Continue → Verify</span></div></div></section>

    <section id="guide" className="demo-section"><div className="demo-section-heading"><p>How to use PromptLife</p><h2>One situation. Three clear phases.</h2></div><div className="demo-phase-grid">{phases.map((phase,index)=><article key={phase.number} className="demo-phase-card"><div><span>{phase.number}</span>{index<2&&<ArrowRight size={18}/>}</div><h3>{phase.title}</h3><p>{phase.text}</p></article>)}</div></section>

    <section className="demo-example">
      <div className="demo-example-top"><div><p>Guided example</p><h2>Preparing for an ML exam</h2></div><span><Clock3 size={15}/> About 3 minutes</span></div>
      <div className="demo-example-grid">
        <article className="demo-situation"><div className="demo-card-label">Student situation</div><p>“I have a machine learning exam in five days. I work part-time, I am behind on neural networks, and I need a realistic study plan that helps me learn instead of giving me answers.”</p><div className="demo-details"><span><Check size={14}/> Goal included</span><span><Check size={14}/> Deadline included</span><span><Check size={14}/> Constraint included</span></div></article>
        <article className="demo-transformation"><div className="demo-card-label"><Sparkles size={14}/> PromptLife adds structure</div><ul><li><b>Role:</b> practical study coach</li><li><b>Task:</b> create a five-day plan</li><li><b>Constraints:</b> respect work hours; no completed answers</li><li><b>Format:</b> daily checklist with active recall</li><li><b>Safety:</b> identify anything that should be verified</li></ul></article>
      </div>
    </section>

    <section className="demo-compare"><div className="demo-section-heading"><p>Why the challenge matters</p><h2>Test the method instead of trusting a claim.</h2></div><div className="demo-compare-grid"><article><span className="demo-score muted">Your prompt</span><h3>Write as you normally would</h3><p>The timer records how long you take. PromptLife scores the structure using six visible checks.</p></article><article className="demo-compare-accent"><span className="demo-score">PromptLife prompt</span><h3>Use the guided workflow</h3><p>The same timer includes setup and generation, so the comparison stays fair.</p></article><article><span className="demo-score mint">Actual AI outputs</span><h3>Compare both responses</h3><p>Use the same AI model, paste both responses, and compare usefulness with one rubric.</p></article></div></section>

    <section className="demo-why"><div className="demo-section-heading"><p>Why PromptLife for students?</p><h2>Better prompts should support better thinking.</h2></div><div className="demo-why-grid"><article><Sparkles size={21}/><h3>Start without prompt expertise</h3><p>Describe the situation in ordinary language. PromptLife organizes the goal, context, constraints, and output format.</p></article><article><BookOpen size={21}/><h3>Use AI as a learning partner</h3><p>Learning-first prompts ask for explanations, diagnostic questions, practice, feedback, and reasoning—not hidden shortcuts.</p></article><article><ShieldCheck size={21}/><h3>Stay responsible</h3><p>Verification reminders, editable prompts, privacy explanations, and transparent scoring keep the student in control.</p></article><article><Target size={21}/><h3>Work across different AI tools</h3><p>Copy one prompt or continue in several major assistants without rebuilding the request every time.</p></article></div></section>

    <section className="demo-tips"><div className="demo-section-heading"><p>Helpful student tips</p><h2>Before you send any AI prompt</h2></div><div className="demo-tip-list">{[
      ["Name the result","Say whether you need an explanation, study plan, outline, feedback, email, practice quiz, or decision table."],
      ["Add useful context","Include the course level, topic, deadline, materials you have, and what you already understand."],
      ["State the boundaries","Tell the AI what it must not invent, which sources it may use, and what work must remain your own."],
      ["Choose the format","Ask for steps, a table, checklist, examples, questions, or a short explanation at the right level."],
      ["Request verification","Ask the AI to mark uncertainty, identify claims needing sources, and avoid fabricated citations."],
      ["Keep the conversation going","Review the response, challenge weak parts, ask follow-ups, and rewrite final work in your own voice."]
    ].map((tip,index)=><article key={tip[0]}><span>{index+1}</span><div><h3>{tip[0]}</h3><p>{tip[1]}</p></div></article>)}</div></section>

    <section className="demo-reading"><div className="demo-section-heading"><p>Recommended reading</p><h2>Learn prompting and responsible AI use.</h2></div><div className="demo-reading-grid"><a href="https://academy.openai.com/en/public/clubs/higher-education-05x4z/resources/prompt-pack-for-students" target="_blank" rel="noreferrer"><span>OpenAI Academy</span><h3>Prompt Pack for Students</h3><p>Ready-to-use ideas for studying, assignments, projects, research, and career exploration.</p><ExternalLink size={17}/></a><a href="https://help.openai.com/en/articles/10032626-prompt-engineering-best-practices-for-chatgpt" target="_blank" rel="noreferrer"><span>OpenAI Help Center</span><h3>Prompt Engineering Best Practices</h3><p>Practical guidance on clarity, context, refinement, tone, and useful output instructions.</p><ExternalLink size={17}/></a><a href="https://www.unesco.org/en/articles/ai-competency-framework-students" target="_blank" rel="noreferrer"><span>UNESCO</span><h3>AI Competency Framework for Students</h3><p>A human-centered framework for becoming a responsible user and co-creator of AI.</p><ExternalLink size={17}/></a><a href="https://teaching.cornell.edu/generative-artificial-intelligence/ai-critical-literacy-program" target="_blank" rel="noreferrer"><span>Cornell University</span><h3>AI Critical Literacy Program</h3><p>Resources for understanding AI tools and their role in student learning.</p><ExternalLink size={17}/></a></div></section>

    <section className="demo-rules"><div><ShieldCheck size={22}/><span><b>Run a fair demonstration</b><small>Use the same scenario and the same AI provider for both prompts.</small></span></div><div><Target size={22}/><span><b>Measure more than speed</b><small>Compare clarity, specificity, actionability, responsibility, and learning value.</small></span></div><div><Clipboard size={22}/><span><b>Keep your evidence</b><small>Copy the two prompts and outputs for your class, research, or product demonstration.</small></span></div></section>

    <section className="demo-final"><img src="/promptbot.png" alt=""/><div><p>Ready to try it?</p><h2>Run the Prompt Challenge with your own student situation.</h2></div><a href="/challenge" className="demo-primary">Open Prompt Challenge <ArrowRight size={17}/></a></section>
  </main>;
}
