"use client";

import { useEffect, useRef, useState, type FormEvent, type ReactNode } from "react";
import { CalendarDays, ClipboardList, FilePlus, Plus } from "lucide-react";
import { z } from "zod";
import { browserWorkKey, pendingTemplateKey } from "@/lib/browser-work";
import { assignmentBrief, assignmentEntry, createAssignment, helpOptions, instructorShare, permissions, sampleAssignment, types, type Assignment, type Brief, type UseRecord } from "@/lib/assignment-workspace";

const emptyBrief: Brief = { title: "", course: "", due: "", type: "Essay", instructions: "", permission: "Not confirmed", rules: "", help: [] };
const recordFields = {
  request: "Original request", assistance: "Assistance received", sources: "Sources suggested",
  verify: "What I need to verify independently",
} as const;
const dateFormat = new Intl.DateTimeFormat(undefined, { dateStyle: "medium" });
const timeFormat = new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" });

function progress(item: Assignment) {
  return Math.round(item.plan.steps.filter((_, index) => item.completed.includes(index)).length / item.plan.steps.length * 100);
}

function dueLabel(value: string) {
  return dateFormat.format(new Date(value + "T00:00:00"));
}

function Field({ name, children }: { name: string; children: ReactNode }) {
  return <label className="aw-field"><span>{name}</span>{children}</label>;
}

function ListSection({ title, items }: { title: string; items: string[] }) {
  return <section className="aw-guide"><h3>{title}</h3><ul>{items.map(item => <li key={item}>{item}</li>)}</ul></section>;
}

async function copy(text: string) {
  await navigator.clipboard.writeText(text);
}

