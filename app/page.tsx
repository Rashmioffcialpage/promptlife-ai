"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft, ArrowRight, BookOpen, BriefcaseBusiness, CalendarDays, Check,
  ChevronRight, Clipboard, GraduationCap, LayoutGrid, Mail, Menu, PencilLine,
  Database, ExternalLink, HardDrive, Library, LockKeyhole, MessageCircle,
  BarChart3, Clock3, Play, RefreshCw, RotateCcw, Search, Send, ShieldCheck,
  Sparkles, Target, UserRound, WandSparkles, X, Zap, History, Bookmark, Trash2, FileText, Paperclip, Upload,
  Languages, Accessibility, Volume2, Square
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";

type Journey = {
  id: string; title: string; eyebrow: string; description: string; time: string;
  icon: typeof BookOpen; accent: string; featured?: boolean;
  questions: { key: string; label: string; placeholder: string; multiline?: boolean }[];
};
type Result = {
  title: string; prompt: string;
  steps: { title: string; detail: string }[];
  label: { sensitivity: string; verify: string; risk: string; note: string };
};
type Passport = { name: string; program: string; goal: string };
type DirectPrompt = { label: string; prompt: string };
type PromptResource = { id: string; title: string; category: string; prompt: string };
type PromptScore = { total: number; checks: { label: string; passed: boolean }[] };
type SavedSession = { id: string; situation: string; prompts: DirectPrompt[]; createdAt: string };
type FollowUpQuestion = { id: string; label: string; placeholder: string };
type StudentWorkspace = { id: string; name: string; type: string };
type UploadedDocument = { id: string; name: string; contentType: string; size: string; workspaceId: string|null; createdAt: string };

const journeys: Journey[] = [
  { id:"exam", title:"Exam Rescue", eyebrow:"Academics", description:"Build a focused plan from your deadline, materials, and weak spots.", time:"4 min", icon:BookOpen, accent:"coral", featured:true, questions:[
    {key:"course",label:"What course or exam is this for?",placeholder:"Machine Learning midterm"},
    {key:"deadline",label:"When is the exam?",placeholder:"Friday at 2 PM"},
    {key:"context",label:"What topics and materials do you have?",placeholder:"List chapters, slides, practice tests, and difficult topics.",multiline:true}
  ]},
  { id:"email", title:"Professor Email", eyebrow:"Communication", description:"Write a clear, respectful email that sounds like you.", time:"2 min", icon:Mail, accent:"blue", questions:[
    {key:"course",label:"Who are you writing to?",placeholder:"Professor Bedoui"},
    {key:"goal",label:"What do you need from them?",placeholder:"Request a meeting about my proposal"},
    {key:"context",label:"What context should they know?",placeholder:"Add dates, work completed, and your preferred tone.",multiline:true}
  ]},
  { id:"research", title:"Research Navigator", eyebrow:"Research", description:"Turn a dense paper into claims, evidence, limits, and next steps.", time:"6 min", icon:GraduationCap, accent:"violet", questions:[
    {key:"course",label:"What is the paper or topic?",placeholder:"Paste the title or describe the topic"},
    {key:"goal",label:"What do you need to produce?",placeholder:"Literature review, presentation, experiment plan..."},
    {key:"context",label:"What is confusing or important?",placeholder:"Mention methods, equations, findings, or limitations.",multiline:true}
  ]},
  { id:"career", title:"Job Match Builder", eyebrow:"Career", description:"Connect real experience to a role without inventing qualifications.", time:"5 min", icon:BriefcaseBusiness, accent:"mint", questions:[
    {key:"course",label:"What role are you targeting?",placeholder:"Machine Learning Engineer"},
    {key:"goal",label:"What output do you want?",placeholder:"Resume bullets, match analysis, interview plan..."},
    {key:"context",label:"Paste your experience and job requirements",placeholder:"Include only experience you can honestly verify.",multiline:true}
  ]},
  { id:"week", title:"Weekly Reset", eyebrow:"Organization", description:"Build a balanced week around deadlines, energy, and priorities.", time:"3 min", icon:CalendarDays, accent:"yellow", questions:[
    {key:"course",label:"What are your three biggest priorities?",placeholder:"Exam, research meeting, job applications..."},
    {key:"deadline",label:"What fixed commitments do you have?",placeholder:"Classes, work shifts, appointments..."},
    {key:"context",label:"What else should the plan respect?",placeholder:"Energy, commute, sleep, exercise, or personal commitments.",multiline:true}
  ]}
];

const categories = ["All","Academics","Research","Career","Communication","Organization"];
const starterSituations = [
  "Plan my exam week",
  "Help me email my professor",
  "Understand a research paper",
  "Tailor my resume honestly",
  "Organize my deadlines"
];

const promptResources: PromptResource[] = [
  {id:"study-plan",title:"Build a study plan",category:"Academics",prompt:"Act as a practical study coach. I am preparing for [exam/course] on [date]. I have [available time] and struggle most with [topics]. Create a prioritized plan using active recall, spaced practice, realistic breaks, and a short daily checkpoint. Do not complete graded work for me."},
  {id:"explain-topic",title:"Explain a difficult concept",category:"Academics",prompt:"Teach me [concept] at my current level: [beginner/intermediate/advanced]. Begin with an intuitive explanation, then one concrete example, then the formal definition. Ask me two diagnostic questions and correct my reasoning without immediately giving away the answer."},
  {id:"practice-test",title:"Create a practice test",category:"Academics",prompt:"Using only the material I provide, create a practice test for [course/topic] with a mix of recall, application, and reasoning questions. Do not show the answers until I attempt each section. After I respond, grade my reasoning and identify the three concepts I should revisit."},
  {id:"paper-map",title:"Map a research paper",category:"Research",prompt:"Analyze the research paper I provide. Separate the research question, hypothesis, data, method, findings, limitations, and open questions. Distinguish the authors' claims from your interpretation, never invent citations, and finish with three possible follow-up experiments."},
  {id:"literature-review",title:"Plan a literature review",category:"Research",prompt:"Help me design a literature review on [topic]. Propose precise research questions, inclusion and exclusion criteria, search keywords, a synthesis table, and a thematic outline. Mark any citation you cannot verify and do not fabricate sources."},
  {id:"experiment",title:"Design an experiment",category:"Research",prompt:"Act as a rigorous research collaborator. For this research question—[question]—propose a testable hypothesis, variables, dataset requirements, baseline, evaluation metrics, ablations, risks, and reproducibility checklist. Clearly separate essential work from optional extensions."},
  {id:"resume-match",title:"Match résumé to a job",category:"Career",prompt:"Compare my résumé with the job description I provide. Create a requirement-to-evidence table, identify true gaps, and rewrite only bullets supported by my real experience. Never invent skills or metrics. Finish with five likely interview questions based on the strongest match areas."},
  {id:"interview",title:"Run a mock interview",category:"Career",prompt:"Interview me for [role] at [company type]. Ask one question at a time, wait for my answer, then evaluate clarity, technical depth, and evidence. Give one improvement and one stronger example response before moving to the next question."},
  {id:"networking",title:"Write a networking message",category:"Career",prompt:"Write a concise, natural networking message to [person/role]. Context: [shared connection or reason]. My goal is [advice/referral/coffee chat]. Keep it under 100 words, avoid flattery and pressure, and make the request easy to decline."},
  {id:"professor-email",title:"Email a professor",category:"Communication",prompt:"Draft a respectful email to [professor] about [situation]. Include the necessary context, one clear request, and a helpful subject line. Keep it under 180 words, use a natural student voice, and do not invent excuses or facts."},
  {id:"presentation",title:"Prepare a presentation",category:"Communication",prompt:"Turn my topic and notes into a [duration]-minute presentation. Create a clear narrative, slide-by-slide outline, speaker notes, one memorable example, and likely audience questions. Flag claims that need a source and avoid overcrowded slides."},
  {id:"weekly-reset",title:"Plan a realistic week",category:"Organization",prompt:"Create a flexible weekly plan from my deadlines, fixed commitments, and three priorities. Use realistic work blocks, buffers, breaks, and one catch-up period. Point out conflicts instead of hiding them, and end with only three actions for tomorrow."},
  {id:"team-conflict",title:"Handle a team problem",category:"Communication",prompt:"Help me respond to this team situation: [describe it]. Separate facts from assumptions, identify the shared goal, and draft a calm message that names the issue, proposes a specific next step, and avoids blame."},
  {id:"decision",title:"Make a difficult decision",category:"Organization",prompt:"Help me evaluate this decision: [decision]. Ask for any critical missing information, then compare options using my priorities, constraints, reversibility, risks, and opportunity costs. Do not decide for me; show the tradeoffs and recommend the next small test."}
];

