# AI Workflow

How AI coding tools were used to build this assessment. The Running log at the bottom was
written while working; the four sections above it summarise it.

## 1. Tools used and why

- **Claude Code (CLI)** did all planning, coding, verification and commits. It can run
  commands, so it could check its own work: `npm view` for versions, the docs bundled in
  `node_modules`, tests, `next build`, and curl against the running server.
- **Spec Kit** (`/speckit-*` skills inside Claude Code) for spec-driven development:
  constitution → specify → clarify → plan → tasks → implement. The 2–3 hour time box
  rewards deciding scope up front. Spec Kit gave the assistant written acceptance criteria to
  build and test against, and the artefacts double as evidence of the process
  ([`specs/001-indie-games-dashboard/`](specs/001-indie-games-dashboard/)).
- **Models:** Claude Opus 5.5 for most of the session. I switched to Claude Fable 5.1 with
  `/model` for the constitution, spec, clarify, plan and tasks steps, then back to Opus for
  implementation.
- **No Cursor or Copilot.** One agentic tool with shell access was enough, and kept the whole
  history in one transcript.

## 2. Prompts and outcomes

1. **`/speckit-specify indie games dashboard with CRUD, REST API and streaming AI chat`**:
   a deliberately short prompt. The constitution, which was derived from the brief's grading
   table, supplied the constraints. Outcome: a spec with 3 prioritised user stories, 24
   testable requirements and 8 measurable success criteria, with no clarification markers
   left.
2. **`/speckit-clarify does it make sense to create a docker-compose and have a docker for
   the app and another for db? is any other container needed? suggestions?`**. Outcome: the
   assistant argued against it. Deployment is out of scope, SQLite is embedded, and every
   reviewer has Node but not every reviewer runs Docker. I chose option A, a single local
   process, which became clarification Q1 and tightened SC-006 to "Node + API key only".
3. **"the recommendation for storage is SQLite? via better-sqlite3 or Drizzle?"** Outcome:
   Drizzle on better-sqlite3, chosen because `drizzle-zod` gives one schema shared by the API,
   the form and the AI tools. It's now the core of the code (`src/lib/db/schema.ts`). During
   planning the assistant also checked whether Node's built-in `node:sqlite` could avoid a
   native module. It couldn't: Drizzle has no driver for it.
4. **"before implementing, does it make sense to commit?"** Outcome: yes. The planning
   artefacts went in as two commits before any code, so the history shows
   spec → plan → tasks → code in order and gave a rollback point before the scaffold merge.
5. **`/speckit-implement`**: executed the 44 tasks phase by phase, with a commit at each
   checkpoint. Before writing any SDK call, the assistant read the installed package's docs
   or `.d.ts` instead of relying on memory. That caught several API changes; see section 3
   and the Running log.

## 3. Where the AI got it wrong

**The plan's Next.js caching instructions were wrong for the installed version.** During
`/speckit-plan` the assistant planned `export const dynamic = 'force-dynamic'` on every route
that reads the database. That's the standard pattern from earlier Next.js versions. But
`create-next-app@16.4` turns on `cacheComponents: true` by default, and in that mode route
segment `dynamic` is **removed**. Worse, better-sqlite3 is synchronous, so its queries finish
during prerendering. Without a fix, `GET /api/games` and the dashboard would have been
**frozen at build time and served stale in production**, while looking fine in `next dev`.

*How it was caught:* the scaffold generated an `AGENTS.md` that says "This is NOT the Next.js
you know… read `node_modules/next/dist/docs/`". Grepping those docs for `better-sqlite3`
turned up the exact case.
*Fix:* `await connection()` before every read in a page or `GET` handler, and `<Suspense>`
around the dashboard's data. *Verified:* `next build` lists `/` as Partial Prerender and the
API routes as dynamic, and against `next start` the list went from 12 to 13 rows after a
`POST`. The deviation is recorded at the top of
[`tasks.md`](specs/001-indie-games-dashboard/tasks.md).

A smaller one: the assistant stopped the dev server with `pkill -f 'next dev'`. That also
matched the shell running its own test script, so the script killed itself halfway through
a check. It was spotted from the truncated output and fixed with `fuser -k 3000/tcp`.

## 4. Parallel agents / subagents / worktrees

**None were used for implementation, on purpose.** The codebase is about 1,300 lines, and
the stories share a foundation (schema → repository → routes) that had to land first. After
that, each phase took 3–10 minutes of agent time. Splitting across agents or worktrees would
have added merge and coordination cost for little gain. `tasks.md` still marks the
parallelisable tasks (`[P]`, 14 of 44), and the three user stories are independent once the
foundation exists. On a larger feature, I'd give US1 and US2 to separate agents in separate
git worktrees.