function download(name: string, type: string, content: string) {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const link = document.createElement("a");
  link.href = url;
  link.download = name;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function recordText(record: UseRecord, title: string) {
  return [`# AI Use Record — ${title}`, `Date and time: ${timeFormat.format(new Date(record.time))} (${record.time})`,
    ...Object.entries(recordFields).map(([field, label]) => `## ${label}\n${record[field as keyof typeof recordFields]}`),
  ].join("\n\n");
}

export default function AssignmentWorkspace({ userId }: { userId: string }) {
  const key = browserWorkKey("promptlife-assignments-v1", userId);
  const [items, setItems] = useState<Assignment[]>([]);
  const [view, setView] = useState<"dashboard" | "new" | "detail">("dashboard");
  const [draft, setDraft] = useState<Brief>(emptyBrief);
  const [selected, setSelected] = useState("");
  const [instructor, setInstructor] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [storageBlocked, setStorageBlocked] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const heading = useRef<HTMLHeadingElement>(null);
  const item = items.find(entry => entry.id === selected);

  useEffect(() => {
    let active = true;
    queueMicrotask(() => {
      if (!active) return;
      try {
        const saved = localStorage.getItem(key);
        if (saved) setItems(z.array(assignmentEntry).parse(JSON.parse(saved)));
      } catch {
        setStorageBlocked(true);
      }
      let templateHash = window.location.hash;
      try {
        templateHash ||= sessionStorage.getItem(pendingTemplateKey) ?? "";
        sessionStorage.removeItem(pendingTemplateKey);
      } catch {}
      const shared = new URLSearchParams(templateHash.slice(1)).get("template");
      if (shared !== null) {
        try {
          if (shared.length > 120000) throw new Error("Template is too large");
          const template = instructorShare.parse(JSON.parse(shared));
          setDraft(template.brief);
          setInstructor(template.instructor);
          setView("new");
        } catch {
          setError("This instructor template link is incomplete or invalid.");
        }
        window.history.replaceState(window.history.state, "", location.pathname + location.search);
      }
      setReady(true);
    });
    return () => { active = false; };
  }, [key]);

  function go(next: typeof view) {
    setView(next);
    setMessage("");
    setError("");
    requestAnimationFrame(() => heading.current?.focus());
  }

  function save(next: Assignment[]) {
    if (storageBlocked) return false;
    try {
      localStorage.setItem(key, JSON.stringify(next));
      setItems(next);
      return true;
    } catch {
      setError("This browser couldn’t save changes. Your previous saved work is still available.");
      return false;
    }
  }

  function start() {
    setDraft({ ...emptyBrief, help: [] });
    setInstructor(null);
    go("new");
  }

  function add(brief: Brief) {
    const entry = createAssignment(brief, instructor);
    if (!save([entry, ...items])) return;
    setSelected(entry.id);
    go("detail");
    setMessage("Assignment plan ready. Your AI Use Record was created.");
  }

  function update(next: Assignment) {
    return save(items.map(entry => entry.id === next.id ? next : entry));
  }

  return <main className="aw-page">
    <div className="aw-wrap">
      <header className="aw-header">
        <a href="/" className="aw-brand"><img src="/student-help-mascot-auth.webp" width={36} height={36} alt=""/>PromptLife <span>AI</span></a>
        <a href="/" className="aw-home">Back to PromptLife</a>
      </header>
      <div className="aw-hero">
        <div><h1>Assignment Workspace</h1><p>Turn your instructions into a work plan and keep a record of the help you use.</p></div>
        <button className="aw-button aw-primary" onClick={start} disabled={!ready || storageBlocked || view === "new"}><Plus size={18} aria-hidden="true"/>New Assignment</button>
      </div>
      <p className="aw-local">Assignments are saved in this browser.</p>
      {view !== "dashboard" && <button className="aw-back" onClick={() => go("dashboard")}>Back to assignments</button>}
      {storageBlocked && <p className="aw-notice aw-error" role="alert">Saved assignments couldn’t be read. Saving is paused to protect existing browser data.</p>}
      {message && <p className="aw-notice" role="status">{message}</p>}
      {error && <p className="aw-notice aw-error" role="alert">{error}</p>}

      {view === "dashboard" && <section className="aw-panel" aria-labelledby="aw-heading">
        <h2 id="aw-heading" tabIndex={-1} ref={heading}>Your assignments</h2>
        {!ready ? <p>Loading saved assignments…</p> : storageBlocked ? null : items.length ? <ul className="aw-list">
          {items.map(entry => <li key={entry.id} className="aw-assignment">
            <div className="aw-assignment-top">
              <div><h3>{entry.brief.title}</h3><p>{entry.brief.course}</p></div>
              <button className="aw-button" onClick={() => { setSelected(entry.id); go("detail"); }} aria-label={`Open ${entry.brief.title}`}>Open</button>
            </div>
            <div className="aw-meta"><span><CalendarDays size={16} aria-hidden="true"/> {dueLabel(entry.brief.due)}</span><span className="aw-pill">AI use: {entry.brief.permission}</span>{entry.instructor && <span className="aw-pill aw-approved">Professor-approved template</span>}</div>
            <label className="aw-progress">Progress · {progress(entry)}%<progress max={100} value={progress(entry)} /></label>
          </li>)}
        </ul> : <div className="aw-empty">
          <ClipboardList size={30} aria-hidden="true"/><h3>No assignments yet</h3>
          <p>Add your own instructions or try a fictional first-year writing assignment inspired by common campus coursework.</p>
          <div className="aw-actions"><button className="aw-button aw-primary" onClick={start}>Add an assignment</button><button className="aw-button" onClick={() => { setDraft(sampleAssignment()); setInstructor(null); go("new"); }}>Try sample assignment</button></div>
        </div>}
      </section>}

      {view === "new" && <section className="aw-panel" aria-labelledby="aw-heading">
        <h2 id="aw-heading" tabIndex={-1} ref={heading}>{instructor ? "Use instructor template" : "New Assignment"}</h2>
        {instructor && <div className="aw-notice"><span className="aw-pill aw-approved">Professor-approved template</span><p>Shared as approved by {instructor}. The sender’s identity is unverified.</p></div>}
        <BriefForm storageBlocked={storageBlocked} draft={draft} setDraft={setDraft} instructor={instructor} onCreate={add} />
      </section>}

      {view === "detail" && item && <>
        <section className="aw-panel" aria-labelledby="aw-heading">
          <h2 id="aw-heading" tabIndex={-1} ref={heading}>{item.brief.title}</h2>
          <p>{item.brief.course} · {item.brief.type} · Due {dueLabel(item.brief.due)}</p>
          <div className="aw-meta"><span className="aw-pill">AI use: {item.brief.permission}</span>{item.instructor && <span className="aw-pill aw-approved">Professor-approved template</span>}</div>
          {item.instructor && <p className="aw-muted">Shared as approved by {item.instructor}. The sender’s identity is unverified.</p>}
          <details className="aw-brief"><summary>Assignment instructions and AI-use rules</summary><p>{item.brief.instructions}</p><p>{item.brief.rules || "No professor rules were entered."}</p></details>
          <section className="aw-guide"><h3>What the assignment asks</h3><p className="aw-preline">{item.plan.interpretation}</p></section>
          <fieldset className="aw-work-plan">
            <legend>Step-by-step work plan</legend>
            <label className="aw-progress">Progress · {progress(item)}%<progress max={100} value={progress(item)} /></label>
            <ol>{item.plan.steps.map((step, index) => <li key={step}><label className="aw-check"><input type="checkbox" checked={item.completed.includes(index)} onChange={event => update({ ...item, completed: event.target.checked ? [...item.completed, index] : item.completed.filter(value => value !== index) })}/><span>{step}</span></label></li>)}</ol>
          </fieldset>
          <div className="aw-columns">
            <ListSection title="Suggested research questions" items={item.plan.research}/>
            <section className="aw-guide"><h3>Questions to ask for help</h3><ul>{item.plan.questions.map(question => <li key={question.whom}><strong>{question.whom}</strong> · {question.question}</li>)}</ul></section>
            <ListSection title="Source-verification checklist" items={item.plan.sourceChecks}/>
            <ListSection title="Responsible AI-use checklist" items={item.plan.useChecks}/>
          </div>
        </section>
        <RecordPanel key={item.id} item={item} onSave={record => {
          const saved = update({ ...item, record });
          if (saved) setMessage("AI Use Record saved.");
          return saved;
        }}/>
      </>}
    </div>
  </main>;
}

function BriefForm({ draft, setDraft, instructor, onCreate, storageBlocked }: {
  draft: Brief; setDraft: (brief: Brief) => void; instructor: string | null; onCreate: (brief: Brief) => void; storageBlocked: boolean;
}) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [note, setNote] = useState("");
  const [sender, setSender] = useState("");
  const [approved, setApproved] = useState(false);
  const [shareLink, setShareLink] = useState("");
  const fileInput = useRef<HTMLInputElement>(null);

  function patch(changes: Partial<Brief>) {
    setDraft({ ...draft, ...changes });
    setShareLink("");
  }

  function readBrief() {
    const result = assignmentBrief.safeParse(draft);
    if (result.success) return result.data;
    const first = result.error.issues[0].path[0];
    const instructions: Partial<Record<keyof Brief, string>> = {
      title: "Enter an assignment title.", course: "Enter the course name.", due: "Enter a valid due date.",
      instructions: "Enter between 10 and 16,000 characters of assignment instructions.",
      help: "Choose at least one way you’d like help.",
    };
    setError(instructions[first as keyof Brief] ?? "Review the assignment fields and try again.");
    return null;
  }

  async function upload(file: File) {
    setError("");
    setNote("");
    if (file.size > 5_000_000) { setError("Choose a file under 5 MB."); return; }
    setUploading(true);
    try {
      const payload = new FormData();
      payload.set("file", file);
      const response = await fetch("/api/assignments/extract", { method: "POST", body: payload });
      const result = z.object({ text: z.string().optional(), error: z.string().optional(), truncated: z.boolean().optional() }).parse(await response.json());
      if (!response.ok || !result.text) throw new Error(result.error || "This file couldn’t be read.");
      patch({ instructions: result.text });
      setNote(result.truncated ? "The first 16,000 characters were added. Review them before continuing." : "File text added. Review it before continuing.");
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : "This file couldn’t be read.");
    } finally {
      setUploading(false);
    }
  }

  function create(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    const brief = readBrief();
    if (brief) onCreate(brief);
  }

  function share() {
    setError("");
    setNote("");
    const brief = readBrief();
    if (!brief) return;
    const data = instructorShare.safeParse({ version: 1, instructor: sender, brief });
    if (!approved || !data.success) { setError("Enter your name and confirm you’re sharing guidance for your course."); return; }
    const url = new URL("/assignments", location.origin);
    url.hash = new URLSearchParams({ template: JSON.stringify(data.data) }).toString();
    setShareLink(url.href);
  }

  return <form className="aw-form" onSubmit={create} noValidate>
    <fieldset disabled={uploading || Boolean(instructor)} className="aw-fields">
      <div className="aw-columns">
        <Field name="Assignment title"><input required maxLength={140} value={draft.title} onChange={event => patch({ title: event.target.value })}/></Field>
        <Field name="Course name"><input required maxLength={100} value={draft.course} onChange={event => patch({ course: event.target.value })}/></Field>
        <Field name="Due date"><input required type="date" value={draft.due} onChange={event => patch({ due: event.target.value })}/></Field>
        <Field name="Assignment type"><select value={draft.type} onChange={event => patch({ type: event.target.value as Brief["type"] })}>{types.map(type => <option key={type}>{type}</option>)}</select></Field>
      </div>
      <Field name="Assignment instructions"><textarea required rows={6} maxLength={16000} value={draft.instructions} onChange={event => patch({ instructions: event.target.value })}/></Field>
      {!instructor && <div>
        <input ref={fileInput} type="file" className="sr-only" tabIndex={-1} aria-label="Select an instructions file" accept=".pdf,.docx,.txt,.md,.csv" onChange={event => {
          const file = event.currentTarget.files?.[0];
          event.currentTarget.value = "";
          if (file) void upload(file);
        }}/>
        <button className="aw-button" type="button" onClick={() => fileInput.current?.click()}><FilePlus size={16} aria-hidden="true"/>{uploading ? "Reading file…" : "Upload instructions"}</button>
        <p className="aw-muted">PDF, DOCX, TXT, Markdown, or CSV under 5 MB. Upload replaces the text above.</p>
      </div>}
      <Field name="AI-use permission"><select value={draft.permission} onChange={event => patch({ permission: event.target.value as Brief["permission"] })}>{permissions.map(permission => <option key={permission}>{permission}</option>)}</select></Field>
      <Field name="Professor’s AI-use rules"><textarea rows={3} maxLength={3000} value={draft.rules} onChange={event => patch({ rules: event.target.value })} placeholder="For example, brainstorming is allowed if I disclose it."/></Field>
    </fieldset>
    <fieldset className="aw-help" disabled={uploading}>
      <legend>What would you like help with?</legend>
      {helpOptions.map(help => <label className="aw-check" key={help}><input type="checkbox" checked={draft.help.includes(help)} onChange={event => patch({ help: event.target.checked ? [...draft.help, help] : draft.help.filter(value => value !== help) })}/><span>{help}</span></label>)}
    </fieldset>
    {error && <p className="aw-notice aw-error" role="alert">{error}</p>}
    {note && <p className="aw-notice" role="status">{note}</p>}
    <div className="aw-actions"><button className="aw-button aw-primary" disabled={uploading || storageBlocked}>Create assignment plan</button></div>
    {!instructor && <details className="aw-share">
      <summary>Share guidance as an instructor</summary>
      <p>The link contains the assignment instructions, rules, and your name. Anyone with the link can open it. Share only material you’re allowed to distribute.</p>
      <Field name="Instructor name"><input maxLength={100} value={sender} onChange={event => { setSender(event.target.value); setShareLink(""); }}/></Field>
      <label className="aw-check"><input type="checkbox" checked={approved} onChange={event => { setApproved(event.target.checked); setShareLink(""); }}/><span>I’m an instructor and approve sharing these instructions for my course.</span></label>
      <button className="aw-button" type="button" onClick={share} disabled={uploading}>Create template link</button>
      {shareLink && <div className="aw-fields">
        <Field name="Instructor template link"><input readOnly value={shareLink} onFocus={event => event.target.select()}/></Field>
        <div className="aw-actions"><button className="aw-button" type="button" onClick={async () => {
          try { await copy(shareLink); setNote("Template link copied."); setError(""); }
          catch { setError("Couldn’t copy automatically. Select and copy the link above."); }
        }}>Copy template link</button></div>
      </div>}
    </details>}
  </form>;
}

