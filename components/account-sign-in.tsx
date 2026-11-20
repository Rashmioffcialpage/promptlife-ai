"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { Eye, EyeOff } from "lucide-react";
import { AuthMascot } from "./auth-mascot";
import { Dialog, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { pendingTemplateKey } from "@/lib/browser-work";
import { roles, type Role } from "@/lib/account-model";

type Mode = "signin" | "create";

function PasswordField({ label, name, value, onChange, create }: {
  label: string; name: string; value: string; onChange: (value: string) => void; create: boolean;
}) {
  const [visible, setVisible] = useState(false);
  return <div className="auth-field">
    <label htmlFor={name}>{label}</label>
    <div className="auth-password">
      <input id={name} required type={visible ? "text" : "password"} value={value} onChange={event => onChange(event.target.value)} minLength={create ? 12 : undefined} maxLength={128} autoComplete={create ? "new-password" : "current-password"}/>
      <button type="button" aria-label={`${visible ? "Hide" : "Show"} ${label.toLowerCase()}`} aria-controls={name} onClick={() => setVisible(!visible)}>{visible ? <EyeOff size={17}/> : <Eye size={17}/>}</button>
    </div>
  </div>;
}

export function AccountSignIn({ initialOpen = false, error }: { initialOpen?: boolean; error?: string }) {
  const [open, setOpen] = useState(initialOpen);
  const [role, setRole] = useState<Role | null>(null);
  const [mode, setMode] = useState<Mode>("signin");
  const [message, setMessage] = useState(error || "");
  const [busy, setBusy] = useState<"email" | "google" | null>(null);
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [accepted, setAccepted] = useState(false);
  const attempt = useRef<AbortController | null>(null);
  const focus = useRef<HTMLDivElement>(null);
  const create = mode === "create";

  useEffect(() => {
    const hash = location.hash;
    if (hash.startsWith("#template=") && hash.length <= 120000) {
      try { sessionStorage.setItem(pendingTemplateKey, hash); } catch {}
    }
  }, []);

  function changeOpen(value: boolean) {
    setOpen(value);
    if (!value) {
      attempt.current?.abort();
      attempt.current = null;
      setBusy(null);
      setMessage("");
      setPassword("");
      setConfirm("");
    }
  }

  function changeMode(value: Mode) {
    setMode(value);
    setMessage("");
    setPassword("");
    setConfirm("");
    setAccepted(false);
    requestAnimationFrame(() => focus.current?.focus());
  }

  async function authenticate(kind: "email" | "google") {
    if (!role || busy) return;
    setMessage("");
    if (create && !accepted) { setMessage("Agree to the Terms of Use and Privacy Policy to create an account."); return; }
    if (kind === "email" && create && password !== confirm) { setMessage("Passwords don’t match."); return; }
    const control = new AbortController();
    attempt.current = control;
    setBusy(kind);
    try {
      const response = await fetch("/api/auth/" + kind, {
        method: "POST", headers: { "Content-Type": "application/json" }, signal: control.signal,
        body: JSON.stringify(kind === "email" ? { mode, role, email, fullName, password, confirm, accepted } : { mode, role, accepted }),
      });
      const data = await response.json() as { error?: string; next?: string };
      if (!response.ok || !data.next) { setMessage(data.error || "Something went wrong. Please try again."); return; }
      window.location.assign(data.next);
    } catch {
      if (!control.signal.aborted) setMessage("Couldn’t reach PromptLife. Please try again.");
    } finally {
      if (attempt.current === control) { attempt.current = null; setBusy(null); }
    }
  }

  return <Dialog open={open} onOpenChange={changeOpen}>
    <DialogTrigger asChild><button type="button" className="account-link">Sign in</button></DialogTrigger>
    <DialogContent className="sign-dialog auth-dialog">
      <div className="auth-brand auth-mascot-brand"><AuthMascot/><span>PromptLife AI</span></div>
      <div ref={focus} tabIndex={-1}>
        <DialogTitle className="sign-dialog-title">Welcome to PromptLife</DialogTitle>
        <DialogDescription className="sign-dialog-copy">{role ? `Continue as a ${role}` : "How will you use PromptLife?"}</DialogDescription>
      </div>
      {message && <p className="sign-dialog-message" role="alert">{message}</p>}
      {!role ? <div className="auth-roles" role="group" aria-label="Choose your primary role">
        {roles.map(option => <button key={option} type="button" className="sign-dialog-method" onClick={() => { setRole(option); requestAnimationFrame(() => focus.current?.focus()); }}>{option}</button>)}
      </div> : <>
        <button type="button" className="auth-link auth-change" disabled={!!busy} onClick={() => { setRole(null); setMessage(""); setPassword(""); setConfirm(""); setAccepted(false); requestAnimationFrame(() => focus.current?.focus()); }}>Change role</button>
        {!create && <button className="sign-dialog-method auth-google" disabled={!!busy} onClick={() => void authenticate("google")}><img src="/google-g.svg" width="18" height="18" alt=""/>{busy === "google" ? "Connecting…" : "Continue with Google"}</button>}
        {!create && <div className="auth-divider">or continue with email</div>}
        <form className="auth-form" onSubmit={(event: FormEvent) => { event.preventDefault(); void authenticate("email"); }}>
          <fieldset disabled={!!busy} className="auth-fields">
            {create && <label className="auth-field">Full name<input autoComplete="name" required maxLength={150} value={fullName} onChange={event => setFullName(event.target.value)}/></label>}
            <label className="auth-field">Email address<input type="email" autoComplete="email" required maxLength={254} value={email} onChange={event => setEmail(event.target.value)}/></label>
            <PasswordField key={mode} name="promptlife-password" label="Password" value={password} onChange={setPassword} create={create}/>
            {create && <>
              <small>Use at least 12 characters.</small>
              <PasswordField name="promptlife-confirm" label="Confirm password" value={confirm} onChange={setConfirm} create/>
              <p className="auth-selected">Primary role · {role}</p>
              <div className="auth-terms"><input id="auth-terms" type="checkbox" required checked={accepted} onChange={event => setAccepted(event.target.checked)}/><span><label htmlFor="auth-terms">I agree to the</label> <a href="/terms" target="_blank" rel="noreferrer">Terms of Use</a> and <a href="/privacy" target="_blank" rel="noreferrer">Privacy Policy</a></span></div>
            </>}
            <button className="sign-dialog-method sign-dialog-primary" type="submit">{busy === "email" ? (create ? "Creating account…" : "Signing in…") : (create ? "Create Account" : "Sign In")}</button>
          </fieldset>
        </form>
        {create && <button className="sign-dialog-method auth-google" disabled={!!busy} onClick={() => void authenticate("google")}><img src="/google-g.svg" width="18" height="18" alt=""/>{busy === "google" ? "Connecting…" : "Sign up with Google"}</button>}
        <p className="auth-switch">{create ? "Already have an account? " : "Don’t have an account? "}<button type="button" className="auth-link" disabled={!!busy} onClick={() => changeMode(create ? "signin" : "create")}>{create ? "Sign In" : "Create Account"}</button></p>
      </>}
    </DialogContent>
  </Dialog>;
}
