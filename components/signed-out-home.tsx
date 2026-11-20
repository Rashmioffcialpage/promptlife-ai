import { AccountSignIn } from "./account-sign-in";

export function SignedOutHome({ initialOpen, error }: { initialOpen?: boolean; error?: string }) {
  return <main className="auth-landing">
    <header className="auth-landing-header"><a className="auth-brand" href="/"><span className="auth-robot" aria-hidden="true"><img src="/student-help-mascot-auth.webp" alt=""/></span>PromptLife AI</a>
      <AccountSignIn initialOpen={initialOpen} error={error}/>
    </header>
    <section className="auth-landing-copy">
      <h1>Plan your work with PromptLife.</h1>
      <p>Sign in to prepare prompts, track assignments, and organize your academic work.</p>
      <a href="/demo">Watch the product demo</a>
    </section>
  </main>;
}