function RecordPanel({ item, onSave }: { item: Assignment; onSave: (record: UseRecord) => boolean }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(item.record);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function copyRecord() {
    try { await copy(recordText(item.record, item.brief.title)); setMessage("Record copied."); setError(""); }
    catch { setError("Clipboard unavailable. Download the record or copy it from the editor."); }
  }

  function exportRecord(format: "md" | "json") {
    const payload = { assignment: item.brief.title, course: item.brief.course, record: item.record };
    download("promptlife-ai-use-record." + format, format === "md" ? "text/markdown" : "application/json",
      format === "md" ? recordText(item.record, item.brief.title) : JSON.stringify(payload, null, 2));
    setMessage(format === "md" ? "Markdown download started." : "JSON export started.");
    setError("");
  }

  return <section className="aw-panel" aria-labelledby="aw-record-title">
    <h2 id="aw-record-title">AI Use Record</h2>
    <p>Update this record to reflect the assistance you actually used. Check your professor’s disclosure requirements before sharing it.</p>
    <p className="aw-muted"><time dateTime={item.record.time}>{timeFormat.format(new Date(item.record.time))}</time></p>
    {message && <p className="aw-notice" role="status">{message}</p>}
    {error && <p className="aw-notice aw-error" role="alert">{error}</p>}
    {editing ? <form className="aw-form" onSubmit={event => {
      event.preventDefault();
      if (onSave(draft)) { setEditing(false); setMessage(""); }
    }}>
      {Object.entries(recordFields).map(([key, label]) => {
        const field = key as keyof typeof recordFields;
        return <Field key={key} name={label}><textarea rows={5} maxLength={30000} value={draft[field]} onChange={event => setDraft({ ...draft, [field]: event.target.value })}/></Field>;
      })}
      <div className="aw-actions"><button className="aw-button aw-primary" type="submit">Save record</button><button className="aw-button" type="button" onClick={() => setEditing(false)}>Cancel</button></div>
    </form> : <>
      <dl className="aw-record">
        {Object.entries(recordFields).map(([key, label]) => <div key={key}>
          <dt>{label}</dt>
          <dd>{key === "assistance" && item.record.assistance
            ? <details className="aw-record-detail"><summary>Read recorded assistance</summary><p>{item.record.assistance}</p></details>
            : item.record[key as keyof typeof recordFields] || "—"}</dd>
        </div>)}
      </dl>
      <div className="aw-actions">
        <button className="aw-button aw-primary" onClick={() => { setDraft(item.record); setEditing(true); setMessage(""); setError(""); }}>Edit record</button>
        <button className="aw-button" onClick={copyRecord}>Copy record</button>
        <button className="aw-button" onClick={() => exportRecord("md")}>Download Markdown</button>
        <button className="aw-button" onClick={() => exportRecord("json")}>Export JSON</button>
      </div>
    </>}
  </section>;
}
