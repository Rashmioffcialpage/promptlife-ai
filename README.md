# PromptLife AI

PromptLife AI is a student-focused prompt preparation and learning application. Students describe a real situation in ordinary language, answer only the important missing questions, and receive a structured prompt they can review, hear aloud, copy, or continue in ChatGPT, Gemini, Claude, Perplexity, or Copilot.

Live application: [promptlife-ai.rashmithimmaraju14.chatgpt.site](https://promptlife-ai.rashmithimmaraju14.chatgpt.site)
<img width="1103" height="1426" alt="PromptLife AI student productivity flyer" src="https://github.com/user-attachments/assets/6607159f-46c8-4702-bee6-b06fe2996b8f" />


## Main features

- Student-friendly prompt creator with one recommended result
- Adaptive follow-up questions
- Prompt Passport for reusable student context
- Sign in and cloud-saved prompt history
- Personal dashboard with recent prompts, favorites, and progress
- Course, research, and career workspaces
- PDF, DOCX, TXT, Markdown, and CSV uploads
- English, Spanish, French, and Hindi prompt generation
- Simple-language mode and browser text-to-speech
- Learning-progress indicators
- Responsive sidebar controlled by the PromptLife robot logo
- Responsible-AI guidance and verification reminders

## Technology

- React 19 and TypeScript
- Next.js-compatible App Router through Vinext
- Vite and Tailwind CSS
- Cloudflare Workers, D1, and R2
- Drizzle ORM
- Sign in with ChatGPT on the hosted application
- Browser Web Speech API

## Project structure

    app/
      account/               Account dashboard and cloud history
      api/                   Prompt, file, history, and workspace APIs
      demo/                  Product demonstration page
      page.tsx               Main PromptLife workspace
    components/ui/           Reusable interface components
    db/                      Drizzle database schema and helpers
    drizzle/                 D1 database migrations
    public/                   PromptBot image, video, and public assets
    scripts/                  Development and build scripts

## Run in VS Code

### 1 Install prerequisites

Install Git, Node.js 22.13 or newer, and Visual Studio Code. Confirm them:

    git --version
    node --version
    npm --version

### 2 Download the project

After the repository is available on GitHub:

    git clone YOUR_GITHUB_REPOSITORY_URL
    cd promptlife-ai
    code .

You can also download the source ZIP, extract it, open VS Code, and choose File then Open Folder.

### 3 Install dependencies

Open the VS Code terminal and run:

    corepack enable
    corepack prepare pnpm@11.25.0 --activate
    pnpm install --frozen-lockfile

No API key is required for the current deterministic prompt-generation workflow.

### 4 Start the application

    pnpm dev

Open http://localhost:5173 and stop the server with Control C.

## Enable all local cloud-style features

Prompt creation and the main interface work immediately. Cloud history, workspaces, and uploaded-file records use a local Cloudflare D1 database. Build once:

    pnpm build

Apply the included migrations in order:

    node --import ./scripts/sites-env.mjs ./node_modules/wrangler/bin/wrangler.js d1 execute DB --local --config dist/server/wrangler.json --persist-to .wrangler/state --file drizzle/0000_aspiring_kree.sql
    node --import ./scripts/sites-env.mjs ./node_modules/wrangler/bin/wrangler.js d1 execute DB --local --config dist/server/wrangler.json --persist-to .wrangler/state --file drizzle/0001_fearless_captain_stacy.sql
    node --import ./scripts/sites-env.mjs ./node_modules/wrangler/bin/wrangler.js d1 execute DB --local --config dist/server/wrangler.json --persist-to .wrangler/state --file drizzle/0002_numerous_dracula.sql
    node --import ./scripts/sites-env.mjs ./node_modules/wrangler/bin/wrangler.js d1 execute DB --local --config dist/server/wrangler.json --persist-to .wrangler/state --file drizzle/0003_shallow_piledriver.sql

The commands work in macOS, Linux, and Windows PowerShell. Restart the development server after applying them. Local D1 and R2 data are stored inside .wrangler and are ignored by Git.

## Test local sign in

The portable development profile includes a mock student account. While the server is running, open:

    http://localhost:5173/signin-with-chatgpt?return_to=/

To sign out:

    http://localhost:5173/signout-with-chatgpt?return_to=/

The mock account is used only on your computer. Hosted sign-in is managed by the deployment platform.

## Useful commands

| Command | Purpose |
| --- | --- |
| pnpm dev | Start the development server with live reload |
| pnpm build | Create a production build |
| pnpm start | Preview the built Cloudflare Worker locally |
| pnpm lint | Run code-quality checks |
| pnpm db:generate | Generate a migration after changing db/schema.ts |

## Common problems

### The port is already in use

    pnpm dev -- --port 5174

Then open http://localhost:5174.

### The database table does not exist

Run the build and all four D1 migration commands from the project root.

### File upload does not work locally

Confirm that the development server is using the Cloudflare local runtime and that .wrangler is writable. Restart the server after migrations.

### The Listen button has no sound

Allow browser audio and install a system voice for the selected language. Speech quality depends on the browser and operating system.

### pnpm is unavailable

    corepack enable
    corepack prepare pnpm@11.25.0 --activate

## Responsible use

PromptLife AI helps students structure requests; it does not replace academic judgment. Students should follow each course's AI policy, verify facts and citations, avoid uploading restricted information, and remain responsible for submitted work.

## Author

Rashmi Thimmaraju
MS in Artificial Intelligence, Long Island University
