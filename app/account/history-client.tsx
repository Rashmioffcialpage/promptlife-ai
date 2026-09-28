"use client";

import { useEffect, useMemo, useState } from "react";
import { BookOpen, BriefcaseBusiness, Check, Clipboard, Cloud, FolderPlus, GraduationCap, Heart, Microscope, Target, Trash2, UserRound } from "lucide-react";
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

export type CloudPrompt = { id: string; situation: string; title: string; prompt: string; workspaceId: string | null; inputScore: number | null; createdAt: string };
export type StudentWorkspace = { id: string; name: string; type: string; createdAt: string };

const resourceNames: Record<string, { title: string; category: string }> = {
  "study-plan": { title: "Build a study plan", category: "Academics" }, "explain-topic": { title: "Explain a difficult concept", category: "Academics" }, "practice-test": { title: "Create a practice test", category: "Academics" }, "paper-map": { title: "Map a research paper", category: "Research" }, "literature-review": { title: "Plan a literature review", category: "Research" }, experiment: { title: "Design an experiment", category: "Research" }, "resume-match": { title: "Match résumé to a job", category: "Career" }, interview: { title: "Run a mock interview", category: "Career" }, networking: { title: "Write a networking message", category: "Career" }, "professor-email": { title: "Email a professor", category: "Communication" }, presentation: { title: "Prepare a presentation", category: "Communication" }, "weekly-reset": { title: "Plan a realistic week", category: "Organization" }, "team-conflict": { title: "Handle a team problem", category: "Communication" }, decision: { title: "Make a difficult decision", category: "Organization" },
};

const skillChecks = [
  { name: "Clear goal", test: (value: string) => /(help|create|build|draft|compare|explain|plan|prepare|write|review|organize|understand)/.test(value) },
  { name: "Useful context", test: (value: string) => value.split(/\s+/).filter(Boolean).length >= 14 },
  { name: "Constraints", test: (value: string) => /(without|must|only|avoid|limit|budget|beginner|advanced|part.time|available)/.test(value) },
  { name: "Timeline", test: (value: string) => /(today|tomorrow|this week|next week|monday|tuesday|wednesday|thursday|friday|deadline|due|\d+\s*(day|week|hour|minute))/i.test(value) },
  { name: "Output format", test: (value: string) => /(step|table|list|outline|email|plan|summary|bullet|checklist|questions|format)/.test(value) },
];

function fallbackScore(value: string) { return skillChecks.filter((skill) => skill.test(value.toLowerCase())).length * 20; }

