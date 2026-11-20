"use client";

import { importBrowserWork } from "@/lib/browser-work";
import { useState, useSyncExternalStore } from "react";
import { fields, roles, routeForRole, type Role } from "@/lib/account-model";

const subscribe = () => () => {};
const clientReady = () => true;
const serverReady = () => false;

export default function ProfileForm({ userId, role, accountRoles, profile, onboarding, googleLinked, initialMessage, initialError }: {
  userId: string; role: Role; accountRoles: Role[]; profile: Record<string, string>; onboarding: boolean;
  googleLinked: boolean; initialMessage: string; initialError: string;
}) {
  const ready = useSyncExternalStore(subscribe, clientReady, serverReady);
  const [details, setDetails] = useState(profile);
  const [importStatus, setImportStatus] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(initialError);
  const available = roles.filter(value => !accountRoles.includes(value));
  const [newRole, setNewRole] = useState<Role | "">("");
  const [switchRole, setSwitchRole] = useState<Role>(role);

  async function send(path: string, body: object) {
    setBusy(true);
    setError("");
    try {
      const result = await fetch(path, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const data = await result.json() as { next?: string; error?: string };
      if (!result.ok || !data.next) { setError(data.error || "Couldn’t save your profile."); return; }
      location.assign(data.next);
    } catch { setError("Couldn’t reach PromptLife. Please try again."); }
    finally { setBusy(false); }
  }

  return <main className="aw-page"><div className="aw-wrap auth-profile">
    {!onboarding && <a className="aw-home" href={routeForRole(role)}>Back to dashboard</a>}
    <section className="aw-panel">
      <h1>{onboarding ? "Complete your profile" : "Your profile"}</h1>
      <p>{role} · These details are optional and can be changed later.</p>
      {initialMessage && <p className="aw-notice" role="status">{initialMessage}</p>}
      {error && <p className="aw-notice aw-error" role="alert">{error}</p>}
      <form className="aw-form" onSubmit={event => { event.preventDefault(); void send("/api/auth/profile", { action: "save", details }); }}>
        <fieldset className="aw-fields" disabled={!ready || busy}>
          {Object.entries(fields[role]).map(([key, label]) => <label className="aw-field" key={key}>{label}
            <input type={key === "graduation" ? "date" : "text"} value={details[key] ?? ""} maxLength={300}
              placeholder={key === "orcid" ? "0000-0000-0000-000X" : undefined}
              onChange={event => setDetails({ ...details, [key]: event.target.value })}/>
          </label>)}
          <div className="aw-actions"><button className="aw-button aw-primary">{busy ? "Saving…" : "Save profile"}</button>
            {onboarding && <button type="button" className="aw-button" onClick={() => void send("/api/auth/profile", { action: "skip" })}>Skip for now</button>}
          </div>
        </fieldset>
      </form>
      {!onboarding && <div className="aw-form">
        {accountRoles.length > 1 && <div className="aw-fields">
          <label className="aw-field">Change role<select value={switchRole} disabled={!ready || busy} onChange={event => setSwitchRole(event.target.value as Role)}>{accountRoles.map(value => <option key={value}>{value}</option>)}</select></label>
          <div><button className="aw-button" disabled={!ready || busy || switchRole === role} onClick={() => void send("/api/auth/profile", { action: "switch", role: switchRole })}>Open selected dashboard</button></div>
        </div>}
        {available.length > 0 && <div className="aw-fields">
          <label className="aw-field">Add another role<select value={newRole} disabled={!ready || busy} onChange={event => setNewRole(event.target.value as Role | "")}><option value="">Choose a role</option>{available.map(value => <option key={value}>{value}</option>)}</select></label>
          <div><button className="aw-button" disabled={!ready || busy || !newRole} onClick={() => void send("/api/auth/profile", { action: "add", role: newRole })}>Add role</button></div>
        </div>}
        <details>
          <summary>Restore earlier browser work</summary>
          <p>Import assignments, prompt history, and favorites saved by an earlier version in this browser. Only import work that belongs to you.</p>
          <button type="button" className="aw-button" disabled={!ready || busy} onClick={() => {
            try { setImportStatus(importBrowserWork(userId) ? "Earlier browser work imported." : "No earlier work was found in this browser."); }
            catch { setImportStatus("The earlier browser work couldn’t be read."); }
          }}>Import earlier work</button>
          {importStatus && <p role="status">{importStatus}</p>}
        </details>
        {googleLinked ? <p>Google is linked.</p> : <div><button className="aw-button" disabled={!ready || busy} onClick={() => void send("/api/auth/google", { mode: "link", role })}>Link Google account</button></div>}
      </div>}
    </section>
  </div></main>;
}