Within the single session, the assistant still parallelised: independent tool calls (file
writes, docs lookups, `npm view` checks) went out together, and the AI SDK was installed in a
scratch directory to read its docs during planning without touching the project.

---

## Running log

### Planning (Spec Kit)

Tool: Claude Code with the Spec Kit skills (`/speckit-*`). Every planning artefact is in
[`specs/001-indie-games-dashboard/`](specs/001-indie-games-dashboard/) and was committed
before any code was written.

| Step | Command | Output |
|---|---|---|
| Constitution | `/speckit-constitution` (no input; derived from the brief) | [`.specify/memory/constitution.md`](.specify/memory/constitution.md): 5 principles mapped to the grading weights |
| Spec | `/speckit-specify indie games dashboard with CRUD, REST API and streaming AI chat` | [`spec.md`](specs/001-indie-games-dashboard/spec.md): 3 prioritised stories, 24 FRs, 8 success criteria |
| Clarify | `/speckit-clarify does it make sense to create a docker-compose …?` | 2 clarifications recorded in the spec |
| Plan | `/speckit-plan` | plan, research, data model, 3 contracts, quickstart |
| Tasks | `/speckit-tasks` | [`tasks.md`](specs/001-indie-games-dashboard/tasks.md): 44 tasks by user story |

- **[prompt] Docker or not.** I asked during `/speckit-clarify` whether to use
  docker-compose with separate app and DB containers. The assistant recommended against it:
  the brief puts deployment out of scope, SQLite is embedded, and reviewers only need Node.
  I accepted. Recorded as clarification Q1, which tightened success criterion SC-006.
- **[prompt] Storage choice.** "The recommendation for storage is SQLite? via better-sqlite3
  or Drizzle?" The answer was Drizzle on better-sqlite3, so that `drizzle-zod` gives one
  validation schema shared by the API, the form and the AI tools (constitution principle III).
  Accepted.
- **Verifying versions instead of trusting memory.** During `/speckit-plan` the assistant ran
  `npm view` for every package and installed the AI SDK in a scratch directory to read its
  bundled docs. That surfaced several AI SDK 7 changes that differ from older examples
  (`isStepCount`, `inputSchema`, `instructions`, `createAgentUIStreamResponse`), recorded in
  [research.md §12](specs/001-indie-games-dashboard/research.md).
- Models: planning used Claude Opus 5.5 and Claude Fable 5.1 (switched with `/model`).

### Setup (T001–T007)

- Scaffolded with `create-next-app@16.4.2` in a scratch directory, then merged into the repo
  so the existing README, `.gitignore` and planning files were not overwritten.
- **[wrong] The plan's Next.js caching advice was out of date.** The plan said to put
  `export const dynamic = 'force-dynamic'` on every route. The scaffold turned on
  `cacheComponents: true` by default, and the Next 16 docs bundled in `node_modules` say
  route segment `dynamic` is *removed* in that mode. A synchronous `better-sqlite3` read
  would then have been **prerendered at build time and served stale**. Fix: call
  `await connection()` before reads and put the dashboard data behind `<Suspense>`. The
  scaffold's own `AGENTS.md` ("This is NOT the Next.js you know") pointed at those docs.
- Also from the bundled docs: `better-sqlite3` is already in Next's built-in
  `serverExternalPackages` list, so the planned config line was dropped.
- `npm i -D vitest@5` failed with ERESOLVE because the scaffold pins `@types/node@^20` and
  vitest 5 needs `^22 || >=24`. Fixed by bumping to `@types/node@^22`, which matches the
  project's `engines.node >= 22`, rather than using `--legacy-peer-deps`.
- The scaffold's `.gitignore` contains `.env*`, which would have ignored `.env.example`. Only
  the non-conflicting lines were merged.
- `tsc --noEmit` failed on a fresh checkout (`Cannot find name 'LayoutProps'`) because Next 16
  generates those global types at dev/build time. Fixed with the
  `next typegen && tsc --noEmit` script.

### Foundation (T008–T017)

- Schema, seed, DB client, repository, REST write routes and 12 repository tests.
- Design change while implementing: the plan had repository functions take an optional `db`
  argument. A `createRepository(db)` factory turned out cleaner. Tests get an in-memory
  repository, and the app uses `getRepository()`, which opens `data/games.db` lazily so
  `next build` never creates or seeds the file.