export const challengeScenarios = [
  "I have a machine learning exam in five days. I work part-time, I am behind on neural networks, and I need a realistic study plan that helps me learn instead of giving me answers.",
  "I need to email my professor to request feedback on my research proposal before Friday. I want the message to sound respectful, concise, and natural.",
  "I am applying for an entry-level AI engineer role. I need help comparing my real experience with the job description without inventing skills or results."
];

function scorePrompt(prompt:string, scenario:string):PromptScore {
  const text=prompt.toLowerCase();
  const scenarioWords=scenario.toLowerCase().match(/[a-z]{5,}/g)||[];
  const contextHits=new Set(scenarioWords.filter(word=>text.includes(word))).size;
  const checks=[
    {label:"Clear goal",passed:/(help|create|build|draft|compare|explain|plan|prepare|write)/.test(text)},
    {label:"Useful context",passed:contextHits>=3||prompt.length>=180},
    {label:"Constraints",passed:/(without|do not|must|deadline|time|only|avoid|constraint)/.test(text)},
    {label:"Output format",passed:/(step|table|list|outline|format|section|bullet|plan)/.test(text)},
    {label:"Verification",passed:/(verify|check|source|uncertain|accuracy|fact)/.test(text)},
    {label:"Learning value",passed:/(learn|reason|explain|question|feedback|thinking|understand)/.test(text)}
  ];
  return {total:Math.round(checks.filter(x=>x.passed).length/checks.length*100),checks};
}

function scoreOutput(output:string, scenario:string):PromptScore {
  const text=output.toLowerCase();
  const scenarioWords=scenario.toLowerCase().match(/[a-z]{5,}/g)||[];
  const contextHits=new Set(scenarioWords.filter(word=>text.includes(word))).size;
  const checks=[
    {label:"Answers the situation",passed:contextHits>=3},
    {label:"Specific",passed:/\b\d+\b|monday|tuesday|wednesday|thursday|friday|subject:|example/.test(text)},
    {label:"Actionable",passed:/(step|first|next|today|start|checklist|action)/.test(text)},
    {label:"Well structured",passed:/\n[-*1-9]|section|plan|outline|subject:/.test(text)},
    {label:"Responsible",passed:/(verify|check|source|policy|do not|avoid|uncertain)/.test(text)},
    {label:"Supports learning",passed:/(understand|practice|explain|reflect|feedback|learn|reason)/.test(text)}
  ];
  return {total:Math.round(checks.filter(x=>x.passed).length/checks.length*100),checks};
}

function scoreStudentInput(text:string,answers:Record<string,string>,hasReference:boolean){
  const value=(text+" "+Object.values(answers).join(" ")).toLowerCase();
  const checks=[
    /(help|create|build|draft|compare|explain|plan|prepare|write|review|organize|understand)/.test(value),
    value.split(/\s+/).filter(Boolean).length>=14||hasReference,
    /(without|must|only|avoid|limit|budget|beginner|advanced|part.time|available)/.test(value),
    /(today|tomorrow|this week|next week|monday|tuesday|wednesday|thursday|friday|deadline|due|\d+\s*(day|week|hour|minute))/i.test(value),
    /(step|table|list|outline|email|plan|summary|bullet|checklist|questions|format)/.test(value),
  ];
  return checks.filter(Boolean).length*20;
}

function Brand() {
  return <span className="flex items-center gap-3">
    <span className="robot-mark" aria-hidden="true"><img src="/promptbot.png" alt=""/></span>
    <span className="brand-word">prompt<span>life</span><i>AI</i></span>
  </span>;
}