export function HistoryClient({ initialItems, initialWorkspaces }: { initialItems: CloudPrompt[]; initialWorkspaces: StudentWorkspace[] }) {
  const [items, setItems] = useState(initialItems);
  const [workspaces, setWorkspaces] = useState(initialWorkspaces);
  const [activeWorkspace, setActiveWorkspace] = useState("all");
  const [workspaceName, setWorkspaceName] = useState("");
  const [workspaceType, setWorkspaceType] = useState("course");
  const [creatingWorkspace, setCreatingWorkspace] = useState(false);
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);
  const [passportComplete, setPassportComplete] = useState(0);
  const [copied, setCopied] = useState("");
  const [deleting, setDeleting] = useState("");

  useEffect(() => {
    try {
      const favorites = JSON.parse(localStorage.getItem("promptlife-favorites") || "[]");
      if (Array.isArray(favorites)) setFavoriteIds(favorites.filter((id): id is string => typeof id === "string"));
      const passport = JSON.parse(localStorage.getItem("promptlife-passport") || "{}");
      setPassportComplete([passport.name, passport.program, passport.goal].filter((value) => typeof value === "string" && value.trim()).length);
    } catch {}
  }, []);

  const favorites = favoriteIds.map((id) => ({ id, ...resourceNames[id] })).filter((item) => item.title);
  const activeThisWeek = useMemo(() => items.filter((item) => Date.now() - new Date(item.createdAt).getTime() < 604800000).length, [items]);
  const chronological = [...items].reverse();
  const chartData = chronological.slice(-10).map((item, index) => ({ label: String(index + 1), score: item.inputScore ?? fallbackScore(item.situation), title: item.title }));
  const currentScore = chartData.at(-1)?.score ?? 0;
  const firstScore = chartData[0]?.score ?? 0;
  const improvement = chartData.length > 1 ? currentScore - firstScore : 0;
  const recentInputs = items.slice(0, 10);
  const skillProgress = skillChecks.map((skill) => ({ name: skill.name, score: recentInputs.length ? Math.round(recentInputs.filter((item) => skill.test(item.situation.toLowerCase())).length / recentInputs.length * 100) : 0 }));
  const visibleItems = activeWorkspace === "all" ? items : items.filter((item) => item.workspaceId === activeWorkspace);

  async function copy(id: string, prompt: string) { await navigator.clipboard.writeText(prompt); setCopied(id); window.setTimeout(() => setCopied(""), 1400); }
  async function remove(id: string) { setDeleting(id); const response = await fetch("/api/prompts", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) }); if (response.ok) setItems((current) => current.filter((item) => item.id !== id)); setDeleting(""); }
  function removeFavorite(id: string) { const next = favoriteIds.filter((favoriteId) => favoriteId !== id); setFavoriteIds(next); localStorage.setItem("promptlife-favorites", JSON.stringify(next)); }
  async function createWorkspace() {
    if (!workspaceName.trim()) return;
    setCreatingWorkspace(true);
    const response = await fetch("/api/workspaces", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: workspaceName, type: workspaceType }) });
    if (response.ok) { const data = await response.json(); setWorkspaces((current) => [data.item, ...current]); setWorkspaceName(""); }
    setCreatingWorkspace(false);
  }
  async function removeWorkspace(id: string) {
    const response = await fetch("/api/workspaces", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
    if (response.ok) { setWorkspaces((current) => current.filter((item) => item.id !== id)); setItems((current) => current.map((item) => item.workspaceId === id ? { ...item, workspaceId: null } : item)); if (activeWorkspace === id) setActiveWorkspace("all"); }
  }
  const workspaceIcon = (type: string) => type === "research" ? <Microscope size={17}/> : type === "career" ? <BriefcaseBusiness size={17}/> : <GraduationCap size={17}/>;

  return <section className="dashboard-shell">
    <div className="dashboard-title"><div><p className="section-kicker">Your workspace</p><h1>Personal dashboard</h1><p>Pick up where you left off and keep building better prompts.</p></div><a href="/">Create a prompt</a></div>
    <div className="dashboard-stats">
      <article><span className="stat-icon stat-purple"><Cloud size={19}/></span><div><b>{items.length}</b><small>Cloud prompts</small></div></article>
      <article><span className="stat-icon stat-pink"><Heart size={19}/></span><div><b>{favorites.length}</b><small>Favorites</small></div></article>
      <article><span className="stat-icon stat-cyan"><Target size={19}/></span><div><b>{activeThisWeek}</b><small>This week</small></div></article>
    </div>
    <section className="learning-progress-panel">
      <div className="learning-heading"><div><p className="section-kicker">Learning progress</p><h2>Your prompting skills over time</h2><p>Scores reflect the clarity, context, constraints, timeline, and format in your original request.</p></div><div className="learning-score"><strong>{currentScore}</strong><span>current score</span>{chartData.length>1&&<small className={improvement>=0?"positive":""}>{improvement>=0?"+":""}{improvement} points</small>}</div></div>
      {chartData.length>1?<div className="learning-grid"><div className="learning-chart" aria-label="Prompt skill score trend"><ResponsiveContainer width="100%" height={190}><LineChart data={chartData} margin={{top:10,right:12,left:-24,bottom:0}}><XAxis dataKey="label" axisLine={false} tickLine={false} tick={{fontSize:11,fill:"#898da0"}}/><YAxis domain={[0,100]} ticks={[0,20,40,60,80,100]} axisLine={false} tickLine={false} tick={{fontSize:10,fill:"#9a9daf"}}/><Tooltip contentStyle={{border:"1px solid #dedff0",borderRadius:10,fontSize:12}} formatter={(value)=>[`${value}/100`,"Skill score"]}/><Line type="monotone" dataKey="score" stroke="#5b54df" strokeWidth={3} dot={{r:4,fill:"#5b54df",strokeWidth:2,stroke:"#fff"}} activeDot={{r:5}}/></LineChart></ResponsiveContainer><p>Each point is one saved prompt, from oldest to newest.</p></div><div className="skill-breakdown">{skillProgress.map((skill)=><div key={skill.name}><span><b>{skill.name}</b><small>{skill.score}%</small></span><i><em style={{width:`${skill.score}%`}}/></i></div>)}</div></div>:<div className="learning-empty"><Target size={21}/><div><b>{chartData.length?"Create one more prompt to see your trend":"Your first score will appear here"}</b><p>PromptLife will show improvement after each signed-in prompt.</p></div></div>}
    </section>
    <section className="workspace-panel">
      <div className="dashboard-section-head"><div><p className="section-kicker">Organize your work</p><h2>Course workspaces</h2></div><span>{workspaces.length} folders</span></div>
      <div className="workspace-create"><input value={workspaceName} onChange={(event) => setWorkspaceName(event.target.value)} placeholder="Workspace name, such as CS 641 or MDD research"/><select value={workspaceType} onChange={(event) => setWorkspaceType(event.target.value)}><option value="course">Course</option><option value="research">Research</option><option value="career">Career goal</option></select><button onClick={createWorkspace} disabled={!workspaceName.trim() || creatingWorkspace}><FolderPlus size={16}/>{creatingWorkspace ? "Adding…" : "Add workspace"}</button></div>
      <div className="workspace-tabs"><button className={activeWorkspace === "all" ? "active" : ""} onClick={() => setActiveWorkspace("all")}><Cloud size={16}/><span><b>All prompts</b><small>{items.length} prompts</small></span></button>{workspaces.map((workspace) => <button key={workspace.id} className={activeWorkspace === workspace.id ? "active" : ""} onClick={() => setActiveWorkspace(workspace.id)}>{workspaceIcon(workspace.type)}<span><b>{workspace.name}</b><small>{workspace.type} · {items.filter((item) => item.workspaceId === workspace.id).length} prompts</small></span><i onClick={(event) => { event.stopPropagation(); removeWorkspace(workspace.id); }} aria-label={`Delete ${workspace.name}`}><Trash2 size={14}/></i></button>)}</div>
    </section>
    <div className="dashboard-columns">
      <section className="dashboard-section">
        <div className="dashboard-section-head"><div><p className="section-kicker">Cloud history</p><h2>{activeWorkspace === "all" ? "Recent prompts" : workspaces.find((item) => item.id === activeWorkspace)?.name || "Workspace prompts"}</h2></div><span>{visibleItems.length} saved</span></div>
        {visibleItems.length === 0 ? <div className="dashboard-empty"><Cloud size={22}/><b>No prompts here yet</b><p>Choose this workspace when creating your next prompt.</p><a href="/">Create a prompt</a></div> : <div className="dashboard-list">{visibleItems.slice(0, 6).map((item) => <article key={item.id} className="dashboard-prompt">
          <div className="dashboard-item-top"><div><span>{new Date(item.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric" })}</span><h3>{item.title}</h3></div><button onClick={() => remove(item.id)} disabled={deleting === item.id} aria-label="Delete saved prompt"><Trash2 size={15}/></button></div>
          <p>{item.situation}</p><details><summary>View prompt</summary><div>{item.prompt}</div></details><button className="dashboard-copy" onClick={() => copy(item.id, item.prompt)}>{copied === item.id ? <><Check size={14}/>Copied</> : <><Clipboard size={14}/>Copy</>}</button>
        </article>)}</div>}
      </section>
      <section className="dashboard-section">
        <div className="dashboard-section-head"><div><p className="section-kicker">Prompt library</p><h2>Favorites</h2></div><span>{favorites.length} saved</span></div>
        {favorites.length === 0 ? <div className="dashboard-empty"><Heart size={22}/><b>No favorites yet</b><p>Bookmark useful prompts from the library for quick access.</p><a href="/#resources">Browse library</a></div> : <div className="favorite-list">{favorites.map((item) => <article key={item.id}><span className="favorite-icon"><BookOpen size={16}/></span><div><small>{item.category}</small><h3>{item.title}</h3></div><button onClick={() => removeFavorite(item.id)} aria-label={`Remove ${item.title} from favorites`}><Trash2 size={15}/></button></article>)}</div>}
        <a className="library-link" href="/#resources">Open prompt library →</a>
        <div className="passport-progress"><span><UserRound size={17}/></span><div><b>Prompt Passport</b><p>{passportComplete}/3 details completed on this device</p></div><a href="/">Edit</a></div>
      </section>
    </div>
  </section>;
}