- The first typecheck failed: a helper typed as `typeof games.title` would not accept the
  `genre` column, because Drizzle column types carry the column name. Fixed with a union type.
- Vite warned that `vitest.config.ts` used ESM in a CommonJS package. Renamed to `.mts`.
- Smoke test against `next dev`: every status code and error body matched
  `contracts/games-api.md` on the first run, including `404` before body validation for
  stale edits.

### Dashboard (T018–T024)

- Server-rendered table, native `<dialog>` form that validates on the client with the same
  `gameInputSchema` the API uses, confirm-before-delete, and an empty state.
- Cache Components in practice: the page is a static shell, and the catalog streams inside
  `<Suspense>` after `await connection()`. The `next build` route table shows `/` as
  "Partial Prerender", which confirms the catalog is not frozen at build time.
- **[wrong] The assistant's own test script killed itself.** It stopped the dev server with
  `pkill -f 'next dev'`, which also matched the shell running the script, because its command
  line contained that string. The script aborted before the empty-catalog restart check ran.
  It was rerun with `fuser -k 3000/tcp`.
- Verified over HTTP: 12 seeded rows with formatted values, POST shows up after reload, and
  deleting all games then restarting shows the empty state with no reseed. No browser tool was
  available in the session, so the dialog interactions still need a manual click-through.

### Chat assistant (T025–T034)

- `ToolLoopAgent` (AI SDK 7) on `claude-opus-5-5` with `effort: "low"`, four lookup tools,
  `stopWhen: isStepCount(5)`, served by `createAgentUIStreamResponse`. The prompt contains
  rules only; every fact comes from a tool call.
- Resolved the plan's open item by reading the installed SDK's `.d.ts` rather than guessing:
  `createAgentUIStreamResponse` accepts all `UIMessageStreamOptions`, so
  `sendReasoning: false` hides the empty reasoning parts that adaptive-thinking models
  emit, and `onError` replaces the default `"An error occurred."` with a useful message.
- Found SDK helpers (`isToolUIPart`, `getToolName`, `isTextUIPart`) by grepping the type
  definitions, instead of hand-writing `part.type.startsWith("tool-")`.
- Tools take `() => Repository`, so importing the chat route (which `next build` does)
  never opens the database file, and tests can inject an in-memory repository.
- Typecheck caught that `tool.execute()` returns `T | AsyncIterable<T>` (streaming tools).
  Tests use a small typed `run()` helper instead of casting at every call.
- No API key was available in the session, so verification stopped at the provider. With
  no key the route returns `500 ai_not_configured`. With a dummy key the response is a
  proper UI-message SSE stream, Anthropic returns "invalid x-api-key", `onError` logs it,
  and the client receives the friendly message. The 10 scripted questions (T033) are pending
  a real key.

### REST API (T035–T038)

- Added `GET /api/games` and `GET /api/games/[id]`, each calling `await connection()` first.
- Ran the full contract walkthrough against `next start` (production), not just `next dev`,
  because a prerendered `GET` would only go stale in production. The list went from 12 to 13
  after a create, so it is not frozen at build time. All 13 status codes and bodies matched
  `contracts/games-api.md`.

### Live chat evaluation (T033)

Once the API key was in `.env.local`, the assistant wrote a small Node script that plays the
10 scripted questions from `quickstart.md` as one conversation against `next start`. It
parses the SSE stream and records the tool calls, the time to the first lookup chip, the time
to the first text token, and the answer.

- **10/10 factually correct (SC-002).** Every answer came from a tool call. The follow-up
  "And at least 4?" switched `op` from `gt` to `gte` and returned 8. A missing game was
  reported as not found. The off-topic weather question was declined with no tool call.
  "Lantern" made the assistant ask which of the two matches was meant.
- **SC-004:** after `PUT` set Hollow Depths' revenue to $50,000, the next "most revenue"
  answer was Stardust Farm at $98,000, with no restart.
- **[wrong] Markdown in a plain-text UI.** Four answers used `**bold**`, which the chat
  displays literally. Fixed with one prompt rule ("plain text, `- ` lists only"), and those
  questions were rerun to confirm.
- **SC-003 latency only partly met.** The lookup chip appears at 0.9–2.2 s, but the first
  words of text arrive at 2.6–4.4 s. That's slower than the 3 s target, because a tool
  answer needs two model round trips (pick a tool, then answer) and the text comes in one
  short burst at the end.