export default function Home() {
  const [sidebarOpen,setSidebarOpen]=useState(true);
  const [selected,setSelected]=useState<Journey|null>(null);
  const [values,setValues]=useState<Record<string,string>>({});
  const [result,setResult]=useState<Result|null>(null);
  const [editablePrompt,setEditablePrompt]=useState("");
  const [loading,setLoading]=useState(false);
  const [copied,setCopied]=useState(false);
  const [query,setQuery]=useState("");
  const [category,setCategory]=useState("All");
  const [tone,setTone]=useState("clear");
  const [detail,setDetail]=useState("balanced");
  const [passport,setPassport]=useState<Passport>({name:"",program:"",goal:""});
  const [passportOpen,setPassportOpen]=useState(false);
  const [situation,setSituation]=useState("");
  const [directPrompts,setDirectPrompts]=useState<DirectPrompt[]>([]);
  const [directLoading,setDirectLoading]=useState(false);
  const [copiedItem,setCopiedItem]=useState("");
  const [challengeScenario,setChallengeScenario]=useState(challengeScenarios[0]);
  const [challengePrompt,setChallengePrompt]=useState("");
  const [challengeStartedAt,setChallengeStartedAt]=useState<number|null>(null);
  const [challengeSeconds,setChallengeSeconds]=useState<number|null>(null);
  const [challengeResult,setChallengeResult]=useState<{prompt:string;seconds:number}|null>(null);
  const [challengeLoading,setChallengeLoading]=useState(false);
  const [guideStartedAt,setGuideStartedAt]=useState<number|null>(null);
  const [guideValues,setGuideValues]=useState({goal:"",constraints:"",format:""});
  const [humanOutput,setHumanOutput]=useState("");
  const [guidedOutput,setGuidedOutput]=useState("");
  const [savedSessions,setSavedSessions]=useState<SavedSession[]>([]);
  const [favorites,setFavorites]=useState<string[]>([]);
  const [resourceQuery,setResourceQuery]=useState("");
  const [resourceCategory,setResourceCategory]=useState("All");
  const [cloudSaveStatus,setCloudSaveStatus]=useState<""|"saved">("");
  const [followUpQuestions,setFollowUpQuestions]=useState<FollowUpQuestion[]>([]);
  const [followUpAnswers,setFollowUpAnswers]=useState<Record<string,string>>({});
  const [workspaces,setWorkspaces]=useState<StudentWorkspace[]>([]);
  const [selectedWorkspaceId,setSelectedWorkspaceId]=useState("none");
  const [documents,setDocuments]=useState<UploadedDocument[]>([]);
  const [selectedDocumentIds,setSelectedDocumentIds]=useState<string[]>([]);
  const [uploadingDocument,setUploadingDocument]=useState(false);
  const [uploadError,setUploadError]=useState("");
  const [promptLanguage,setPromptLanguage]=useState("en");
  const [simpleLanguage,setSimpleLanguage]=useState(false);
  const [speaking,setSpeaking]=useState(false);

  useEffect(()=>{
    if(window.matchMedia("(max-width: 1023px)").matches) setSidebarOpen(false);
    const saved=window.localStorage.getItem("promptlife-passport");
    if(saved) try { setPassport(JSON.parse(saved)); } catch {}
    const sessions=window.localStorage.getItem("promptlife-history");
    if(sessions) try { setSavedSessions(JSON.parse(sessions)); } catch {}
    const starred=window.localStorage.getItem("promptlife-favorites");
    if(starred) try { setFavorites(JSON.parse(starred)); } catch {}
    const accessibility=window.localStorage.getItem("promptlife-accessibility");
    if(accessibility) try { const saved=JSON.parse(accessibility);setPromptLanguage(saved.language||"en");setSimpleLanguage(Boolean(saved.simple)); } catch {}
    fetch("/api/workspaces").then(response=>response.ok?response.json():null).then(data=>{if(data?.items)setWorkspaces(data.items);}).catch(()=>{});
    fetch("/api/documents").then(response=>response.ok?response.json():null).then(data=>{if(data?.items)setDocuments(data.items);}).catch(()=>{});
    return ()=>window.speechSynthesis?.cancel();
  },[]);

  const filtered=useMemo(()=>journeys.filter(j=>{
    const matchesCategory=category==="All"||j.eyebrow===category;
    const haystack=(j.title+" "+j.eyebrow+" "+j.description).toLowerCase();
    return matchesCategory&&haystack.includes(query.toLowerCase());
  }),[query,category]);
  const completion=useMemo(()=>!selected?0:Math.round(selected.questions.filter(q=>values[q.key]?.trim()).length/selected.questions.length*100),[selected,values]);
  const passportCompletion=[passport.name,passport.program,passport.goal].filter(Boolean).length;
  const visibleResources=useMemo(()=>promptResources.filter(item=>{
    const categoryMatch=resourceCategory==="All"||item.category===resourceCategory;
    const searchMatch=(item.title+" "+item.prompt).toLowerCase().includes(resourceQuery.toLowerCase());
    return categoryMatch&&searchMatch;
  }).sort((a,b)=>Number(favorites.includes(b.id))-Number(favorites.includes(a.id))),[resourceQuery,resourceCategory,favorites]);

  function goHome(){setSelected(null);setValues({});setResult(null);setEditablePrompt("");setCopied(false);}
  function choose(j:Journey){setSelected(j);setValues({});setResult(null);setEditablePrompt("");window.scrollTo({top:0,behavior:"smooth"});}
  function savePassport(){window.localStorage.setItem("promptlife-passport",JSON.stringify(passport));setPassportOpen(false);}
  function toggleFavorite(id:string){const next=favorites.includes(id)?favorites.filter(x=>x!==id):[...favorites,id];setFavorites(next);window.localStorage.setItem("promptlife-favorites",JSON.stringify(next));}
  function removeSession(id:string){const next=savedSessions.filter(item=>item.id!==id);setSavedSessions(next);window.localStorage.setItem("promptlife-history",JSON.stringify(next));}
  function reopenSession(item:SavedSession){setSituation(item.situation);setDirectPrompts(item.prompts);window.scrollTo({top:0,behavior:"smooth"});}
  async function generate(){
    if(!selected||completion<100)return;
    setLoading(true);
    try{
      const response=await fetch("/api/generate",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({journeyId:selected.id,answers:values,preferences:{tone,detail},passport})});
      if(!response.ok)throw new Error("Could not create journey");
      const data=await response.json();setResult(data);setEditablePrompt(data.prompt);
    }finally{setLoading(false);}
  }
  async function copyPrompt(){await navigator.clipboard.writeText(editablePrompt);setCopied(true);window.setTimeout(()=>setCopied(false),1600);}
  async function generateDirectPrompts(enrichedSituation:string){
    if(selectedDocumentIds.length){
      const contextResponse=await fetch("/api/documents/context",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({ids:selectedDocumentIds})});
      if(contextResponse.ok){const data=await contextResponse.json();if(data.context)enrichedSituation+="\n\nUploaded reference material:\n"+data.context;}
    }
    const response=await fetch("/api/direct",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({situation:enrichedSituation,passport,language:promptLanguage,simpleLanguage})});
    if(!response.ok)throw new Error("Could not create prompts");
    const data=await response.json();
    const prompts=data.prompts||[];
    setDirectPrompts(prompts);
    const next=[{id:String(Date.now()),situation:situation.trim(),prompts,createdAt:new Date().toISOString()},...savedSessions].slice(0,8);
    setSavedSessions(next);window.localStorage.setItem("promptlife-history",JSON.stringify(next));
    const recommended=prompts[1]||prompts[0];
    if(recommended){
      const inputScore=scoreStudentInput(situation,followUpAnswers,selectedDocumentIds.length>0);
      const cloudResponse=await fetch("/api/prompts",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({situation:situation.trim(),title:recommended.label,prompt:recommended.prompt,workspaceId:selectedWorkspaceId==="none"?null:selectedWorkspaceId,inputScore})});
      if(cloudResponse.ok){setCloudSaveStatus("saved");window.setTimeout(()=>setCloudSaveStatus(""),2600);}
    }
    setFollowUpQuestions([]);setFollowUpAnswers({});
  }
  async function uploadDocument(file:File){
    setUploadingDocument(true);setUploadError("");
    const form=new FormData();form.set("file",file);form.set("workspaceId",selectedWorkspaceId);
    const response=await fetch("/api/documents",{method:"POST",body:form});
    const data=await response.json().catch(()=>({}));
    if(response.ok){setDocuments(current=>[data.item,...current]);setSelectedDocumentIds(current=>[data.item.id,...current].slice(0,3));}else setUploadError(data.error||"Could not upload this file");
    setUploadingDocument(false);
  }
  function toggleDocument(id:string){setSelectedDocumentIds(current=>current.includes(id)?current.filter(item=>item!==id):current.length<3?[...current,id]:current);}
  async function createDirectPrompts(skipQuestions=false){
    if(!situation.trim())return;
    setDirectLoading(true);
    try{
      if(!skipQuestions&&followUpQuestions.length===0){
        const check=await fetch("/api/followup",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({situation})});
        if(!check.ok)throw new Error("Could not check details");
        const data=await check.json();
        if(data.questions?.length){setFollowUpQuestions(data.questions);setDirectLoading(false);return;}
      }
      const details=followUpQuestions.map(question=>followUpAnswers[question.id]?.trim()&&question.label+" "+followUpAnswers[question.id].trim()).filter(Boolean);
      await generateDirectPrompts([situation.trim(),details.length?"Helpful details:\n"+details.join("\n"):""].filter(Boolean).join("\n\n"));
    }finally{setDirectLoading(false);}
  }
  async function copyItem(id:string,text:string){await navigator.clipboard.writeText(text);setCopiedItem(id);window.setTimeout(()=>setCopiedItem(""),1500);}
  function updateAccessibility(language:string,simple:boolean){
    setPromptLanguage(language);setSimpleLanguage(simple);
    window.localStorage.setItem("promptlife-accessibility",JSON.stringify({language,simple}));
    setDirectPrompts([]);
  }
  function speakPrompt(text:string){
    if(!("speechSynthesis" in window))return;
    if(speaking){window.speechSynthesis.cancel();setSpeaking(false);return;}
    const utterance=new SpeechSynthesisUtterance(text);
    utterance.lang=({en:"en-US",es:"es-ES",fr:"fr-FR",hi:"hi-IN"} as Record<string,string>)[promptLanguage]||"en-US";
    utterance.rate=simpleLanguage?.92:1;
    utterance.onend=()=>setSpeaking(false);utterance.onerror=()=>setSpeaking(false);
    window.speechSynthesis.cancel();window.speechSynthesis.speak(utterance);setSpeaking(true);
  }
  function startChallenge(){setChallengePrompt("");setChallengeSeconds(null);setChallengeResult(null);setChallengeStartedAt(Date.now());}
  function finishChallenge(){
    if(!challengeStartedAt||!challengePrompt.trim())return;
    const humanSeconds=Math.max(1,Math.round((Date.now()-challengeStartedAt)/1000));
    setChallengeSeconds(humanSeconds);setChallengeStartedAt(null);
  }
  function startGuide(){setGuideStartedAt(Date.now());setGuideValues({goal:"",constraints:"",format:""});}
  async function generateGuide(){
    if(!guideStartedAt||Object.values(guideValues).some(value=>!value.trim()))return;
    setChallengeLoading(true);
    try{
      const enriched=[challengeScenario,"Goal: "+guideValues.goal,"Constraints: "+guideValues.constraints,"Preferred output: "+guideValues.format].join("\n");
      const response=await fetch("/api/direct",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({situation:enriched,passport})});
      if(!response.ok)throw new Error("Could not run comparison");
      const data=await response.json();
      const prompts:DirectPrompt[]=data.prompts||[];
      setChallengeResult({prompt:prompts[prompts.length-1]?.prompt||prompts[0]?.prompt||"",seconds:Math.max(1,Math.round((Date.now()-guideStartedAt)/1000))});
      setGuideStartedAt(null);
    }finally{setChallengeLoading(false);}
  }
  function resetChallenge(){setChallengePrompt("");setChallengeSeconds(null);setChallengeResult(null);setChallengeStartedAt(null);setGuideStartedAt(null);setGuideValues({goal:"",constraints:"",format:""});setHumanOutput("");setGuidedOutput("");}

  const greeting=passport.name ? "Hi "+passport.name.split(" ")[0]+", what are we solving?" : "What are we solving today?";
  const flowStage=directPrompts.length>0?3:situation.trim()?1:0;

  return <main className="min-h-screen bg-background text-foreground">
    <header className="app-header">
      <div className="topbar-inner mx-auto flex h-[72px] max-w-[1440px] items-center justify-between px-5 lg:px-8">
        <button
          onClick={()=>setSidebarOpen(open=>!open)}
          aria-label={sidebarOpen?"Close navigation sidebar":"Open navigation sidebar"}
          aria-expanded={sidebarOpen}
          aria-controls="promptlife-sidebar"
          className="brand-toggle"
        ><Brand/><span className="brand-tooltip" role="tooltip">Let’s turn your thought into a great prompt.</span></button>
        <nav className="topbar-nav hidden items-center gap-1 lg:flex" aria-label="Primary navigation">
          <button onClick={goHome} className="top-link top-link-active">Create</button>
          <a href="/demo" className="top-link demo-link">Demo</a>
          <button onClick={()=>document.getElementById("resources")?.scrollIntoView({behavior:"smooth"})} className="top-link">Prompt library</button>
          <button onClick={()=>document.getElementById("recent")?.scrollIntoView({behavior:"smooth"})} className="top-link">My work</button>
          <button onClick={()=>setPassportOpen(true)} className="top-link">Prompt Passport</button>
        </nav>
        <div className="flex items-center gap-2">
          <Badge className="privacy-chip hidden rounded-full px-3 py-1.5 sm:inline-flex"><ShieldCheck size={13}/> Local-first privacy</Badge>
          <a href="/account" target="_top" className="account-link"><UserRound size={15}/>Account</a>
          <Button variant="outline" size="icon" className="rounded-xl lg:hidden" onClick={()=>setPassportOpen(true)}><Menu size={18}/></Button>
        </div>
      </div>
    </header>

    <PassportSheet open={passportOpen} onOpenChange={setPassportOpen} passport={passport} setPassport={setPassport} save={savePassport}/>

    {!selected ? <div className={"workspace-shell mx-auto grid max-w-[1440px] "+(sidebarOpen?"sidebar-is-open":"sidebar-is-closed")}>
      {sidebarOpen&&<button className="sidebar-scrim lg:hidden" aria-label="Close navigation sidebar" onClick={()=>setSidebarOpen(false)}/>} 
      {sidebarOpen&&<aside id="promptlife-sidebar" className="digital-sidebar min-h-[calc(100vh-72px)] border-r border-border px-5 py-7">
        <p className="sidebar-label px-2">Workspace</p>
        <nav className="mt-2 space-y-1" aria-label="Workspace navigation">
          <button className="side-link side-link-active"><LayoutGrid size={18}/>Discover</button>
          <a href="/demo" className="side-link demo-side-link"><Play size={17}/>Live product demo<span>New</span></a>
          <button onClick={()=>document.getElementById("resources")?.scrollIntoView({behavior:"smooth"})} className="side-link"><Library size={18}/>Prompt library</button>
          <button onClick={()=>document.getElementById("recent")?.scrollIntoView({behavior:"smooth"})} className="side-link"><History size={18}/>Recent work</button>
        </nav>
        <p className="sidebar-label mt-7 px-2">Personalize</p>
        <nav className="mt-2 space-y-1" aria-label="Personalization">
          <button onClick={()=>setPassportOpen(true)} className="side-link"><UserRound size={18}/>Prompt Passport<span className="ml-auto text-xs font-bold text-[#5c5cff]">{passportCompletion}/3</span></button>
        </nav>
        <div className="passport-mini">
          <div className="flex items-center justify-between"><span className="mini-orb"><WandSparkles size={17}/></span><span className="text-xs font-bold text-[#696a80]">{Math.round(passportCompletion/3*100)}%</span></div>
          <h3 className="mt-5 font-extrabold tracking-[-.02em]">{passportCompletion===3?"Your context is ready":"Make every prompt yours"}</h3>
          <p className="mt-2 text-sm leading-5 text-[#696a80]">Add your program and goal once. PromptLife will carry them into every journey.</p>
          <button onClick={()=>setPassportOpen(true)} className="mt-4 text-sm font-extrabold text-[#5656e7]">{passportCompletion===3?"Edit passport":"Set up passport"} →</button>
        </div>
        <div className="mt-6 rounded-2xl border border-[#e5e7ef] p-4">
          <div className="flex gap-3"><ShieldCheck className="mt-0.5 text-[#4c4cd7]" size={18}/><div><p className="text-sm font-bold">Private by design</p><p className="mt-1 text-xs leading-5 text-[#74768a]">Passport details stay on this device in the demo.</p></div></div>
        </div>
      </aside>}

      <section className="workspace-canvas min-w-0 px-5 pb-16 pt-8 sm:px-8 lg:px-10 lg:pt-10">
        <div className="welcome-row"><div className="welcome-copy"><div className="hero-pill"><Sparkles size={14}/> Your AI prompt study buddy</div><h1 className="mt-3 max-w-2xl text-3xl font-medium leading-tight tracking-[-0.045em] sm:text-5xl">{greeting}</h1><p className="mt-4 max-w-2xl text-base leading-7 text-muted-foreground">Bring the messy question. PromptBot turns it into a clear, ready-to-use prompt for ChatGPT, Gemini, Claude, and more.</p><div className="hero-trust"><span>✦ Learn, don’t shortcut</span><span>✦ Copy or open instantly</span><span>✦ You stay in control</span></div></div><div className="promptbot-intro" aria-label="PromptBot, your prompt study buddy"><span className="bot-speech">Let’s turn that thought into a great prompt!</span><div className="bot-glow"></div><img src="/promptbot.png" alt="Friendly PromptBot holding a prompt card"/></div></div>

        <section className="flow-map mt-5" aria-label="Three phases to create and use a prompt">
          <div className={"flow-step "+(flowStage>=0?"flow-step-active":"")}><span>1</span><div><b>Describe</b><small>Tell PromptBot what is happening</small></div></div>
          <i aria-hidden="true"><ChevronRight size={17}/></i>
          <div className={"flow-step "+(flowStage>=3?"flow-step-active":"")}><span>2</span><div><b>Choose</b><small>Review the best prompt approach</small></div></div>
          <i aria-hidden="true"><ChevronRight size={17}/></i>
          <div className={"flow-step "+(flowStage>=3?"flow-step-active":"")}><span>3</span><div><b>Continue</b><small>Copy it or open your preferred AI</small></div></div>
        </section>

        <Card id="create" className="situation-composer mt-6 scroll-mt-24">
          <div className="phase-heading"><span>Phase 1</span><div><b>Describe your situation</b><small>Use normal words—PromptBot will add the structure.</small></div></div>
          <Textarea value={situation} onChange={e=>{setSituation(e.target.value);setFollowUpQuestions([]);setFollowUpAnswers({});}} placeholder="Example: I have an ML exam next Friday, I work part-time, and I am behind on neural networks. Help me prepare without feeling overwhelmed." className="mt-3 min-h-28 resize-none border-0 bg-transparent p-0 text-[1.05rem] leading-7 shadow-none focus-visible:ring-0"/>
          <div className="quick-starters">{starterSituations.map(item=><button key={item} onClick={()=>{setSituation(item);setFollowUpQuestions([]);setFollowUpAnswers({});}}>{item}</button>)}</div>
          {followUpQuestions.length>0&&<div className="adaptive-questions"><div className="adaptive-heading"><span><MessageCircle size={17}/></span><div><b>A few details will make this better</b><p>PromptBot found only the information still missing.</p></div></div><div className="adaptive-fields">{followUpQuestions.map((question,index)=><label key={question.id}><span>{index+1}. {question.label}</span><Input value={followUpAnswers[question.id]||""} onChange={event=>setFollowUpAnswers(current=>({...current,[question.id]:event.target.value}))} placeholder={question.placeholder}/></label>)}</div><button className="skip-questions" onClick={()=>createDirectPrompts(true)} disabled={directLoading}>Skip for now</button></div>}
          {workspaces.length>0&&<label className="workspace-picker"><span><GraduationCap size={15}/>Save to workspace</span><Select value={selectedWorkspaceId} onValueChange={setSelectedWorkspaceId}><SelectTrigger><SelectValue placeholder="Choose workspace"/></SelectTrigger><SelectContent><SelectItem value="none">No workspace</SelectItem>{workspaces.map(workspace=><SelectItem key={workspace.id} value={workspace.id}>{workspace.name}</SelectItem>)}</SelectContent></Select></label>}
          <div className="document-context"><div className="document-context-head"><span><Paperclip size={15}/>Reference files <small>Optional · up to 3</small></span><label className={"upload-file-button "+(uploadingDocument?"uploading":"")}><Upload size={14}/>{uploadingDocument?"Reading file…":"Upload file"}<input type="file" accept=".pdf,.docx,.txt,.md,.csv,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain,text/markdown,text/csv" disabled={uploadingDocument} onChange={event=>{const file=event.target.files?.[0];if(file)uploadDocument(file);event.target.value="";}}/></label></div>{uploadError&&<p className="upload-error">{uploadError}</p>}{documents.length>0&&<div className="document-chips">{documents.slice(0,8).map(document=><button type="button" key={document.id} onClick={()=>toggleDocument(document.id)} className={selectedDocumentIds.includes(document.id)?"selected":""}><FileText size={14}/><span>{document.name}</span>{selectedDocumentIds.includes(document.id)&&<Check size={13}/>}</button>)}</div>}<p className="document-help">PDF, Word, text, Markdown, or CSV. PromptLife extracts text and uses it only when selected.</p></div>
          <div className="accessibility-row"><div className="language-control"><span><Languages size={15}/>Prompt language</span><Select value={promptLanguage} onValueChange={value=>updateAccessibility(value,simpleLanguage)}><SelectTrigger aria-label="Prompt language"><SelectValue/></SelectTrigger><SelectContent><SelectItem value="en">English</SelectItem><SelectItem value="es">Español</SelectItem><SelectItem value="fr">Français</SelectItem><SelectItem value="hi">हिन्दी</SelectItem></SelectContent></Select></div><button type="button" role="switch" aria-checked={simpleLanguage} className={"simple-language-toggle "+(simpleLanguage?"active":"")} onClick={()=>updateAccessibility(promptLanguage,!simpleLanguage)}><Accessibility size={16}/><span><b>Simple language</b><small>Short words, less jargon</small></span><i aria-hidden="true"><em/></i></button></div>
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-[#e8e9ef] pt-4"><p className="text-sm text-muted-foreground">{followUpQuestions.length?"Answer these quick questions, then create your prompt.":"PromptBot asks only when an important detail is missing."}</p><Button onClick={()=>createDirectPrompts()} disabled={!situation.trim()||directLoading||(followUpQuestions.length>0&&followUpQuestions.some(question=>!followUpAnswers[question.id]?.trim()))} className="rounded-xl px-5 font-medium">{directLoading?<><RefreshCw size={16} className="animate-spin"/>{followUpQuestions.length?"Creating…":"Checking…"}</>:followUpQuestions.length?<>Create my prompt <Send size={16}/></>:<>Continue <ArrowRight size={16}/></>}</Button></div>
        </Card>

        <section className="privacy-layer mt-5" aria-label="PromptLife privacy promise">
          <div className="privacy-heading"><span className="privacy-heart">☺</span><div><h2>Your work stays yours.</h2><p>PromptLife is designed to help without building a database about you.</p></div></div>
          <div className="privacy-points">
            <div><Database size={18}/><span><b>Cloud save is optional</b><small>Sign in to keep generated prompts in your private account history. Without sign-in, recent work stays only on this device.</small></span></div>
            <div><HardDrive size={18}/><span><b>Passport stays local</b><small>Your Prompt Passport is kept in your browser on this device, where you can change or remove it.</small></span></div>
            <div><LockKeyhole size={18}/><span><b>You choose where to continue</b><small>We copy the prompt only when you click. After opening another AI service, that provider's privacy terms apply.</small></span></div>
          </div>
        </section>

        {directPrompts.length>0&&(()=>{const item=directPrompts[1]||directPrompts[0];return <section className="prompt-results mt-6"><div className="results-heading"><div><span>Prompt ready</span><h2>Your recommended prompt</h2><p>Review it once, listen to it, then copy or continue in your preferred AI tool.</p></div>{cloudSaveStatus==="saved"&&<span className="cloud-saved"><Check size={14}/>Saved to your account</span>}</div><Card className="direct-prompt-card recommended-prompt-card mt-5"><div className="flex items-center justify-between gap-3"><span className="recommended-label"><Sparkles size={14}/>Recommended</span><div className="prompt-card-actions"><button onClick={()=>speakPrompt(item.prompt)} className={"listen-button "+(speaking?"active":"")} aria-label={speaking?"Stop reading prompt":"Read prompt aloud"}>{speaking?<><Square size={13}/>Stop</>:<><Volume2 size={15}/>Listen</>}</button><button onClick={()=>copyItem("recommended",item.prompt)} className="copy-small">{copiedItem==="recommended"?<><Check size={14}/>Copied</>:<><Clipboard size={14}/>Copy prompt</>}</button></div></div><h2 className="mt-5 text-lg font-medium">{item.label}</h2><p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-[#656779]">{item.prompt}</p><ConnectorRow prompt={item.prompt} compact/></Card></section>})()}

        {savedSessions.length>0&&<section id="recent" className="recent-work mt-10 scroll-mt-24"><div className="flex items-end justify-between gap-3"><div><p className="section-kicker">Saved on this device</p><h2 className="mt-1 text-2xl font-medium">Recent prompt work</h2></div><Badge variant="outline" className="rounded-full bg-white font-normal">{savedSessions.length} saved</Badge></div><div className="mt-4 grid gap-3 md:grid-cols-2">{savedSessions.slice(0,4).map(item=><Card key={item.id} className="recent-card"><button onClick={()=>reopenSession(item)} className="min-w-0 flex-1 text-left"><p className="line-clamp-2 text-sm leading-6">{item.situation}</p><span>{new Date(item.createdAt).toLocaleDateString(undefined,{month:"short",day:"numeric"})} · {item.prompts.length} prompts</span></button><button onClick={()=>removeSession(item.id)} aria-label="Delete saved prompt" className="delete-button"><Trash2 size={15}/></button></Card>)}</div></section>}

        <div className="mt-11 flex flex-col justify-between gap-4 md:flex-row md:items-end"><div><p className="section-kicker">Guided journeys</p><h2 className="mt-1 text-2xl font-medium tracking-[-.025em]">Need more structure?</h2></div><label className="search-box"><Search size={18}/><Input aria-label="Search prompt journeys" value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search journeys..." className="h-11 border-0 bg-transparent px-0 shadow-none focus-visible:ring-0"/>{query&&<button onClick={()=>setQuery("")} aria-label="Clear search"><X size={17}/></button>}</label></div>

        <div className="mt-8 flex gap-2 overflow-x-auto pb-2 scrollbar-none">{categories.map(c=><button key={c} onClick={()=>setCategory(c)} className={"filter-pill "+(category===c?"filter-pill-active":"")}>{c}</button>)}</div>

        {filtered.length ? <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map(j=>{const Icon=j.icon;return <button key={j.id} onClick={()=>choose(j)} className={"advanced-card advanced-"+j.accent+" group text-left "+(j.featured&&category==="All"&&!query?"md:col-span-2":"")}>
            <div className="flex items-start justify-between gap-5"><span className="advanced-icon"><Icon size={21}/></span><span className="time-chip">{j.time}</span></div>
            <div className="mt-9"><p className="section-kicker">{j.eyebrow}</p><h2 className="mt-2 text-[1.55rem] font-black tracking-[-0.04em]">{j.title}</h2><p className="mt-2 max-w-lg text-[.95rem] leading-6 text-[#626477]">{j.description}</p></div>
            <div className="mt-7 flex items-center justify-between"><span className="text-sm font-extrabold">Build this journey</span><span className="arrow-button"><ArrowRight size={17}/></span></div>
          </button>})}
        </div>:<div className="mt-7 rounded-[1.75rem] border border-dashed border-[#cfd3df] bg-white p-12 text-center"><Search className="mx-auto text-[#898ca0]"/><h2 className="mt-4 text-xl font-medium">No journeys found</h2><p className="mt-2 text-muted-foreground">Try another search or category.</p><Button variant="outline" className="mt-5 rounded-xl" onClick={()=>{setQuery("");setCategory("All")}}>Reset filters</Button></div>}

        <section id="resources" className="mt-16 scroll-mt-24"><div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end"><div><p className="section-kicker">Prompt resource library</p><h2 className="mt-1 text-2xl font-medium tracking-[-.025em]">Ready-made prompts for student life</h2><p className="mt-2 text-sm text-muted-foreground">Search, save, copy, or send a prompt straight to your preferred AI assistant.</p></div><Badge variant="outline" className="w-fit rounded-full bg-white px-3 py-1.5 font-normal">{promptResources.length} resources</Badge></div><div className="resource-tools mt-5"><label className="search-box"><Search size={17}/><Input aria-label="Search prompt library" value={resourceQuery} onChange={e=>setResourceQuery(e.target.value)} placeholder="Search prompts..." className="h-11 border-0 bg-transparent px-0 shadow-none focus-visible:ring-0"/></label><div className="flex gap-2 overflow-x-auto scrollbar-none">{categories.map(c=><button key={c} onClick={()=>setResourceCategory(c)} className={"filter-pill "+(resourceCategory===c?"filter-pill-active":"")}>{c}</button>)}</div></div><div className="mt-6 grid gap-3 md:grid-cols-2 xl:grid-cols-3">{visibleResources.map(item=><Card key={item.id} className="resource-card"><div className="flex items-center justify-between gap-3"><span className="resource-category">{item.category}</span><div className="flex gap-2"><button onClick={()=>toggleFavorite(item.id)} aria-label={favorites.includes(item.id)?"Remove bookmark":"Bookmark prompt"} className={"copy-small "+(favorites.includes(item.id)?"saved-button":"")}><Bookmark size={14} fill={favorites.includes(item.id)?"currentColor":"none"}/></button><button onClick={()=>copyItem(item.id,item.prompt)} className="copy-small">{copiedItem===item.id?<><Check size={14}/>Copied</>:<><Clipboard size={14}/>Copy</>}</button></div></div><h3 className="mt-5 text-lg font-medium">{item.title}</h3><p className="mt-3 text-sm leading-6 text-[#666879]">{item.prompt}</p><ConnectorRow prompt={item.prompt} compact/></Card>)}</div>{visibleResources.length===0&&<div className="empty-library">No prompt resources match your search.</div>}</section>
      </section>
    </div> : <JourneyWorkspace journey={selected} values={values} setValues={setValues} completion={completion} tone={tone} setTone={setTone} detail={detail} setDetail={setDetail} loading={loading} generate={generate} result={result} editablePrompt={editablePrompt} setEditablePrompt={setEditablePrompt} copied={copied} copyPrompt={copyPrompt} edit={()=>setResult(null)} back={goHome}/>}
  </main>;
}

export function PromptChallenge({scenario,setScenario,prompt,setPrompt,startedAt,start,finish,humanSeconds,generated,loading,reset,guideStartedAt,startGuide,guideValues,setGuideValues,generateGuide,humanOutput,setHumanOutput,guidedOutput,setGuidedOutput}:any){
  const humanScore=humanSeconds!==null?scorePrompt(prompt,scenario):null;
  const generatedScore=generated?scorePrompt(generated.prompt,scenario):null;
  const humanOutputScore=humanOutput.trim()?scoreOutput(humanOutput,scenario):null;
  const guidedOutputScore=guidedOutput.trim()?scoreOutput(guidedOutput,scenario):null;
  return <section id="challenge" className="challenge-shell mt-16 scroll-mt-24">
    <div className="challenge-intro">
      <div><p className="section-kicker text-[#4b4bc8]">Live comparison experiment</p><h2 className="mt-2 text-3xl font-medium tracking-[-.035em]">Prompt Challenge</h2><p className="mt-3 max-w-2xl text-base leading-7 text-[#666879]">Write the prompt yourself first. PromptLife then solves the same situation and compares time and structure using one transparent rubric.</p></div>
      <div className="challenge-badge"><BarChart3 size={20}/><span><b>6-point rubric</b><small>Not a grade—an explainable demo measure</small></span></div>
    </div>
    <div className="mt-7"><label className="field-label">Choose a student situation</label><Select value={scenario} onValueChange={(value)=>{setScenario(value);reset();}}><SelectTrigger className="mt-2 min-h-12 w-full rounded-xl bg-white text-left"><SelectValue/></SelectTrigger><SelectContent>{challengeScenarios.map(item=><SelectItem key={item} value={item}>{item}</SelectItem>)}</SelectContent></Select></div>
    {humanSeconds===null?<Card className="challenge-write mt-5"><div className="flex flex-wrap items-center justify-between gap-3"><div><p className="section-kicker">Round 1 · Your prompt</p><h3 className="mt-1 text-xl font-medium">How would you ask an AI for help?</h3></div>{startedAt?<span className="timer-live"><Clock3 size={15}/>Timer running</span>:<Button onClick={start} className="rounded-xl"><Play size={15}/>Start challenge</Button>}</div><Textarea value={prompt} onChange={e=>setPrompt(e.target.value)} disabled={!startedAt} placeholder={startedAt?"Write the prompt exactly as you would normally type it…":"Start the challenge to unlock the writing area."} className="mt-5 min-h-36 resize-none rounded-xl bg-[#fbfbfd] p-4 text-base"/><div className="mt-4 flex items-center justify-between gap-3"><p className="text-sm text-muted-foreground">The timer stops only when you finish your prompt.</p><Button onClick={finish} disabled={!startedAt||!prompt.trim()} className="rounded-xl">Finish my prompt <ArrowRight size={15}/></Button></div></Card>:
    !generated?<Card className="challenge-write mt-5"><div className="flex flex-wrap items-center justify-between gap-3"><div><p className="section-kicker">Round 2 · Complete PromptLife workflow</p><h3 className="mt-1 text-xl font-medium">Set up the guided prompt.</h3><p className="mt-2 text-sm text-muted-foreground">This timer includes every choice you make plus generation time.</p></div>{guideStartedAt?<span className="timer-live"><Clock3 size={15}/>Setup timer running</span>:<Button onClick={startGuide} className="rounded-xl"><Play size={15}/>Start PromptLife setup</Button>}</div><div className="guide-fields mt-5"><label><span>What result do you need?</span><Input disabled={!guideStartedAt} value={guideValues.goal} onChange={e=>setGuideValues({...guideValues,goal:e.target.value})} placeholder="A five-day study plan"/></label><label><span>What must the answer respect?</span><Input disabled={!guideStartedAt} value={guideValues.constraints} onChange={e=>setGuideValues({...guideValues,constraints:e.target.value})} placeholder="My work hours and no completed answers"/></label><label><span>How should the result be organized?</span><Input disabled={!guideStartedAt} value={guideValues.format} onChange={e=>setGuideValues({...guideValues,format:e.target.value})} placeholder="Daily checklist with practice questions"/></label></div><div className="mt-4 flex items-center justify-between gap-3"><p className="text-sm text-muted-foreground">All three setup choices are counted in PromptLife’s total time.</p><Button onClick={generateGuide} disabled={!guideStartedAt||Object.values(guideValues).some((value:any)=>!value.trim())||loading} className="rounded-xl">{loading?<><RefreshCw size={15} className="animate-spin"/>Generating…</>:<>Generate and compare <ArrowRight size={15}/></>}</Button></div></Card>:
    <div className="mt-5"><div className="comparison-grid"><ComparisonCard title="Your prompt" eyebrow="Written without guidance" prompt={prompt} seconds={humanSeconds} score={humanScore}/><ComparisonCard title="PromptLife prompt" eyebrow="Setup plus generation included" prompt={generated.prompt} seconds={generated.seconds} score={generatedScore} accent/></div>
      <Card className="comparison-summary mt-4"><div><p className="section-kicker">Fair workflow comparison</p><h3 className="mt-1 text-xl font-medium">Prompt structure changed by {(generatedScore?.total||0)-(humanScore?.total||0)} points.</h3><p className="mt-2 text-sm leading-6 text-muted-foreground">Times include the full work required by each method. Prompt structure is only the first result; test both prompts below to compare the actual AI responses.</p></div><Button variant="outline" onClick={reset} className="rounded-xl"><RotateCcw size={15}/>Run another trial</Button></Card>
      <section className="output-lab mt-4"><div><p className="section-kicker text-[#4b4bc8]">Round 3 · Compare actual AI responses</p><h3 className="mt-2 text-2xl font-medium">Use one AI model for both prompts.</h3><p className="mt-2 text-sm leading-6 text-muted-foreground">Open the same provider from each card, paste the two responses below, and compare their usefulness with the same rubric.</p></div><div className="output-grid mt-5"><OutputPanel title="Response from your prompt" value={humanOutput} setValue={setHumanOutput} score={humanOutputScore}/><OutputPanel title="Response from PromptLife" value={guidedOutput} setValue={setGuidedOutput} score={guidedOutputScore} accent/></div>{humanOutputScore&&guidedOutputScore&&<div className="output-verdict"><Target size={20}/><div><b>{guidedOutputScore.total>humanOutputScore.total?"PromptLife produced the more useful response in this trial.":guidedOutputScore.total===humanOutputScore.total?"Both responses scored equally in this trial.":"The self-written prompt produced the more useful response in this trial."}</b><span>Difference: {Math.abs(guidedOutputScore.total-humanOutputScore.total)} points. Repeat across students before drawing a general conclusion.</span></div></div>}</section>
    </div>}
  </section>
}

function OutputPanel({title,value,setValue,score,accent=false}:{title:string;value:string;setValue:(value:string)=>void;score:PromptScore|null;accent?:boolean}){
  return <Card className={"output-panel "+(accent?"output-panel-accent":"")}><div className="flex items-center justify-between gap-3"><h4 className="font-medium">{title}</h4>{score&&<span className="output-score">{score.total}/100</span>}</div><Textarea value={value} onChange={e=>setValue(e.target.value)} placeholder="Paste the AI response here…" className="mt-3 min-h-48 resize-y rounded-xl bg-[#fafbfe] p-3"/>{score&&<div className="rubric-grid">{score.checks.map(item=><span key={item.label} className={item.passed?"rubric-pass":"rubric-miss"}>{item.passed?<Check size={13}/>:<X size={13}/>} {item.label}</span>)}</div>}</Card>
}

function ComparisonCard({title,eyebrow,prompt,seconds,score,accent=false}:{title:string;eyebrow:string;prompt:string;seconds:number;score:PromptScore|null;accent?:boolean}){
  return <Card className={"comparison-card "+(accent?"comparison-card-accent":"")}><div className="flex items-start justify-between gap-3"><div><p className="section-kicker">{eyebrow}</p><h3 className="mt-1 text-xl font-medium">{title}</h3></div><div className="score-orb"><b>{score?.total||0}</b><small>/100</small></div></div><div className="metric-row"><span><Clock3 size={15}/>Time</span><b>{seconds<1?seconds.toFixed(1):Math.round(seconds)} sec</b></div><div className="rubric-grid">{score?.checks.map(item=><span key={item.label} className={item.passed?"rubric-pass":"rubric-miss"}>{item.passed?<Check size={13}/>:<X size={13}/>} {item.label}</span>)}</div><p className="comparison-prompt">{prompt}</p><ConnectorRow prompt={prompt} compact/></Card>
}

function JourneyWorkspace({journey,values,setValues,completion,tone,setTone,detail,setDetail,loading,generate,result,editablePrompt,setEditablePrompt,copied,copyPrompt,edit,back}:any){
  const Icon=journey.icon;
  return <section className="mx-auto max-w-[1280px] px-5 py-7 sm:px-8 lg:py-10">
    <button onClick={back} className="inline-flex items-center gap-2 text-sm font-extrabold text-muted-foreground hover:text-foreground"><ArrowLeft size={16}/> Back to journeys</button>
    <div className="mt-7 grid gap-7 lg:grid-cols-[330px_minmax(0,1fr)]">
      <aside className="lg:sticky lg:top-28 lg:self-start">
        <div className={"journey-summary advanced-"+journey.accent}><span className="advanced-icon"><Icon size={21}/></span><p className="section-kicker mt-9">{journey.eyebrow}</p><h1 className="mt-2 text-3xl font-black tracking-[-.05em]">{journey.title}</h1><p className="mt-3 text-sm leading-6 text-[#626477]">{journey.description}</p><div className="mt-7 border-t border-black/10 pt-5"><div className="mb-2 flex justify-between text-sm font-bold"><span>Context ready</span><span>{completion}%</span></div><Progress value={completion} className="h-2 bg-white/60"/></div></div>
        <div className="mt-4 rounded-2xl border border-border bg-white p-5"><div className="flex gap-3"><ShieldCheck size={18} className="mt-0.5 text-[#5656e7]"/><div><p className="text-sm font-bold">You stay in control</p><p className="mt-1 text-xs leading-5 text-muted-foreground">Review and edit every generated prompt before using it.</p></div></div></div>
      </aside>
      <div>{!result?<Card className="studio-card">
        <div className="flex items-start justify-between gap-4"><div><p className="section-kicker text-[#5656e7]">Step 1 · Add context</p><h2 className="mt-2 text-3xl font-black tracking-[-0.045em]">Make it specific to you.</h2></div><span className="hidden rounded-xl bg-[#f1f1ff] p-2.5 text-[#5656e7] sm:grid"><PencilLine size={20}/></span></div>
        <div className="mt-8 space-y-6">{journey.questions.map((q:any,i:number)=><label key={q.key} className="block"><span className="mb-2.5 flex items-center gap-2 text-sm font-bold"><b className="question-number">{i+1}</b>{q.label}</span>{q.multiline?<Textarea value={values[q.key]||""} onChange={e=>setValues({...values,[q.key]:e.target.value})} placeholder={q.placeholder} className="min-h-32 resize-none rounded-2xl bg-[#fafbff] p-4 text-base"/>:<Input value={values[q.key]||""} onChange={e=>setValues({...values,[q.key]:e.target.value})} placeholder={q.placeholder} className="h-12 rounded-2xl bg-[#fafbff] px-4 text-base"/>}</label>)}</div>
        <div className="mt-8 rounded-2xl border border-[#e4e5ee] bg-[#f8f9fc] p-4"><p className="text-sm font-extrabold">Shape the response</p><div className="mt-3 grid gap-3 sm:grid-cols-2"><Preference label="Tone" value={tone} onChange={setTone} items={[["clear","Clear & direct"],["warm","Warm & encouraging"],["formal","Formal & polished"]]}/><Preference label="Detail" value={detail} onChange={setDetail} items={[["brief","Brief"],["balanced","Balanced"],["deep","Deep dive"]]}/></div></div>
        <Button onClick={generate} disabled={completion<100||loading} className="mt-7 h-13 w-full rounded-2xl text-base font-extrabold">{loading?<><RefreshCw className="animate-spin" size={17}/>Building your journey…</>:<>Create my prompt <WandSparkles size={17}/></>}</Button>
      </Card>:<div className="space-y-5">
        <Card className="studio-card overflow-hidden p-0"><div className="border-b border-border bg-[#f7f7ff] p-6 sm:p-8"><div className="flex flex-wrap items-start justify-between gap-4"><div><Badge className="rounded-full bg-[#dcfaec] text-[#176b4f] hover:bg-[#dcfaec]"><Check size={13}/> Ready to use</Badge><h2 className="mt-3 text-3xl font-black tracking-[-0.045em]">{result.title}</h2></div><Button variant="outline" onClick={edit} className="rounded-xl"><PencilLine size={15}/>Edit context</Button></div></div>
          <div className="p-6 sm:p-8"><div className="flex items-center justify-between gap-4"><div><p className="section-kicker">Prompt studio</p><p className="mt-1 text-sm text-muted-foreground">Edit anything before you continue.</p></div><Button onClick={copyPrompt} className="rounded-xl">{copied?<><Check size={15}/>Copied</>:<><Clipboard size={15}/>Copy prompt</>}</Button></div><Textarea aria-label="Editable generated prompt" value={editablePrompt} onChange={e=>setEditablePrompt(e.target.value)} className="prompt-editor mt-5"/><ConnectorRow prompt={editablePrompt}/></div>
        </Card>
        <div className="grid gap-5 xl:grid-cols-[1.1fr_.9fr]"><Card className="rounded-[1.6rem] bg-white p-6"><p className="section-kicker">Run the journey</p><div className="mt-5 space-y-5">{result.steps.map((s:any,i:number)=><div key={s.title} className="flex gap-3"><span className="step-number">{i+1}</span><div><h3 className="text-sm font-extrabold">{s.title}</h3><p className="mt-1 text-sm leading-5 text-muted-foreground">{s.detail}</p></div></div>)}</div></Card><Card className="nutrition-card"><div className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-xl bg-white text-[#5656e7]"><ShieldCheck size={20}/></span><div><p className="section-kicker">Prompt nutrition</p><h3 className="font-extrabold">Know before you use</h3></div></div><div className="mt-5 space-y-2"><RiskRow label="Data sensitivity" value={result.label.sensitivity}/><RiskRow label="Human verification" value={result.label.verify}/><RiskRow label="AI error risk" value={result.label.risk}/></div><p className="mt-4 text-xs leading-5 text-[#61647a]">{result.label.note}</p></Card></div>
      </div>}</div>
    </div>
  </section>
}

function Preference({label,value,onChange,items}:any){return <label><span className="mb-1.5 block text-xs font-bold text-muted-foreground">{label}</span><Select value={value} onValueChange={onChange}><SelectTrigger className="h-11 w-full rounded-xl bg-white"><SelectValue/></SelectTrigger><SelectContent>{items.map((x:string[])=><SelectItem key={x[0]} value={x[0]}>{x[1]}</SelectItem>)}</SelectContent></Select></label>}
function RiskRow({label,value}:{label:string;value:string}){return <div className="flex items-center justify-between rounded-xl bg-white/70 px-3 py-2.5 text-sm"><span className="text-[#686a7e]">{label}</span><b>{value}</b></div>}

const providers = [
  {name:"ChatGPT",mark:"C",url:"https://chatgpt.com/",color:"#1f8f70",prefill:true},
  {name:"Gemini",mark:"G",url:"https://gemini.google.com/app",color:"#356bd8",prefill:false},
  {name:"Claude",mark:"A",url:"https://claude.ai/new",color:"#b65f3b",prefill:false},
  {name:"Perplexity",mark:"P",url:"https://www.perplexity.ai/",color:"#168c94",prefill:true},
  {name:"Copilot",mark:"M",url:"https://copilot.microsoft.com/",color:"#7356c9",prefill:true}
];

function ConnectorRow({prompt,compact=false}:{prompt:string;compact?:boolean}){
  const [opened,setOpened]=useState("");
  const [showAll,setShowAll]=useState(false);
  async function launch(provider:typeof providers[number]){
    const destination=provider.prefill?provider.url+"?q="+encodeURIComponent(prompt):provider.url;
    window.open(destination,"_blank","noopener,noreferrer");
    try { await navigator.clipboard.writeText(prompt); } catch {}
    setOpened(provider.prefill?provider.name+" opened with prompt":provider.name+" opened — prompt copied");
    window.setTimeout(()=>setOpened(""),2200);
  }
  return <div className={compact?"connector-wrap connector-compact":"connector-wrap"}>
    <div className="flex items-center justify-between gap-3"><div><p className="connector-title">Continue in your AI tool</p>{!compact&&<p className="connector-note">Supported chats open with the prompt ready. For restricted chats, the prompt is copied so you only need to paste.</p>}</div>{opened&&<span className="opened-note"><Check size={13}/>{opened}</span>}</div>
    <div className="connector-grid">{(compact&&!showAll?providers.slice(0,2):providers).map(provider=><button key={provider.name} onClick={()=>launch(provider)} className="provider-button" aria-label={(provider.prefill?"Open with prompt in ":"Copy prompt and open ")+provider.name}><span className="provider-mark" style={{background:provider.color}}>{provider.mark}</span><span>{provider.name}</span><small>{provider.prefill?"Ready":"Paste"}</small><ExternalLink size={13}/></button>)}{compact&&<button className="more-tools-button" onClick={()=>setShowAll(value=>!value)}>{showAll?"Show fewer":"More AI tools"}</button>}</div>
  </div>
}

function PassportSheet({open,onOpenChange,passport,setPassport,save}:any){
  return <Sheet open={open} onOpenChange={onOpenChange}><SheetContent className="w-full overflow-y-auto border-l border-border bg-[#f8f9fd] p-0 sm:max-w-md"><SheetHeader className="border-b border-border bg-white p-6 text-left"><SheetTitle className="flex items-center gap-3"><span className="mini-orb"><UserRound size={17}/></span>Prompt Passport</SheetTitle></SheetHeader><div className="p-6"><p className="text-sm leading-6 text-muted-foreground">Save a small amount of context on this device so every journey starts closer to you.</p><div className="mt-7 space-y-5"><label className="block"><span className="field-label">First name</span><Input value={passport.name} onChange={e=>setPassport({...passport,name:e.target.value})} placeholder="Rashmi" className="mt-2 h-12 rounded-xl bg-white"/></label><label className="block"><span className="field-label">Program or field</span><Input value={passport.program} onChange={e=>setPassport({...passport,program:e.target.value})} placeholder="M.S. Artificial Intelligence" className="mt-2 h-12 rounded-xl bg-white"/></label><label className="block"><span className="field-label">Current main goal</span><Textarea value={passport.goal} onChange={e=>setPassport({...passport,goal:e.target.value})} placeholder="Prepare for AI/ML roles while completing my research." className="mt-2 min-h-28 resize-none rounded-xl bg-white p-3"/></label></div><div className="mt-6 rounded-xl border border-[#d9dcff] bg-[#eeeeff] p-4"><p className="text-xs leading-5 text-[#5c5e79]"><b className="text-[#3f40af]">Demo privacy:</b> This passport is stored only in your current browser and can be edited anytime.</p></div><Button onClick={save} className="mt-6 h-12 w-full rounded-xl font-extrabold">Save passport <ChevronRight size={16}/></Button></div></SheetContent></Sheet>
}
